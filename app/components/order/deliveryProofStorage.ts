import { supabase } from "@/lib/supabase";

export interface DeliveryProofRecord {
  id: string;
  order_id: string;
  image_data: string;
  created_at: string;
}

/**
 * Fetches the delivery proof image data (base64 string) for a given order ID.
 */
export async function getDeliveryProof(orderId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("delivery_proofs")
      .select("image_data")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching delivery proof:", error.message);
      return null;
    }

    return data ? data.image_data : null;
  } catch (err) {
    console.error("Unexpected error fetching delivery proof:", err);
    return null;
  }
}

/**
 * Uploads (saves) a delivery proof image (base64 string) for an order.
 * Deletes any existing proof for the order first.
 */
export async function saveDeliveryProof(orderId: string, imageData: string): Promise<void> {
  try {
    // 1. Delete existing proof to ensure only one proof per order exists
    await supabase
      .from("delivery_proofs")
      .delete()
      .eq("order_id", orderId);

    // 2. Insert the new proof
    const { error } = await supabase
      .from("delivery_proofs")
      .insert({
        order_id: orderId,
        image_data: imageData,
      });

    if (error) throw error;

    // Notify application components of changes
    window.dispatchEvent(new CustomEvent("occdo-delivery-proof-updated", { detail: { orderId } }));
  } catch (err) {
    console.error("Error saving delivery proof:", err);
    throw err;
  }
}

/**
 * Deletes the delivery proof for an order.
 */
export async function deleteDeliveryProof(orderId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("delivery_proofs")
      .delete()
      .eq("order_id", orderId);

    if (error) throw error;

    // Notify application components of changes
    window.dispatchEvent(new CustomEvent("occdo-delivery-proof-updated", { detail: { orderId } }));
  } catch (err) {
    console.error("Error deleting delivery proof:", err);
    throw err;
  }
}
