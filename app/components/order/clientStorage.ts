export type ClientRecord = {
  id: string;
  name: string;
  address?: string;
  delivery_price?: number;
  contact_person?: string;
  contact_number?: string;
  coop_id?: string;
};



function seedClients(): ClientRecord[] {
  return [
    { id: "school-1", name: "ASINAN ELEMENTARY SCHOOL" },
    { id: "school-2", name: "BANICAIN ELEMENTARY SCHOOL" },
    { id: "school-3", name: "BARRETTO I ELEMENTARY SCHOOL" },
    { id: "school-4", name: "BOTON ELEMENTARY SCHOOL" },
    { id: "school-5", name: "ILALIM ELEMENTARY SCHOOL" },
    { id: "school-6", name: "IRAM I ELEMENTARY SCHOOL" },
    { id: "school-7", name: "JAMES L. GORDON INTEGRATED SCHOOL" },
    { id: "school-8", name: "MABAYUAN ELEMENTARY SCHOOL" },
    { id: "school-9", name: "NEW CABALAN ELEMENTARY SCHOOL" },
    { id: "school-10", name: "OLONGAPO CITY ELEMENTARY SCHOOL" },
    { id: "school-11", name: "SERGIA SORIANO ESTEBAN INTEGRATED SCHOOL II" },
    { id: "school-12", name: "STA. RITA ELEMENTARY SCHOOL" },
    { id: "school-13", name: "TAPINAC ELEMENTARY SCHOOL" },
  ];
}

import { supabase } from "@/lib/supabase";

async function readClients(): Promise<ClientRecord[]> {
  try {
    const { data, error } = await supabase
      .from("schools")
      .select("id,name,address,delivery_price,contact_person,contact_number,coop_id")
      .order("name", { ascending: true });

    // Fallback if contact, coop, or address columns don't exist yet
    if (error && error.message?.includes("does not exist")) {
      const { data: mid, error: midErr } = await supabase
        .from("schools")
        .select("id,name,address,delivery_price,contact_person,contact_number")
        .order("name", { ascending: true });

      if (midErr && midErr.message?.includes("does not exist")) {
        const { data: m2, error: e2 } = await supabase
          .from("schools")
          .select("id,name,address,delivery_price")
          .order("name", { ascending: true });

        if (e2 && e2.message?.includes("does not exist")) {
          const { data: basic, error: basicErr } = await supabase
            .from("schools")
            .select("id,name")
            .order("name", { ascending: true });

          if (basicErr) throw basicErr;

          if (!basic || basic.length === 0) {
            const seeded = seedClients();
            await supabase.from("schools").insert(seeded.map((s) => ({ id: s.id, name: s.name })));
            return seeded;
          }

          return basic.map((row) => ({ id: row.id, name: row.name }));
        }

        if (e2) throw e2;
        if (!m2 || m2.length === 0) return [];
        return m2.map((row) => ({
          id: row.id,
          name: row.name,
          address: row.address || undefined,
          delivery_price: row.delivery_price ? Number(row.delivery_price) : undefined,
          coop_id: "coop-1",
        }));
      }

      if (midErr) throw midErr;
      if (!mid || mid.length === 0) return [];
      return mid.map((row) => ({
        id: row.id,
        name: row.name,
        address: row.address || undefined,
        delivery_price: row.delivery_price ? Number(row.delivery_price) : undefined,
        contact_person: row.contact_person || undefined,
        contact_number: row.contact_number || undefined,
        coop_id: "coop-1",
      }));
    }

    if (error) throw error;

    if (!data || data.length === 0) {
      const seeded = seedClients();
      const dbSchools = seeded.map((s) => ({ id: s.id, name: s.name }));
      await supabase.from("schools").insert(dbSchools);
      return seeded;
    }

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address || undefined,
      delivery_price: row.delivery_price ? Number(row.delivery_price) : undefined,
      contact_person: row.contact_person || undefined,
      contact_number: row.contact_number || undefined,
      coop_id: row.coop_id || "coop-1",
    }));
  } catch (err) {
    const error = err as Error;
    console.error("Error fetching schools from Supabase:", error.message || error);
    return [];
  }
}

function notify() {
  window.dispatchEvent(new Event("occdc-clients-updated"));
}

export async function getClients(): Promise<ClientRecord[]> {
  return readClients();
}

export async function getClientByName(name: string): Promise<ClientRecord | undefined> {
  const clients = await readClients();
  return clients.find((c) => c.name === name);
}

export async function resolveClientBySchoolName(schoolName: string): Promise<ClientRecord> {
  const normalized = schoolName.trim().toUpperCase();
  const clients = await readClients();
  const existing = clients.find((c) => c.name.toUpperCase() === normalized);
  if (existing) return existing;

  const partial = clients.find(
    (c) =>
      c.name.toUpperCase().includes(normalized) ||
      normalized.includes(c.name.toUpperCase()),
  );
  if (partial) return partial;

  return addClient(schoolName.trim());
}

export async function addClient(name: string): Promise<ClientRecord> {
  const clients = await readClients();
  const existing = clients.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  if (existing) return existing;

  const entry = { id: `school-${Date.now()}`, name: name.trim() };
  try {
    const { error } = await supabase.from("schools").insert([entry]);
    if (error) throw error;
    notify();
  } catch (err) {
    const error = err as Error;
    console.error("Error saving school to Supabase:", error.message || error);
  }
  
  return entry;
}

export async function updateClientAddress(schoolName: string, address: string): Promise<void> {
  const clients = await readClients();
  const existing = clients.find((c) => c.name.toLowerCase() === schoolName.trim().toLowerCase());
  if (existing) {
    if (existing.address !== address) {
      try {
        const { error } = await supabase.from("schools").update({ address }).eq("id", existing.id);
        if (error && error.message?.includes("does not exist")) {
          console.warn("schools.address column not yet created — run migration 001_add_school_columns.sql");
          return;
        }
        if (error) throw error;
        notify();
      } catch (err) {
        console.error("Error updating school address:", err);
      }
    }
  } else {
    const entry = { id: `school-${Date.now()}`, name: schoolName.trim(), address };
    try {
      const { error } = await supabase.from("schools").insert([{ id: entry.id, name: entry.name }]);
      if (error) throw error;
      notify();
    } catch (err) {
      console.error("Error saving new school:", err);
    }
  }
}

export async function updateClientDeliveryPrice(schoolId: string, deliveryPrice: number): Promise<void> {
  try {
    // 1. Update the school's delivery_price
    const { error } = await supabase.from("schools").update({ delivery_price: deliveryPrice }).eq("id", schoolId);
    if (error && error.message?.includes("does not exist")) {
      console.warn("schools.delivery_price column not yet created — run migration 001_add_school_columns.sql");
      return;
    }
    if (error) throw error;

    // 2. Get the school name so we can match orders
    const { data: schoolRow } = await supabase
      .from("schools")
      .select("name")
      .eq("id", schoolId)
      .single();
    const schoolName = schoolRow?.name as string | undefined;

    if (schoolName) {
      // 3. Fetch all active orders for this school
      const { data: orders } = await supabase
        .from("orders")
        .select("id, items, total_price")
        .eq("client_name", schoolName)
        .not("status", "in", '("cancelled","completed")');

      if (orders) {
        for (const order of orders) {
          const items = order.items as Array<{
            productId: string;
            price?: number;
            qty: number;
            [key: string]: unknown;
          }> | null;
          if (!Array.isArray(items)) continue;

          const hasDeliveryItem = items.some((it) =>
            String(it.productId).startsWith("delivery-fee-")
          );
          if (!hasDeliveryItem) continue;

          // 4. Update the delivery-fee item price
          const updatedItems = items.map((it) =>
            String(it.productId).startsWith("delivery-fee-")
              ? { ...it, price: deliveryPrice }
              : it
          );

          // 5. Recalculate total_price including delivery
          const newTotal = updatedItems.reduce(
            (sum, it) => sum + (it.qty || 0) * (it.price ?? 0),
            0
          );

          await supabase
            .from("orders")
            .update({ items: updatedItems, total_price: newTotal })
            .eq("id", order.id);
        }
      }
    }

    notify();
  } catch (err) {
    console.error("Error updating delivery price:", err);
  }
}

export async function updateClientContactDetails(
  schoolName: string,
  contactPerson: string,
  contactNumber: string
): Promise<void> {
  const clients = await readClients();
  const existing = clients.find((c) => c.name.toLowerCase() === schoolName.trim().toLowerCase());
  if (existing) {
    if (existing.contact_person !== contactPerson || existing.contact_number !== contactNumber) {
      try {
        const { error } = await supabase
          .from("schools")
          .update({
            contact_person: contactPerson,
            contact_number: contactNumber,
          })
          .eq("id", existing.id);
        if (error) {
          if (error.message?.includes("does not exist")) {
            console.warn("schools.contact_person / contact_number columns not yet created in Supabase.");
            return;
          }
          throw error;
        }
        notify();
      } catch (err) {
        console.error("Error updating school contact details:", err);
      }
    }
  }
}
