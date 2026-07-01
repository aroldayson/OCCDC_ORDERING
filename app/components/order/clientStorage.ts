export type ClientRecord = {
  id: string;
  name: string;
  address?: string;
  delivery_price?: number;
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
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      const seeded = seedClients();
      const dbSchools = seeded.map((s) => ({
        id: s.id,
        name: s.name,
      }));
      await supabase.from("schools").insert(dbSchools);
      return seeded;
    }

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address || undefined,
      delivery_price: row.delivery_price ? Number(row.delivery_price) : undefined,
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
        if (error) throw error;
        notify();
      } catch (err) {
        console.error("Error updating school address:", err);
      }
    }
  } else {
    // If it doesn't exist, we add it with the address
    const entry = { id: `school-${Date.now()}`, name: schoolName.trim(), address };
    try {
      const { error } = await supabase.from("schools").insert([entry]);
      if (error) throw error;
      notify();
    } catch (err) {
      console.error("Error saving new school with address:", err);
    }
  }
}

export async function updateClientDeliveryPrice(schoolId: string, deliveryPrice: number): Promise<void> {
  try {
    const { error } = await supabase.from("schools").update({ delivery_price: deliveryPrice }).eq("id", schoolId);
    if (error) throw error;
    notify();
  } catch (err) {
    console.error("Error updating delivery price:", err);
  }
}
