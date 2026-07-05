import type { OrderItem, WeeklyOrderRecord, OrderStatus } from "./types";
import type { OrderRole } from "./roles";
import { supabase } from "@/lib/supabase";



// eslint-disable-next-line @typescript-eslint/no-unused-vars
function seedOrders(): WeeklyOrderRecord[] {
  const _now = Date.now();
  return [
    // {
    //   id: "ORD-1001",
    //   clientName: "ASINAN ELEMENTARY SCHOOL",
    //   clientRole: "fish_egg",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 2,
    //   createdAt: new Date(now - 3603600000).toISOString(),
    //   items: [{"productId": "fish-egg-egg-small", "name": "egg (small)", "qty": 1.0, "unit": "tray", "category": "fish_egg"}, {"productId": "fish-egg-fish-fillet", "name": "fish fillet", "qty": 27.0, "unit": "kilo", "category": "fish_egg"}],
    // },
    // {
    //   id: "ORD-1002",
    //   clientName: "ASINAN ELEMENTARY SCHOOL",
    //   clientRole: "groceries",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 18,
    //   createdAt: new Date(now - 3607200000).toISOString(),
    //   items: [{"productId": "groceries-rice-jasmine", "name": "Rice (JASMINE)", "qty": 45.0, "unit": "Kilo", "category": "groceries"}, {"productId": "groceries-tomato-sauce", "name": "tomato sauce", "qty": 5.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-white-onion", "name": "white onion", "qty": 1.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-flour", "name": "flour", "qty": 5.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-pineapple-chunks-432-g-can", "name": "pineapple chunks 432 g/can", "qty": 5.0, "unit": "can", "category": "groceries"}, {"productId": "groceries-block-pepper-ground-50-g-pack", "name": "block pepper (ground) 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-block-pepper-granules-50-g-pack", "name": "block pepper (granules) 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-block-pepper-whole-50-g-pack", "name": "block pepper (whole) 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-bayleaf-50-g-pack", "name": "bayleaf 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-iodized-salt", "name": "iodized salt", "qty": 1.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-soy-sauce-1liter-bottle", "name": "soy sauce 1liter/bottle", "qty": 3.0, "unit": "bottle", "category": "groceries"}, {"productId": "groceries-vinegar-1liter-bottle", "name": "vinegar 1liter/bottle", "qty": 1.0, "unit": "bottle", "category": "groceries"}, {"productId": "groceries-fish-sauce-1liter-bottle", "name": "fish sauce 1liter/bottle", "qty": 1.0, "unit": "bottle", "category": "groceries"}, {"productId": "groceries-liquid-seasoning-500ml-bottle", "name": "liquid seasoning 500ML/bottle", "qty": 1.0, "unit": "bottle", "category": "groceries"}, {"productId": "groceries-sugar-white", "name": "sugar (white)", "qty": 1.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-banana-ketchup", "name": "banana ketchup", "qty": 1.0, "unit": "gallon", "category": "groceries"}, {"productId": "groceries-spring-oil-1-5-l-bottle", "name": "Spring Oil (1.5 L / bottle)", "qty": 2.0, "unit": "Bottle", "category": "groceries"}, {"productId": "groceries-mixed-butter-vegetables-1-kilo-pack", "name": "Mixed Butter Vegetables 1 kilo/pack", "qty": 3.5, "unit": "pack", "category": "groceries"}],
    // },
    // {
    //   id: "ORD-1003",
    //   clientName: "ASINAN ELEMENTARY SCHOOL",
    //   clientRole: "meat",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 3,
    //   createdAt: new Date(now - 3610800000).toISOString(),
    //   items: [{"productId": "meat-chicken-whole", "name": "Chicken (Whole)", "qty": 27.0, "unit": "Kilo", "category": "meat"}, {"productId": "meat-ground-chicken", "name": "Ground Chicken", "qty": 9.5, "unit": "Kilo", "category": "meat"}, {"productId": "meat-pork-kasim", "name": "pork kasim", "qty": 7.0, "unit": "kilo", "category": "meat"}],
    // },
    // {
    //   id: "ORD-1004",
    //   clientName: "ASINAN ELEMENTARY SCHOOL",
    //   clientRole: "vegetables_fruits",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 7,
    //   createdAt: new Date(now - 3614400000).toISOString(),
    //   items: [{"productId": "vegetables-fruits-potato", "name": "potato", "qty": 10.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-carrots", "name": "carrots", "qty": 8.5, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-bell-pepper-red", "name": "bell pepper (red)", "qty": 0.75, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-white-onion", "name": "white onion", "qty": 1.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-sayote", "name": "sayote", "qty": 9.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-red-onion", "name": "red onion", "qty": 1.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-lakatan", "name": "lakatan", "qty": 14.0, "unit": "kilo", "category": "vegetables_fruits"}],
    // },
    // {
    //   id: "ORD-1005",
    //   clientName: "BANICAIN ELEMENTARY SCHOOL",
    //   clientRole: "fish_egg",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 2,
    //   createdAt: new Date(now - 3618000000).toISOString(),
    //   items: [{"productId": "fish-egg-fish-dory-fillet", "name": "Fish dory, fillet", "qty": 14.0, "unit": "kg", "category": "fish_egg"}, {"productId": "fish-egg-egg-small-30s", "name": "Egg, small (30s)", "qty": 6.0, "unit": "tray", "category": "fish_egg"}],
    // },
    // {
    //   id: "ORD-1006",
    //   clientName: "BANICAIN ELEMENTARY SCHOOL",
    //   clientRole: "groceries",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 15,
    //   createdAt: new Date(now - 3621600000).toISOString(),
    //   items: [{"productId": "groceries-rice-25kg", "name": "Rice, 25kg", "qty": 1.0, "unit": "sack", "category": "groceries"}, {"productId": "groceries-corn-kernel-425g", "name": "Corn kernel, 425g", "qty": 11.0, "unit": "can", "category": "groceries"}, {"productId": "groceries-flour", "name": "Flour", "qty": 2.5, "unit": "kg", "category": "groceries"}, {"productId": "groceries-iodized-salt", "name": "Iodized salt", "qty": 0.5, "unit": "kg", "category": "groceries"}, {"productId": "groceries-cooking-oil", "name": "Cooking oil", "qty": 6.0, "unit": "liter", "category": "groceries"}, {"productId": "groceries-ground-pepper-black-500g", "name": "Ground pepper, black, 500g", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-soy-sauce", "name": "Soy sauce", "qty": 1.5, "unit": "liter", "category": "groceries"}, {"productId": "groceries-liquid-seasoning", "name": "Liquid seasoning", "qty": 0.5, "unit": "liter", "category": "groceries"}, {"productId": "groceries-oyster-sauce", "name": "Oyster sauce", "qty": 1.0, "unit": "liter", "category": "groceries"}, {"productId": "groceries-sugar-washed", "name": "Sugar, washed", "qty": 1.0, "unit": "kg", "category": "groceries"}, {"productId": "groceries-vinegar", "name": "Vinegar", "qty": 1.0, "unit": "liter", "category": "groceries"}, {"productId": "groceries-pineapple-chunks-200g", "name": "Pineapple chunks, 200g", "qty": 30.0, "unit": "pouch", "category": "groceries"}, {"productId": "groceries-fish-sauce", "name": "Fish sauce", "qty": 1.0, "unit": "liter", "category": "groceries"}, {"productId": "groceries-tomato-sauce", "name": "Tomato sauce", "qty": 5.0, "unit": "kg", "category": "groceries"}, {"productId": "groceries-dried-laurel-leaves-50g", "name": "Dried Laurel leaves, 50g", "qty": 1.0, "unit": "pack", "category": "groceries"}],
    // },
    // {
    //   id: "ORD-1007",
    //   clientName: "BANICAIN ELEMENTARY SCHOOL",
    //   clientRole: "meat",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 3,
    //   createdAt: new Date(now - 3625200000).toISOString(),
    //   items: [{"productId": "meat-chicken-breast", "name": "Chicken breast", "qty": 36.0, "unit": "kg", "category": "meat"}, {"productId": "meat-ground-pork", "name": "Ground pork", "qty": 9.5, "unit": "kg", "category": "meat"}, {"productId": "meat-pork-lomo", "name": "Pork lomo", "qty": 14.0, "unit": "kg", "category": "meat"}],
    // },
    // {
    //   id: "ORD-1008",
    //   clientName: "BANICAIN ELEMENTARY SCHOOL",
    //   clientRole: "other_order",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 1,
    //   createdAt: new Date(now - 3628800000).toISOString(),
    //   items: [{"productId": "other-order-lpg-kitchen-gas-with-tank-11kg", "name": "LPG (kitchen gas) with tank, 11kg", "qty": 1.0, "unit": "pcs", "category": "other_order"}],
    // },
    // {
    //   id: "ORD-1009",
    //   clientName: "BANICAIN ELEMENTARY SCHOOL",
    //   clientRole: "vegetables_fruits",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 8,
    //   createdAt: new Date(now - 3632400000).toISOString(),
    //   items: [{"productId": "vegetables-fruits-carrots", "name": "Carrots", "qty": 14.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-potato", "name": "Potato", "qty": 14.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-red-bell-pepper", "name": "Red bell pepper", "qty": 8.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-onion", "name": "Onion", "qty": 6.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-garlic", "name": "Garlic", "qty": 1.5, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-sayote-or-papaya", "name": "Sayote or papaya", "qty": 11.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-ginger", "name": "Ginger", "qty": 1.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-banana-lakatan", "name": "Banana, lakatan", "qty": 239.0, "unit": "pcs", "category": "vegetables_fruits"}],
    // },
    // {
    //   id: "ORD-1010",
    //   clientName: "BARRETTO I ELEMENTARY SCHOOL",
    //   clientRole: "groceries",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 1,
    //   createdAt: new Date(now - 3636000000).toISOString(),
    //   items: [{"productId": "groceries-rice-jasmine-25kg", "name": "rice Jasmine (25kg)", "qty": 5.0, "unit": "sack", "category": "groceries"}],
    // },
    // {
    //   id: "ORD-1011",
    //   clientName: "BARRETTO I ELEMENTARY SCHOOL",
    //   clientRole: "meat",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 1,
    //   createdAt: new Date(now - 3639600000).toISOString(),
    //   items: [{"productId": "meat-pork-kasim", "name": "Pork kasim", "qty": 25.0, "unit": "kilo", "category": "meat"}],
    // },
    // {
    //   id: "ORD-1012",
    //   clientName: "BOTON ELEMENTARY SCHOOL",
    //   clientRole: "fish_egg",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 2,
    //   createdAt: new Date(now - 3643200000).toISOString(),
    //   items: [{"productId": "fish-egg-fish-fillet-dory", "name": "Fish Fillet (Dory)", "qty": 32.0, "unit": "kg", "category": "fish_egg"}, {"productId": "fish-egg-egg-medium", "name": "Egg (Medium)", "qty": 4.0, "unit": "tray", "category": "fish_egg"}],
    // },
    // {
    //   id: "ORD-1013",
    //   clientName: "BOTON ELEMENTARY SCHOOL",
    //   clientRole: "groceries",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 18,
    //   createdAt: new Date(now - 3646800000).toISOString(),
    //   items: [{"productId": "groceries-rice-25-kgs", "name": "Rice (25 kgs)", "qty": 4.0, "unit": "sack", "category": "groceries"}, {"productId": "groceries-mixed-vegetables-500g-carrots-green-peas-corn", "name": "Mixed Vegetables (500g) (Carrots, Green Peas, Corn)", "qty": 40.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-all-purpose-flour", "name": "All Purpose Flour", "qty": 11.0, "unit": "kg", "category": "groceries"}, {"productId": "groceries-spring-oil", "name": "Spring Oil", "qty": 1.0, "unit": "gallon", "category": "groceries"}, {"productId": "groceries-iodized-salt", "name": "Iodized Salt", "qty": 2.0, "unit": "kg", "category": "groceries"}, {"productId": "groceries-soy-sauce", "name": "Soy Sauce", "qty": 20.0, "unit": "Liter", "category": "groceries"}, {"productId": "groceries-liquid-seasoning-500ml", "name": "Liquid Seasoning (500ml)", "qty": 2.0, "unit": "Bottle", "category": "groceries"}, {"productId": "groceries-pineapple-chunks-432g", "name": "Pineapple Chunks (432g)", "qty": 5.0, "unit": "can", "category": "groceries"}, {"productId": "groceries-oyster-sauce-405g", "name": "Oyster Sauce (405g)", "qty": 4.0, "unit": "bottle", "category": "groceries"}, {"productId": "groceries-tomato-sauce-900g", "name": "Tomato Sauce (900g)", "qty": 10.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-fish-sauce", "name": "Fish Sauce", "qty": 2.0, "unit": "Liter", "category": "groceries"}, {"productId": "groceries-block-pepper-ground-50-g-pack", "name": "block pepper (ground) 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-block-pepper-granules-50-g-pack", "name": "block pepper (granules) 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-block-pepper-whole-50-g-pack", "name": "block pepper (whole) 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-bayleaf-50-g-pack", "name": "bayleaf 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-sugar-white", "name": "Sugar (White)", "qty": 3.0, "unit": "kg", "category": "groceries"}, {"productId": "groceries-vinegar", "name": "Vinegar", "qty": 3.0, "unit": "Liter", "category": "groceries"}, {"productId": "groceries-banana-ketchup", "name": "Banana Ketchup", "qty": 1.0, "unit": "gallon", "category": "groceries"}],
    // },
    // {
    //   id: "ORD-1014",
    //   clientName: "BOTON ELEMENTARY SCHOOL",
    //   clientRole: "meat",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 4,
    //   createdAt: new Date(now - 3650400000).toISOString(),
    //   items: [{"productId": "meat-chicken-drumstick", "name": "Chicken (Drumstick)", "qty": 33.0, "unit": "kg", "category": "meat"}, {"productId": "meat-chicken-breast", "name": "Chicken (Breast)", "qty": 48.0, "unit": "kg", "category": "meat"}, {"productId": "meat-ground-pork", "name": "Ground Pork", "qty": 22.0, "unit": "kg", "category": "meat"}, {"productId": "meat-pork-kasim", "name": "Pork (Kasim)", "qty": 32.0, "unit": "kg", "category": "meat"}],
    // },
    // {
    //   id: "ORD-1015",
    //   clientName: "BOTON ELEMENTARY SCHOOL",
    //   clientRole: "vegetables_fruits",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 8,
    //   createdAt: new Date(now - 3654000000).toISOString(),
    //   items: [{"productId": "vegetables-fruits-carrots", "name": "Carrots", "qty": 27.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-bell-pepper", "name": "Bell Pepper", "qty": 20.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-banana-lacatan", "name": "Banana (Lacatan)", "qty": 530.0, "unit": "piece", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-onion", "name": "Onion", "qty": 7.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-garlic", "name": "Garlic", "qty": 5.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-potato", "name": "Potato", "qty": 15.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-papaya", "name": "Papaya", "qty": 10.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-sayote", "name": "Sayote", "qty": 15.0, "unit": "kg", "category": "vegetables_fruits"}],
    // },
    // {
    //   id: "ORD-1016",
    //   clientName: "ILALIM ELEMENTARY SCHOOL",
    //   clientRole: "fish_egg",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 2,
    //   createdAt: new Date(now - 3657600000).toISOString(),
    //   items: [{"productId": "fish-egg-eggs", "name": "Eggs", "qty": 8.0, "unit": "dozen", "category": "fish_egg"}, {"productId": "fish-egg-fist-fillet", "name": "Fist fillet", "qty": 8.0, "unit": "kg", "category": "fish_egg"}],
    // },
    // {
    //   id: "ORD-1017",
    //   clientName: "ILALIM ELEMENTARY SCHOOL",
    //   clientRole: "groceries",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 15,
    //   createdAt: new Date(now - 3661200000).toISOString(),
    //   items: [{"productId": "groceries-mixed-butter-vegetables-250g-pack", "name": "Mixed Butter Vegetables 250g/pack", "qty": 8.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-pinaapple-chuck", "name": "Pinaapple Chuck", "qty": 25.0, "unit": "can", "category": "groceries"}, {"productId": "groceries-vinegar", "name": "Vinegar", "qty": 2.0, "unit": "Liter", "category": "groceries"}, {"productId": "groceries-sugar", "name": "Sugar", "qty": 1.0, "unit": "kg", "category": "groceries"}, {"productId": "groceries-oyster-sauce-500ml", "name": "Oyster Sauce 500ml", "qty": 1.0, "unit": "bottle", "category": "groceries"}, {"productId": "groceries-soy-sauce-500ml", "name": "Soy Sauce 500ml", "qty": 1.0, "unit": "bottle", "category": "groceries"}, {"productId": "groceries-cooking-oil", "name": "Cooking Oil", "qty": 4.0, "unit": "Liter", "category": "groceries"}, {"productId": "groceries-tomato-sauce-1kg-pack", "name": "Tomato Sauce 1kg/pack", "qty": 2.0, "unit": "kg", "category": "groceries"}, {"productId": "groceries-laurel-leaves", "name": "Laurel Leaves", "qty": 4.0, "unit": "packs", "category": "groceries"}, {"productId": "groceries-liquid-seasoning-100g-pack", "name": "Liquid Seasoning 100g/pack", "qty": 2.0, "unit": "Bottle", "category": "groceries"}, {"productId": "groceries-iodized-salt", "name": "iodized salt", "qty": 1.0, "unit": "kg", "category": "groceries"}, {"productId": "groceries-flour", "name": "Flour", "qty": 1.0, "unit": "kg", "category": "groceries"}, {"productId": "groceries-fish-sauce-300ml", "name": "Fish Sauce 300ml", "qty": 1.0, "unit": "bottle", "category": "groceries"}, {"productId": "groceries-block-ground-papper100g-pack", "name": "block ground papper100g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-rice", "name": "Rice", "qty": 1.0, "unit": "sack", "category": "groceries"}],
    // },
    // {
    //   id: "ORD-1018",
    //   clientName: "ILALIM ELEMENTARY SCHOOL",
    //   clientRole: "meat",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 3,
    //   createdAt: new Date(now - 3664800000).toISOString(),
    //   items: [{"productId": "meat-ground-pork", "name": "Ground Pork", "qty": 19.0, "unit": "kg", "category": "meat"}, {"productId": "meat-chicken-breast", "name": "Chicken Breast", "qty": 16.0, "unit": "kg", "category": "meat"}, {"productId": "meat-pork-kasim", "name": "Pork Kasim", "qty": 8.0, "unit": "kg", "category": "meat"}],
    // },
    // {
    //   id: "ORD-1019",
    //   clientName: "ILALIM ELEMENTARY SCHOOL",
    //   clientRole: "vegetables_fruits",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 8,
    //   createdAt: new Date(now - 3668400000).toISOString(),
    //   items: [{"productId": "vegetables-fruits-ginger", "name": "Ginger", "qty": 1.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-sayote", "name": "Sayote", "qty": 5.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-potato", "name": "potato", "qty": 5.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-carrot", "name": "Carrot", "qty": 2.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-bell-papper", "name": "Bell Papper", "qty": 2.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-onions-red", "name": "Onions  Red", "qty": 4.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-garlic", "name": "Garlic", "qty": 3.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-banana", "name": "Banana", "qty": 128.0, "unit": "pcs", "category": "vegetables_fruits"}],
    // },
    // {
    //   id: "ORD-1020",
    //   clientName: "IRAM I ELEMENTARY SCHOOL",
    //   clientRole: "fish_egg",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 2,
    //   createdAt: new Date(now - 3672000000).toISOString(),
    //   items: [{"productId": "fish-egg-fish-fillet-dory", "name": "Fish Fillet (Dory)", "qty": 13.0, "unit": "kg", "category": "fish_egg"}, {"productId": "fish-egg-egg-medium", "name": "Egg (Medium)", "qty": 4.0, "unit": "tray", "category": "fish_egg"}],
    // },
    // {
    //   id: "ORD-1021",
    //   clientName: "IRAM I ELEMENTARY SCHOOL",
    //   clientRole: "groceries",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 18,
    //   createdAt: new Date(now - 3675600000).toISOString(),
    //   items: [{"productId": "groceries-rice-25-kgs", "name": "Rice (25 kgs)", "qty": 2.0, "unit": "sack", "category": "groceries"}, {"productId": "groceries-mixed-vegetables-500g-carrots-green-peas-corn", "name": "Mixed Vegetables (500g) (Carrots, Green Peas, Corn)", "qty": 20.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-all-purpose-flour", "name": "All Purpose Flour", "qty": 3.0, "unit": "kg", "category": "groceries"}, {"productId": "groceries-spring-oil", "name": "Spring Oil", "qty": 1.0, "unit": "gallon", "category": "groceries"}, {"productId": "groceries-iodized-salt", "name": "Iodized Salt", "qty": 1.0, "unit": "kg", "category": "groceries"}, {"productId": "groceries-liquid-seasoning-500ml", "name": "Liquid Seasoning (500ml)", "qty": 1.0, "unit": "Bottle", "category": "groceries"}, {"productId": "groceries-pineapple-chunks-432g", "name": "Pineapple Chunks (432g)", "qty": 2.0, "unit": "can", "category": "groceries"}, {"productId": "groceries-oyster-sauce-405g", "name": "Oyster Sauce (405g)", "qty": 2.0, "unit": "bottle", "category": "groceries"}, {"productId": "groceries-tomato-sauce-900g", "name": "Tomato Sauce (900g)", "qty": 5.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-block-pepper-ground-50-g-pack", "name": "block pepper (ground) 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-block-pepper-granules-50-g-pack", "name": "block pepper (granules) 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-block-pepper-whole-50-g-pack", "name": "block pepper (whole) 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-bayleaf-50-g-pack", "name": "bayleaf 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-sugar-white", "name": "Sugar (White)", "qty": 2.0, "unit": "kg", "category": "groceries"}, {"productId": "groceries-vinegar", "name": "Vinegar", "qty": 1.0, "unit": "Liter", "category": "groceries"}, {"productId": "groceries-banana-ketchup", "name": "Banana Ketchup", "qty": 1.0, "unit": "gallon", "category": "groceries"}, {"productId": "groceries-soy-sauce", "name": "Soy Sauce", "qty": 10.0, "unit": "Liter", "category": "groceries"}, {"productId": "groceries-fish-sauce", "name": "Fish Sauce", "qty": 1.0, "unit": "Liter", "category": "groceries"}],
    // },
    // {
    //   id: "ORD-1022",
    //   clientName: "IRAM I ELEMENTARY SCHOOL",
    //   clientRole: "meat",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 4,
    //   createdAt: new Date(now - 3679200000).toISOString(),
    //   items: [{"productId": "meat-chicken-drumstick", "name": "Chicken (Drumstick)", "qty": 13.0, "unit": "kg", "category": "meat"}, {"productId": "meat-chicken-breast", "name": "Chicken (Breast)", "qty": 20.0, "unit": "kg", "category": "meat"}, {"productId": "meat-ground-pork", "name": "Ground Pork", "qty": 9.0, "unit": "kg", "category": "meat"}, {"productId": "meat-pork-kasim", "name": "Pork (Kasim)", "qty": 13.0, "unit": "kg", "category": "meat"}],
    // },
    // {
    //   id: "ORD-1023",
    //   clientName: "IRAM I ELEMENTARY SCHOOL",
    //   clientRole: "vegetables_fruits",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 8,
    //   createdAt: new Date(now - 3682800000).toISOString(),
    //   items: [{"productId": "vegetables-fruits-carrots", "name": "Carrots", "qty": 15.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-bell-pepper", "name": "Bell Pepper", "qty": 10.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-onion", "name": "Onion", "qty": 4.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-garlic", "name": "Garlic", "qty": 2.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-potato", "name": "Potato", "qty": 10.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-papaya", "name": "Papaya", "qty": 5.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-sayote", "name": "Sayote", "qty": 8.0, "unit": "kg", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-banana-lacatan", "name": "Banana (Lacatan)", "qty": 210.0, "unit": "piece", "category": "vegetables_fruits"}],
    // },
    // {
    //   id: "ORD-1024",
    //   clientName: "JAMES L. GORDON INTEGRATED SCHOOL",
    //   clientRole: "fish_egg",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 2,
    //   createdAt: new Date(now - 3686400000).toISOString(),
    //   items: [{"productId": "fish-egg-fish-dory-fillet-tilapia", "name": "Fish Dory Fillet/ Tilapia", "qty": 15.0, "unit": "kilos", "category": "fish_egg"}, {"productId": "fish-egg-egg-30-pieces-tray-medium-size", "name": "Egg, 30 pieces/tray, Medium-size", "qty": 7.0, "unit": "trays", "category": "fish_egg"}],
    // },
    // {
    //   id: "ORD-1025",
    //   clientName: "JAMES L. GORDON INTEGRATED SCHOOL",
    //   clientRole: "groceries",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 15,
    //   createdAt: new Date(now - 3690000000).toISOString(),
    //   items: [{"productId": "groceries-rice-25kgs-sack", "name": "Rice, 25kgs/sack", "qty": 9.0, "unit": "sacks", "category": "groceries"}, {"productId": "groceries-corn-kernel-425g-can", "name": "Corn Kernel, 425g/can", "qty": 10.0, "unit": "cans", "category": "groceries"}, {"productId": "groceries-flour-1kg-pack", "name": "Flour, 1kg/pack", "qty": 2.0, "unit": "packs", "category": "groceries"}, {"productId": "groceries-black-pepper-ground-kg", "name": "Black Pepper, Ground ,  ½kg", "qty": 5.0, "unit": "packs", "category": "groceries"}, {"productId": "groceries-iodized-salt", "name": "Iodized Salt", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-cooking-oil-1l", "name": "Cooking oil, 1L", "qty": 5.0, "unit": "packs", "category": "groceries"}, {"productId": "groceries-soy-sauce", "name": "Soy Sauce", "qty": 1.0, "unit": "gallon", "category": "groceries"}, {"productId": "groceries-liquid-seaoning-250ml", "name": "Liquid Seaoning, 250ml", "qty": 1.0, "unit": "bottle", "category": "groceries"}, {"productId": "groceries-oyster-sauce", "name": "Oyster Sauce", "qty": 1.0, "unit": "gallon", "category": "groceries"}, {"productId": "groceries-sugar", "name": "Sugar", "qty": 1.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-vinegar", "name": "Vinegar", "qty": 1.0, "unit": "gallon", "category": "groceries"}, {"productId": "groceries-pine-apple-chunks-822g", "name": "Pine Apple Chunks, 822g", "qty": 5.0, "unit": "cans", "category": "groceries"}, {"productId": "groceries-fish-sauce", "name": "Fish Sauce", "qty": 1.0, "unit": "gallon", "category": "groceries"}, {"productId": "groceries-tomato-sauce-1kg-pack", "name": "Tomato Sauce, 1kg/pack", "qty": 4.0, "unit": "packs", "category": "groceries"}, {"productId": "groceries-laurel-leaves-100g", "name": "Laurel Leaves, 100g", "qty": 1.0, "unit": "pack", "category": "groceries"}],
    // },
    // {
    //   id: "ORD-1026",
    //   clientName: "JAMES L. GORDON INTEGRATED SCHOOL",
    //   clientRole: "meat",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 3,
    //   createdAt: new Date(now - 3693600000).toISOString(),
    //   items: [{"productId": "meat-chicken-breast", "name": "Chicken breast", "qty": 38.0, "unit": "kilos", "category": "meat"}, {"productId": "meat-ground-pork", "name": "Ground Pork", "qty": 10.0, "unit": "kilos", "category": "meat"}, {"productId": "meat-pork-lomo-kasim", "name": "Pork Lomo/Kasim", "qty": 15.0, "unit": "kilos", "category": "meat"}],
    // },
    // {
    //   id: "ORD-1027",
    //   clientName: "JAMES L. GORDON INTEGRATED SCHOOL",
    //   clientRole: "other_order",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 5,
    //   createdAt: new Date(now - 3697200000).toISOString(),
    //   items: [{"productId": "other-order-lpg-tank-refill-11kgs", "name": "LPG Tank, Refill, 11kgs", "qty": 1.0, "unit": "Refill", "category": "other_order"}, {"productId": "other-order-single-burner-gas-stove-heavy-duty", "name": "Single Burner Gas Stove, Heavy Duty", "qty": 1.0, "unit": "unit", "category": "other_order"}, {"productId": "other-order-lpg-hose", "name": "LPG Hose", "qty": 1.0, "unit": "piece", "category": "other_order"}, {"productId": "other-order-apron", "name": "Apron", "qty": 2.0, "unit": "Piece", "category": "other_order"}, {"productId": "other-order-kitchen-hand-gloves-100-s", "name": "Kitchen Hand Gloves, 100's", "qty": 1.0, "unit": "box", "category": "other_order"}],
    // },
    // {
    //   id: "ORD-1028",
    //   clientName: "JAMES L. GORDON INTEGRATED SCHOOL",
    //   clientRole: "vegetables_fruits",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 6,
    //   createdAt: new Date(now - 3700800000).toISOString(),
    //   items: [{"productId": "vegetables-fruits-carrots", "name": "Carrots", "qty": 15.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-bell-pepper-red-and-green", "name": "Bell Pepper (Red and Green)", "qty": 8.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-onion", "name": "Onion", "qty": 6.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-garlic", "name": "Garlic", "qty": 2.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-sayote-or-papaya", "name": "Sayote or Papaya", "qty": 10.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-potato", "name": "Potato", "qty": 15.0, "unit": "kilos", "category": "vegetables_fruits"}],
    // },
    // {
    //   id: "ORD-1029",
    //   clientName: "MABAYUAN ELEMENTARY SCHOOL",
    //   clientRole: "fish_egg",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 1,
    //   createdAt: new Date(now - 3704400000).toISOString(),
    //   items: [{"productId": "fish-egg-eggs", "name": "Eggs", "qty": 1.0, "unit": "Tray", "category": "fish_egg"}],
    // },
    // {
    //   id: "ORD-1030",
    //   clientName: "MABAYUAN ELEMENTARY SCHOOL",
    //   clientRole: "groceries",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 11,
    //   createdAt: new Date(now - 3708000000).toISOString(),
    //   items: [{"productId": "groceries-rice", "name": "Rice", "qty": 60.0, "unit": "kilos", "category": "groceries"}, {"productId": "groceries-flour", "name": "Flour", "qty": 3.0, "unit": "kilos", "category": "groceries"}, {"productId": "groceries-cooking-oil-2l", "name": "Cooking oil 2L", "qty": 3.0, "unit": "bottles", "category": "groceries"}, {"productId": "groceries-breading-mix-garlic", "name": "Breading Mix (Garlic)", "qty": 5.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-iodized-salt", "name": "Iodized Salt", "qty": 1.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-butter", "name": "Butter", "qty": 2.0, "unit": "pcs", "category": "groceries"}, {"productId": "groceries-fish-sauce-patis", "name": "Fish Sauce (patis)", "qty": 1.0, "unit": "liter", "category": "groceries"}, {"productId": "groceries-vinegar", "name": "Vinegar", "qty": 1.0, "unit": "liter", "category": "groceries"}, {"productId": "groceries-soy-sauce", "name": "Soy Sauce", "qty": 1.0, "unit": "liter", "category": "groceries"}, {"productId": "groceries-cornstrach", "name": "CornStrach", "qty": 1.0, "unit": "kilos", "category": "groceries"}, {"productId": "groceries-ground-black-pepper", "name": "Ground Black Pepper", "qty": 1.0, "unit": "bottles", "category": "groceries"}],
    // },
    // {
    //   id: "ORD-1031",
    //   clientName: "MABAYUAN ELEMENTARY SCHOOL",
    //   clientRole: "meat",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 2,
    //   createdAt: new Date(now - 3711600000).toISOString(),
    //   items: [{"productId": "meat-chicken-breast", "name": "Chicken breast", "qty": 35.0, "unit": "kilos", "category": "meat"}, {"productId": "meat-chicken-giniling", "name": "Chicken Giniling", "qty": 30.0, "unit": "kilos", "category": "meat"}],
    // },
    // {
    //   id: "ORD-1032",
    //   clientName: "MABAYUAN ELEMENTARY SCHOOL",
    //   clientRole: "vegetables_fruits",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 6,
    //   createdAt: new Date(now - 3715200000).toISOString(),
    //   items: [{"productId": "vegetables-fruits-carrots", "name": "Carrots", "qty": 8.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-sayote", "name": "Sayote", "qty": 5.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-potato", "name": "Potato", "qty": 3.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-red-bell-pepper", "name": "Red Bell Pepper", "qty": 1.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-onion", "name": "Onion", "qty": 2.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-garlic", "name": "Garlic", "qty": 2.0, "unit": "kilos", "category": "vegetables_fruits"}],
    // },
    // {
    //   id: "ORD-1033",
    //   clientName: "NEW CABALAN ELEMENTARY SCHOOL",
    //   clientRole: "fish_egg",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 2,
    //   createdAt: new Date(now - 3718800000).toISOString(),
    //   items: [{"productId": "fish-egg-egg-m", "name": "Egg (M)", "qty": 2.0, "unit": "tray", "category": "fish_egg"}, {"productId": "fish-egg-cream-dory-fish-fillet", "name": "Cream Dory/Fish Fillet", "qty": 30.0, "unit": "kilo", "category": "fish_egg"}],
    // },
    // {
    //   id: "ORD-1034",
    //   clientName: "NEW CABALAN ELEMENTARY SCHOOL",
    //   clientRole: "groceries",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 12,
    //   createdAt: new Date(now - 3722400000).toISOString(),
    //   items: [{"productId": "groceries-rice-1-sack-25kg", "name": "Rice 1 sack (25kg)", "qty": 5.0, "unit": "sack", "category": "groceries"}, {"productId": "groceries-mixed-vegetables-500g-carrots-green-peas-corn", "name": "Mixed Vegetables (500g) (Carrots, Green Peas, Corn)", "qty": 30.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-all-purpose-flour", "name": "All Purpose Flour", "qty": 10.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-cooking-oil", "name": "Cooking Oil", "qty": 20.0, "unit": "liter", "category": "groceries"}, {"productId": "groceries-pepper-powder", "name": "Pepper Powder", "qty": 1.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-soy-sauce", "name": "Soy Sauce", "qty": 15.0, "unit": "liter", "category": "groceries"}, {"productId": "groceries-vinegar", "name": "Vinegar", "qty": 5.0, "unit": "liter", "category": "groceries"}, {"productId": "groceries-iodized-salt", "name": "Iodized Salt", "qty": 1.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-washed-sugar", "name": "Washed Sugar", "qty": 3.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-oyster-sauce-405g", "name": "Oyster Sauce 405g", "qty": 2.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-pineapple-chunks-822g", "name": "Pineapple Chunks 822g", "qty": 3.0, "unit": "can", "category": "groceries"}, {"productId": "groceries-liquid-seasoning-500ml", "name": "Liquid seasoning 500ml", "qty": 1.0, "unit": "bottle", "category": "groceries"}],
    // },
    // {
    //   id: "ORD-1035",
    //   clientName: "NEW CABALAN ELEMENTARY SCHOOL",
    //   clientRole: "meat",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 2,
    //   createdAt: new Date(now - 3726000000).toISOString(),
    //   items: [{"productId": "meat-chicken-breast-drumstick", "name": "Chicken breast/drumstick", "qty": 30.0, "unit": "kilo", "category": "meat"}, {"productId": "meat-ground-pork", "name": "Ground Pork", "qty": 20.0, "unit": "kilo", "category": "meat"}],
    // },
    // {
    //   id: "ORD-1036",
    //   clientName: "NEW CABALAN ELEMENTARY SCHOOL",
    //   clientRole: "vegetables_fruits",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 6,
    //   createdAt: new Date(now - 3729600000).toISOString(),
    //   items: [{"productId": "vegetables-fruits-onion", "name": "Onion", "qty": 2.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-garlic", "name": "Garlic", "qty": 1.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-potato", "name": "Potato", "qty": 10.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-carrots", "name": "Carrots", "qty": 10.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-lakatan-banana", "name": "Lakatan Banana", "qty": 491.0, "unit": "piece", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-bell-pepper", "name": "Bell Pepper", "qty": 2.0, "unit": "kilo", "category": "vegetables_fruits"}],
    // },
    // {
    //   id: "ORD-1037",
    //   clientName: "OLONGAPO CITY ELEMENTARY SCHOOL",
    //   clientRole: "fish_egg",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 1,
    //   createdAt: new Date(now - 3733200000).toISOString(),
    //   items: [{"productId": "fish-egg-fish-fillet-dory-tilapia-bangus", "name": "Fish Fillet/Dory/tilapia/bangus", "qty": 70.0, "unit": "kilos", "category": "fish_egg"}],
    // },
    // {
    //   id: "ORD-1038",
    //   clientName: "OLONGAPO CITY ELEMENTARY SCHOOL",
    //   clientRole: "groceries",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 21,
    //   createdAt: new Date(now - 3736800000).toISOString(),
    //   items: [{"productId": "groceries-salt-iodized", "name": "Salt iodized", "qty": 1.0, "unit": "kilos", "category": "groceries"}, {"productId": "groceries-pepper", "name": "Pepper", "qty": 1.0, "unit": "kilos", "category": "groceries"}, {"productId": "groceries-soy-sauce", "name": "Soy Sauce", "qty": 2.0, "unit": "liters", "category": "groceries"}, {"productId": "groceries-fish-sauce", "name": "Fish Sauce", "qty": 2.0, "unit": "liters", "category": "groceries"}, {"productId": "groceries-oyster-sauce", "name": "Oyster sauce", "qty": 1.0, "unit": "liters", "category": "groceries"}, {"productId": "groceries-liver-spread-230g", "name": "Liver Spread 230g", "qty": 5.0, "unit": "cans", "category": "groceries"}, {"productId": "groceries-flour", "name": "Flour", "qty": 1.0, "unit": "kilos", "category": "groceries"}, {"productId": "groceries-cooking-oil-2-84l", "name": "Cooking oil 2.84L", "qty": 5.0, "unit": "bottles", "category": "groceries"}, {"productId": "groceries-corn-kernel-425g", "name": "Corn Kernel 425g", "qty": 10.0, "unit": "cans", "category": "groceries"}, {"productId": "groceries-sugar-segunda", "name": "Sugar Segunda", "qty": 1.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-vinegar", "name": "Vinegar", "qty": 2.0, "unit": "liters", "category": "groceries"}, {"productId": "groceries-pine-apple-chunks-108oz", "name": "Pine Apple Chunks 108oz", "qty": 5.0, "unit": "cans", "category": "groceries"}, {"productId": "groceries-catsup-1-kilo", "name": "Catsup 1 kilo", "qty": 1.0, "unit": "gal", "category": "groceries"}, {"productId": "groceries-tomato-sauce", "name": "Tomato sauce", "qty": 3.0, "unit": "kilos", "category": "groceries"}, {"productId": "groceries-laurel-leaves", "name": "Laurel leaves", "qty": 1.0, "unit": "kilos", "category": "groceries"}, {"productId": "groceries-breading-mix", "name": "Breading mix", "qty": 5.0, "unit": "kilos", "category": "groceries"}, {"productId": "groceries-bread-crumbs", "name": "Bread crumbs", "qty": 5.0, "unit": "kilos", "category": "groceries"}, {"productId": "groceries-chicken-pork-cubes-60-cubes", "name": "Chicken/Pork Cubes 60 cubes", "qty": 1.0, "unit": "tub", "category": "groceries"}, {"productId": "groceries-cling-wrap-12-x500m", "name": "Cling wrap 12\"x500m", "qty": 1.0, "unit": "roll", "category": "groceries"}, {"productId": "groceries-garbage-plastic-black-large", "name": "Garbage plastic black Large", "qty": 20.0, "unit": "roll", "category": "groceries"}, {"productId": "groceries-rice-25kls", "name": "Rice 25kls.", "qty": 1.0, "unit": "sack", "category": "groceries"}],
    // },
    // {
    //   id: "ORD-1039",
    //   clientName: "OLONGAPO CITY ELEMENTARY SCHOOL",
    //   clientRole: "meat",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 4,
    //   createdAt: new Date(now - 3740400000).toISOString(),
    //   items: [{"productId": "meat-chicken-breast", "name": "Chicken breast", "qty": 150.0, "unit": "kilos", "category": "meat"}, {"productId": "meat-ground-pork", "name": "Ground Pork", "qty": 41.0, "unit": "kilos", "category": "meat"}, {"productId": "meat-pork-kasim-lomo", "name": "Pork kasim/lomo", "qty": 50.0, "unit": "kilos", "category": "meat"}, {"productId": "meat-pork-liver", "name": "Pork Liver", "qty": 5.0, "unit": "kilos", "category": "meat"}],
    // },
    // {
    //   id: "ORD-1040",
    //   clientName: "OLONGAPO CITY ELEMENTARY SCHOOL",
    //   clientRole: "vegetables_fruits",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 10,
    //   createdAt: new Date(now - 3744000000).toISOString(),
    //   items: [{"productId": "vegetables-fruits-carrots", "name": "Carrots", "qty": 20.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-potato", "name": "Potato", "qty": 20.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-bell-pepper", "name": "Bell Pepper", "qty": 1.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-onions-red", "name": "Onions red", "qty": 5.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-garlic", "name": "Garlic", "qty": 5.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-papaya", "name": "Papaya", "qty": 5.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-ginger", "name": "Ginger", "qty": 1.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-sili-haba-pangsigang", "name": "Sili haba (pangsigang)", "qty": 0.5, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-banana-lacatan-small-size", "name": "Banana Lacatan small size", "qty": 962.0, "unit": "pieces", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-kalamansi", "name": "Kalamansi", "qty": 3.0, "unit": "kilos", "category": "vegetables_fruits"}],
    // },
    // {
    //   id: "ORD-1041",
    //   clientName: "SERGIA SORIANO ESTEBAN INTEGRATED SCHOOL II",
    //   clientRole: "fish_egg",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 2,
    //   createdAt: new Date(now - 3747600000).toISOString(),
    //   items: [{"productId": "fish-egg-fish-dory-fillet", "name": "Fish Dory Fillet", "qty": 10.0, "unit": "kilo", "category": "fish_egg"}, {"productId": "fish-egg-egg-30pcs", "name": "Egg. 30pcs", "qty": 3.0, "unit": "tray", "category": "fish_egg"}],
    // },
    // {
    //   id: "ORD-1042",
    //   clientName: "SERGIA SORIANO ESTEBAN INTEGRATED SCHOOL II",
    //   clientRole: "groceries",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 14,
    //   createdAt: new Date(now - 3751200000).toISOString(),
    //   items: [{"productId": "groceries-corn-kernel-425g", "name": "Corn Kernel 425G", "qty": 5.0, "unit": "can", "category": "groceries"}, {"productId": "groceries-all-purpose-flour-1kg", "name": "All Purpose flour 1kg", "qty": 1.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-black-pepper-ground", "name": "Black pepper ground", "qty": 0.5, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-iodized-salt-1kg", "name": "Iodized Salt 1kg", "qty": 1.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-cooking-oil-1l", "name": "Cooking oil 1L", "qty": 2.0, "unit": "liter", "category": "groceries"}, {"productId": "groceries-soy-sauce", "name": "Soy Sauce", "qty": 1.0, "unit": "gallon", "category": "groceries"}, {"productId": "groceries-liquid-seasoning", "name": "Liquid Seasoning", "qty": 1.0, "unit": "liter", "category": "groceries"}, {"productId": "groceries-sugar", "name": "Sugar", "qty": 1.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-vinegar", "name": "Vinegar", "qty": 1.0, "unit": "gallon", "category": "groceries"}, {"productId": "groceries-pineapple-chunks-200g-pouch", "name": "Pineapple Chunks, 200g pouch", "qty": 10.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-fish-sauce", "name": "Fish Sauce", "qty": 1.0, "unit": "liter", "category": "groceries"}, {"productId": "groceries-tomato-sauce", "name": "Tomato Sauce", "qty": 2.0, "unit": "liter", "category": "groceries"}, {"productId": "groceries-laurel-leaves-100g", "name": "Laurel Leaves, 100g", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-oyster-sauce", "name": "Oyster Sauce", "qty": 1.0, "unit": "liter", "category": "groceries"}],
    // },
    // {
    //   id: "ORD-1043",
    //   clientName: "SERGIA SORIANO ESTEBAN INTEGRATED SCHOOL II",
    //   clientRole: "meat",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 3,
    //   createdAt: new Date(now - 3754800000).toISOString(),
    //   items: [{"productId": "meat-chicken-breast", "name": "Chicken breast", "qty": 10.0, "unit": "kilo", "category": "meat"}, {"productId": "meat-ground-pork", "name": "Ground Pork", "qty": 6.0, "unit": "kilo", "category": "meat"}, {"productId": "meat-pork-kasim", "name": "Pork Kasim", "qty": 8.0, "unit": "kilo", "category": "meat"}],
    // },
    // {
    //   id: "ORD-1044",
    //   clientName: "SERGIA SORIANO ESTEBAN INTEGRATED SCHOOL II",
    //   clientRole: "vegetables_fruits",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 8,
    //   createdAt: new Date(now - 3758400000).toISOString(),
    //   items: [{"productId": "vegetables-fruits-carrot", "name": "Carrot", "qty": 7.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-lacatan-banana-10-12pcs-kilo", "name": "Lacatan Banana (10-12pcs/kilo)", "qty": 6.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-potato", "name": "Potato", "qty": 6.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-red-bell-pepper", "name": "Red Bell Pepper", "qty": 1.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-onion", "name": "Onion", "qty": 1.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-garlic", "name": "Garlic", "qty": 1.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-sayote", "name": "Sayote", "qty": 3.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-ginger", "name": "Ginger", "qty": 0.25, "unit": "kilo", "category": "vegetables_fruits"}],
    // },
    // {
    //   id: "ORD-1045",
    //   clientName: "STA. RITA ELEMENTARY SCHOOL",
    //   clientRole: "meat",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 4,
    //   createdAt: new Date(now - 3762000000).toISOString(),
    //   items: [{"productId": "meat-chicken-breast", "name": "Chicken Breast", "qty": 80.0, "unit": "kilos", "category": "meat"}, {"productId": "meat-pork-giniling", "name": "Pork Giniling", "qty": 26.0, "unit": "kilos", "category": "meat"}, {"productId": "meat-pork-kasim-lomo", "name": "Pork Kasim/Lomo", "qty": 25.0, "unit": "kilos", "category": "meat"}, {"productId": "meat-pork-liver", "name": "Pork Liver", "qty": 3.0, "unit": "kilos", "category": "meat"}],
    // },
    // {
    //   id: "ORD-1046",
    //   clientName: "STA. RITA ELEMENTARY SCHOOL",
    //   clientRole: "vegetables_fruits",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 7,
    //   createdAt: new Date(now - 3765600000).toISOString(),
    //   items: [{"productId": "vegetables-fruits-carrots", "name": "Carrots", "qty": 13.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-potato", "name": "Potato", "qty": 20.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-red-bell-pepper", "name": "Red Bell Pepper", "qty": 5.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-onion-red", "name": "Onion Red", "qty": 3.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-garlic", "name": "Garlic", "qty": 3.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-sayote", "name": "Sayote", "qty": 5.0, "unit": "kilos", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-ginger", "name": "Ginger", "qty": 1.0, "unit": "kilos", "category": "vegetables_fruits"}],
    // },
    // {
    //   id: "ORD-1047",
    //   clientName: "TAPINAC ELEMENTARY SCHOOL",
    //   clientRole: "fish_egg",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 2,
    //   createdAt: new Date(now - 3769200000).toISOString(),
    //   items: [{"productId": "fish-egg-egg-small", "name": "egg (small)", "qty": 1.0, "unit": "tray", "category": "fish_egg"}, {"productId": "fish-egg-fish-fillet", "name": "fish fillet", "qty": 27.0, "unit": "kilo", "category": "fish_egg"}],
    // },
    // {
    //   id: "ORD-1048",
    //   clientName: "TAPINAC ELEMENTARY SCHOOL",
    //   clientRole: "groceries",
    //   weekLabel,
    //   status: "processing",
    //   itemCount: 17,
    //   createdAt: new Date(now - 3772800000).toISOString(),
    //   items: [{"productId": "groceries-mixed-butter-vegetables-1-kilo-pack", "name": "Mixed Butter Vegetables 1 kilo/pack", "qty": 4.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-tomato-sauce", "name": "tomato sauce", "qty": 5.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-flour", "name": "flour", "qty": 5.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-pineapple-chunks-432-g-can", "name": "pineapple chunks 432 g/can", "qty": 5.0, "unit": "can", "category": "groceries"}, {"productId": "groceries-block-pepper-ground-50-g-pack", "name": "block pepper (ground) 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-block-pepper-granules-50-g-pack", "name": "block pepper (granules) 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-block-pepper-whole-50-g-pack", "name": "block pepper (whole) 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-bayleaf-50-g-pack", "name": "bayleaf 50 g/pack", "qty": 1.0, "unit": "pack", "category": "groceries"}, {"productId": "groceries-iodized-salt", "name": "iodized salt", "qty": 1.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-soy-sauce-1liter-bottle", "name": "soy sauce 1liter/bottle", "qty": 3.0, "unit": "bottle", "category": "groceries"}, {"productId": "groceries-vinegar-1liter-bottle", "name": "vinegar 1liter/bottle", "qty": 1.0, "unit": "bottle", "category": "groceries"}, {"productId": "groceries-fish-sauce-1liter-bottle", "name": "fish sauce 1liter/bottle", "qty": 1.0, "unit": "bottle", "category": "groceries"}, {"productId": "groceries-liquid-seasoning-500ml-bottle", "name": "liquid seasoning 500ML/bottle", "qty": 1.0, "unit": "bottle", "category": "groceries"}, {"productId": "groceries-sugar-white", "name": "sugar (white)", "qty": 1.0, "unit": "kilo", "category": "groceries"}, {"productId": "groceries-banana-ketchup", "name": "banana ketchup", "qty": 1.0, "unit": "gallon", "category": "groceries"}, {"productId": "groceries-spring-oil-1-5-l-bottle", "name": "Spring Oil (1.5 L / bottle)", "qty": 2.0, "unit": "Bottle", "category": "groceries"}, {"productId": "groceries-rice", "name": "Rice", "qty": 50.0, "unit": "Kilo", "category": "groceries"}],
    // },
    // {
    //   id: "ORD-1049",
    //   clientName: "TAPINAC ELEMENTARY SCHOOL",
    //   clientRole: "meat",
    //   weekLabel,
    //   status: "completed",
    //   itemCount: 3,
    //   createdAt: new Date(now - 3776400000).toISOString(),
    //   items: [{"productId": "meat-chicken-whole", "name": "Chicken (Whole)", "qty": 28.0, "unit": "Kilo", "category": "meat"}, {"productId": "meat-ground-chicken", "name": "Ground Chicken", "qty": 10.0, "unit": "Kilo", "category": "meat"}, {"productId": "meat-pork-kasim", "name": "pork kasim", "qty": 10.0, "unit": "kilo", "category": "meat"}],
    // },
    // {
    //   id: "ORD-1050",
    //   clientName: "TAPINAC ELEMENTARY SCHOOL",
    //   clientRole: "vegetables_fruits",
    //   weekLabel,
    //   status: "pending",
    //   itemCount: 8,
    //   createdAt: new Date(now - 3780000000).toISOString(),
    //   items: [{"productId": "vegetables-fruits-potato", "name": "potato", "qty": 10.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-carrots", "name": "carrots", "qty": 8.5, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-bell-pepper-red", "name": "bell pepper (red)", "qty": 0.75, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-white-onion", "name": "white onion", "qty": 1.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-sayote", "name": "sayote", "qty": 10.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-red-onion", "name": "red onion", "qty": 1.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-garlic", "name": "garlic", "qty": 1.0, "unit": "kilo", "category": "vegetables_fruits"}, {"productId": "vegetables-fruits-lakatan", "name": "lakatan", "qty": 15.0, "unit": "kilo", "category": "vegetables_fruits"}],
    // },
  ];
}



/**
 * Fetch orders from Supabase filtered by category (client_role) and week label.
 * Used by the print buttons to always pull the latest data at print time.
 */
export async function getOrdersByCategoryAndWeek(
  category: string,
  weekLabel: string,
): Promise<WeeklyOrderRecord[]> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("client_role", category)
      .eq("week_label", weekLabel)
      .order("client_name", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    type DbOrderRow = {
      id: string;
      client_name: string;
      client_role: OrderRole;
      week_label: string;
      status: OrderStatus;
      item_count: number;
      created_at: string;
      items: WeeklyOrderRecord["items"];
      total_price?: number;
    };

    return (data as DbOrderRow[]).map((row) => ({
      id: row.id,
      clientName: row.client_name,
      clientRole: row.client_role,
      weekLabel: row.week_label,
      status: row.status,
      itemCount: row.item_count,
      createdAt: row.created_at,
      items: row.items,
      totalPrice: row.total_price || 0,
    }));
  } catch (err) {
    console.error("Error fetching orders by category from Supabase:", err);
    return [];
  }
}

export async function getOrders(): Promise<WeeklyOrderRecord[]> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      const seeded = seedOrders();
      const dbOrders = seeded.map(o => ({
        id: o.id,
        client_name: o.clientName,
        client_role: o.clientRole,
        week_label: o.weekLabel,
        status: o.status,
        item_count: o.itemCount,
        created_at: o.createdAt,
        items: o.items
      }));
      await supabase.from("orders").insert(dbOrders);
      return seeded;
    }

    type DbOrderRow = {
      id: string;
      client_name: string;
      client_role: OrderRole;
      week_label: string;
      status: OrderStatus;
      item_count: number;
      created_at: string;
      items: WeeklyOrderRecord["items"];
      total_price?: number;
    };

    const records = (data as DbOrderRow[]).map((row) => ({
      id: row.id,
      clientName: row.client_name,
      clientRole: row.client_role,
      weekLabel: row.week_label,
      status: row.status,
      itemCount: row.item_count,
      createdAt: row.created_at,
      items: row.items,
      totalPrice: row.total_price || 0,
    }));

    // Merge current catalog prices into items that have price=0 (legacy/migrated orders)
    const hasZeroPriceItem = records.some((r) =>
      Array.isArray(r.items) && r.items.some((it) => !it.price || it.price === 0)
    );

    if (hasZeroPriceItem) {
      const { data: catalogData } = await supabase
        .from("weekly_products")
        .select("id, price");

      const priceMap: Record<string, number> = {};
      if (catalogData) {
        for (const row of catalogData as { id: string; price: string | number }[]) {
          priceMap[row.id] = parseFloat(String(row.price || "0"));
        }
      }

      for (const record of records) {
        if (!Array.isArray(record.items)) continue;
        let changed = false;
        const mergedItems = record.items.map((it) => {
          const catalogPrice = priceMap[it.productId] ?? 0;
          if ((!it.price || it.price === 0) && catalogPrice > 0) {
            changed = true;
            return { ...it, price: catalogPrice };
          }
          return it;
        });
        if (changed) {
          record.items = mergedItems;
          record.totalPrice = mergedItems.reduce(
            (sum, it) => sum + (it.qty || 0) * (it.price || 0),
            0
          );
        }
      }
    }

    // Strip items that still have price=0 after merge — these were deleted from the catalog
    // NOTE: We do NOT strip them — they stay visible so clients/admins can see the order
    // with a "Waiting for pricing" indicator. Only filter them from the client order FORM.

    return records;

  } catch (err) {
    console.error("Error fetching orders from Supabase:", err);
    return [];
  }
}

export async function saveOrder(order: WeeklyOrderRecord): Promise<void> {
  try {
    const dbOrder = {
      id: order.id,
      client_name: order.clientName,
      client_role: order.clientRole,
      week_label: order.weekLabel,
      status: order.status,
      item_count: order.itemCount,
      created_at: order.createdAt,
      items: order.items,
      total_price: order.totalPrice || 0,
    };
    const { error } = await supabase.from("orders").insert(dbOrder);
    if (error) throw error;
    window.dispatchEvent(new Event("occdc-orders-updated"));
    window.dispatchEvent(new CustomEvent("occdc-order-action", {
      detail: { type: "new_order", orderId: order.id, clientName: order.clientName, category: order.clientRole },
    }));
  } catch (err) {
    console.error("Error saving order to Supabase:", err);
  }
}

export async function updateOrderStatus(id: string, status: WeeklyOrderRecord["status"]): Promise<void> {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
    window.dispatchEvent(new Event("occdc-orders-updated"));
    window.dispatchEvent(new CustomEvent("occdc-order-action", {
      detail: { type: "status_change", orderId: id, status },
    }));
  } catch (err) {
    console.error("Error updating order status in Supabase:", err);
  }
}

export async function deleteOrder(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);
    if (error) throw error;
    window.dispatchEvent(new Event("occdc-orders-updated"));
    window.dispatchEvent(new CustomEvent("occdc-order-action", {
      detail: { type: "deleted", orderId: id },
    }));
  } catch (err) {
    console.error("Error deleting order from Supabase:", err);
  }
}

export async function updateOrder(updated: WeeklyOrderRecord): Promise<void> {
  try {
    const dbOrder = {
      client_name: updated.clientName,
      client_role: updated.clientRole,
      week_label: updated.weekLabel,
      status: updated.status,
      item_count: updated.itemCount,
      items: updated.items,
      total_price: updated.totalPrice || 0,
    };
    const { error } = await supabase
      .from("orders")
      .update(dbOrder)
      .eq("id", updated.id);
    if (error) throw error;
    window.dispatchEvent(new Event("occdc-orders-updated"));
    window.dispatchEvent(new CustomEvent("occdc-order-action", {
      detail: { type: "items_updated", orderId: updated.id, clientName: updated.clientName },
    }));
  } catch (err) {
    console.error("Error updating order in Supabase:", err);
  }
}

export function createOrderId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${num}`;
}

export function buildOrderItems(
  selected: { id: string; name: string; unit: string; price: number; category: string }[],
  quantities: Record<string, number>
): OrderItem[] {
  return selected.map((p) => ({
    productId: p.id,
    name: p.name,
    qty: quantities[p.id] ?? 0,
    unit: p.unit,
    price: p.price,
    category: p.category,
  }));
}
