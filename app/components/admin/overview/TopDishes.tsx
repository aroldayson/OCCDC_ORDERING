import type { WeeklyOrderRecord } from "../../order/types";

type TopDishesProps = {
  orders: WeeklyOrderRecord[];
};

type GroupedProduct = {
  name: string;
  qty: number;
  unit: string;
  category: string;
};

function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*\(\s*/g, "(")
    .replace(/\s*\)\s*/g, ")")
    .trim();
}

export default function TopDishes({ orders }: TopDishesProps) {
  // Aggregate products
  const productMap = new Map<string, GroupedProduct>();

  for (const order of orders) {
    for (const item of order.items) {
      if (item.deleted) continue;

      const normName = normalizeProductName(item.name);
      const normUnit = item.unit.toLowerCase().trim();
      const key = `${normName}-${normUnit}`;

      const existing = productMap.get(key);
      if (existing) {
        existing.qty += item.qty;
      } else {
        productMap.set(key, {
          name: item.name,
          qty: item.qty,
          unit: item.unit,
          category: item.category,
        });
      }
    }
  }

  const sortedProducts = Array.from(productMap.values())
    .sort((a, b) => b.qty - a.qty);

  const getEmoji = (category: string) => {
    switch (category) {
      case "vegetables":
        return "🥦";
      case "fruits":
        return "🍎";
      case "meat":
        return "🥩";
      case "fish":
        return "🐟";
      case "egg":
        return "🍳";
      case "groceries":
        return "🥫";
      case "rice":
        return "🌾";
      default:
        return "📦";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col h-[400px]">
      <div className="mb-4 flex items-center justify-between shrink-0">
        <h2 className="text-base font-bold text-slate-800">Top Ordered Products</h2>
      </div>



      {sortedProducts.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500 flex-1 flex items-center justify-center">No ordered items yet.</div>
      ) : (
        <ul className="space-y-4 overflow-y-auto flex-1 pr-2">
          {sortedProducts.map((prod) => (
            <li key={`${prod.name}-${prod.unit}`} className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                {getEmoji(prod.category)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{prod.name}</p>
                <p className="text-sm">
                  <span className="font-bold text-slate-800">{prod.qty.toLocaleString()}</span>{" "}
                  <span className="text-slate-500">{prod.unit}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
