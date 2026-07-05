import { supabase } from "@/lib/supabase";

export type ItemCatalogEntry = {
  id: string;
  name: string;
  category: string;
  default_unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Fetch all active catalog items, optionally filtered by category. */
export async function getItemCatalog(category?: string): Promise<ItemCatalogEntry[]> {
  let query = supabase
    .from("item_catalog")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching item catalog:", error);
    return [];
  }
  return (data ?? []) as ItemCatalogEntry[];
}

/** Add a new item to the catalog. */
export async function addCatalogItem(
  name: string,
  category: string,
  default_unit: string,
): Promise<ItemCatalogEntry | null> {
  const { data, error } = await supabase
    .from("item_catalog")
    .insert({ name: name.trim(), category, default_unit })
    .select()
    .single();

  if (error) {
    console.error("Error adding catalog item:", error);
    return null;
  }
  return data as ItemCatalogEntry;
}

/** Update an existing catalog item. */
export async function updateCatalogItem(
  id: string,
  updates: Partial<Pick<ItemCatalogEntry, "name" | "category" | "default_unit" | "is_active">>,
): Promise<void> {
  const { error } = await supabase
    .from("item_catalog")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("Error updating catalog item:", error);
  }
}

/** Soft-delete a catalog item (sets is_active = false). */
export async function deactivateCatalogItem(id: string): Promise<void> {
  await updateCatalogItem(id, { is_active: false });
}

/** Hard-delete a catalog item. */
export async function deleteCatalogItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("item_catalog")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting catalog item:", error);
  }
}
