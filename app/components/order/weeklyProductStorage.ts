import { supabase } from "@/lib/supabase";
import { weeklyProducts, type WeeklyProduct } from "./products";

export async function getWeeklyProducts(weekLabel?: string): Promise<WeeklyProduct[]> {
  const activeWeek = weekLabel?.trim() || "default";
  try {
    const { data, error } = await supabase
      .from("weekly_products")
      .select("*")
      .eq("week_label", activeWeek);

    if (error) throw error;

    if (!data || data.length === 0) {
      // Seed default catalog products for this week
      const payload = weeklyProducts.map((p) => ({
        id: p.id,
        week_label: activeWeek,
        name: p.name,
        default_qty: p.defaultQty,
        unit: p.unit,
        price: p.price,
        category: p.category,
      }));

      const { error: seedError } = await supabase
        .from("weekly_products")
        .upsert(payload, { onConflict: "id,week_label" });

      if (seedError) {
        console.error("Error seeding weekly products:", seedError);
        return weeklyProducts;
      }

      return weeklyProducts;
    }

    return (data as { id: string; name: string; default_qty: string; unit: string; price: string; category: string }[]).map((row) => ({
      id: row.id,
      name: row.name,
      defaultQty: parseFloat(row.default_qty),
      unit: row.unit,
      price: parseFloat(row.price || "0"),
      category: row.category as WeeklyProduct["category"],
    }));
  } catch (err) {
    console.error("Error fetching weekly products from Supabase:", err);
    return [];
  }
}

export async function addWeeklyProduct(
  product: Omit<WeeklyProduct, "id"> & { id?: string },
  weekLabel?: string,
): Promise<WeeklyProduct> {
  const activeWeek = weekLabel?.trim() || "default";
  const slug =
    product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item";

  let id = product.id ?? slug;
  const existingList = await getWeeklyProducts(activeWeek);

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const existing = existingList.find(
    (p) =>
      normalize(p.name) === normalize(product.name) &&
      p.category === product.category,
  );

  if (existing) {
    return existing;
  }

  if (existingList.some((p) => p.id === id)) {
    id = `${slug}-${Date.now()}`;
  }

  const entry = {
    id,
    week_label: activeWeek,
    name: product.name,
    default_qty: product.defaultQty,
    unit: product.unit,
    price: product.price,
    category: product.category,
  };

  try {
    const { error } = await supabase
      .from("weekly_products")
      .upsert(entry, { onConflict: "id,week_label" });
    if (error) throw error;
    window.dispatchEvent(new Event("occdc-weekly-products-updated"));
    window.dispatchEvent(new CustomEvent("occdc-order-action", {
      detail: { type: "product_added", productName: product.name, category: product.category },
    }));
  } catch (err) {
    const e = err as { message?: string; details?: string; hint?: string; code?: string };
    console.error(
      "Error adding weekly product to Supabase:",
      e?.message ?? err,
      e?.details ?? "",
      e?.hint ?? "",
      e?.code ?? "",
    );
  }

  return {
    id: entry.id,
    name: entry.name,
    defaultQty: entry.default_qty,
    unit: entry.unit,
    price: entry.price,
    category: entry.category,
  };
}

export async function updateWeeklyProduct(
  id: string,
  data: Partial<WeeklyProduct>,
  weekLabel?: string,
): Promise<void> {
  const activeWeek = weekLabel?.trim() || "default";
  
  const payload: Partial<{
    name: string;
    default_qty: number;
    unit: string;
    price: number;
    category: string;
  }> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.defaultQty !== undefined) payload.default_qty = data.defaultQty;
  if (data.unit !== undefined) payload.unit = data.unit;
  if (data.price !== undefined) payload.price = data.price;
  if (data.category !== undefined) payload.category = data.category;

  try {
    const { data: updatedData, error } = await supabase
      .from("weekly_products")
      .update(payload)
      .eq("id", id)
      .eq("week_label", activeWeek)
      .select();

    if (error) throw error;

    if (!updatedData || updatedData.length === 0) {
      // Row did not exist in weekly_products, let's insert it
      const insertPayload = {
        id,
        week_label: activeWeek,
        name: data.name ?? "Custom Product",
        default_qty: data.defaultQty ?? 1,
        unit: data.unit ?? "pc",
        category: data.category ?? "vegetables",
        price: data.price ?? 0,
      };
      const { error: insError } = await supabase
        .from("weekly_products")
        .insert(insertPayload);
      if (insError) throw insError;
    }

    // If price changed, cascade to all existing orders that contain this product
    if (data.price !== undefined) {
      const newPrice = data.price;
      const { data: orders, error: ordErr } = await supabase
        .from("orders")
        .select("id, items, total_price");

      if (!ordErr && orders) {
        for (const order of orders) {
          const items = order.items as Array<{ productId: string; price?: number; qty: number; [key: string]: unknown }> | null;
          if (!Array.isArray(items)) continue;

          const needsUpdate = items.some((it) => it.productId === id);
          if (!needsUpdate) continue;

          const updatedItems = items.map((it) =>
            it.productId === id ? { ...it, price: newPrice } : it
          );
          const totalPrice = updatedItems.reduce(
            (sum, it) => sum + (it.qty || 0) * ((it.productId === id ? newPrice : (it.price ?? 0))),
            0
          );

          await supabase
            .from("orders")
            .update({ items: updatedItems, total_price: totalPrice })
            .eq("id", order.id);

          const itemToUpdate = items.find((it) => it.productId === id);
          if (itemToUpdate) {
            await supabase
              .from("order_items")
              .update({
                price: newPrice,
                subtotal: (itemToUpdate.qty || 0) * newPrice,
              })
              .eq("order_id", order.id)
              .eq("product_id", id);
          }
        }
      }
    }

    window.dispatchEvent(new Event("occdc-weekly-products-updated"));
    window.dispatchEvent(new Event("occdc-orders-updated"));
    if (data.price !== undefined) {
      window.dispatchEvent(new CustomEvent("occdc-order-action", {
        detail: { type: "pricing_updated", productId: id, newPrice: data.price },
      }));
    } else {
      window.dispatchEvent(new CustomEvent("occdc-order-action", {
        detail: { type: "product_updated", productId: id },
      }));
    }
  } catch (err) {
    console.error("Error updating weekly product in Supabase:", err);
  }
}

export async function removeWeeklyProduct(id: string, weekLabel?: string): Promise<void> {
  const activeWeek = weekLabel?.trim() || "default";
  try {
    // Step 1: Fetch the product before deleting so we can archive it
    const { data: productData, error: fetchError } = await supabase
      .from("weekly_products")
      .select("*")
      .eq("id", id)
      .eq("week_label", activeWeek)
      .single();

    if (fetchError) {
      console.warn("Could not fetch product for archiving:", fetchError.message);
    }

    // Step 2: Insert into deleted_weekly_products as a backup
    if (productData) {
      const { error: archiveError } = await supabase
        .from("deleted_weekly_products")
        .insert({
          id:           `${productData.id}-${Date.now()}`,
          original_id:  productData.id,
          week_label:   productData.week_label,
          name:         productData.name,
          default_qty:  productData.default_qty,
          unit:         productData.unit,
          price:        productData.price,
          category:     productData.category,
          created_at:   productData.created_at,
          deleted_at:   new Date().toISOString(),
        });
      if (archiveError) {
        console.error(
          "Error archiving weekly product:",
          archiveError.message,
          archiveError.details,
          archiveError.hint,
          archiveError.code,
        );
      }
    }

    // Step 3: Hard delete from weekly_products
    const { error } = await supabase
      .from("weekly_products")
      .delete()
      .eq("id", id)
      .eq("week_label", activeWeek);

    if (error) throw error;

    // Mark all order items referencing this product as deleted, then cancel the order
    const { data: orders } = await supabase
      .from("orders")
      .select("id, items, total_price, status");

    if (orders) {
      for (const order of orders) {
        const items = order.items as Array<{
          productId: string;
          price?: number;
          qty: number;
          deleted?: boolean;
          [key: string]: unknown;
        }> | null;
        if (!Array.isArray(items)) continue;

        const hasProduct = items.some((it) => it.productId === id);
        if (!hasProduct) continue;

        // Only mark the specific deleted product as deleted
        const updatedItems = items.map((it) =>
          it.productId === id ? { ...it, deleted: true, price: 0 } : it
        );
        const totalPrice = updatedItems.reduce(
          (sum, it) => sum + (it.qty || 0) * (it.deleted ? 0 : (it.price ?? 0)),
          0
        );

        const activeItems = updatedItems.filter(
          (it) => !it.deleted && !it.productId.startsWith("delivery-fee-")
        );
        const newStatus = activeItems.length === 0 ? "cancelled" : order.status;

        await supabase
          .from("orders")
          .update({
            items: updatedItems,
            total_price: totalPrice,
            status: newStatus,
          })
          .eq("id", order.id);

        if (newStatus === "cancelled") {
          await supabase.from("order_items").delete().eq("order_id", order.id);
        } else {
          await supabase
            .from("order_items")
            .delete()
            .eq("order_id", order.id)
            .eq("product_id", id);
        }
      }
    }

    window.dispatchEvent(new Event("occdc-weekly-products-updated"));
    window.dispatchEvent(new Event("occdc-orders-updated"));
    window.dispatchEvent(new CustomEvent("occdc-order-action", {
      detail: { type: "product_removed", productId: id },
    }));
  } catch (err) {
    console.error("Error removing weekly product in Supabase:", err);
  }
}
