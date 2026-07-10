import type { WeeklyOrderRecord } from "../order/types";
import type { WeeklyProduct } from "../order/products";
import { ClientRecord } from "../order/clientStorage";
import { getFridayFromWeekLabel } from "../order/weekUtils";
import { supabase } from "@/lib/supabase";

function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*\(\s*/g, "(")
    .replace(/\s*\)\s*/g, ")")
    .trim();
}

const categoryLabels: Record<string, string> = {
  vegetables: "Vegetables",
  fruits: "Fruits",
  fish: "Fish",
  egg: "Egg",
  meat: "Meat",
  groceries: "Groceries",
  rice: "Rice",
  other_order: "Other Order",
};

/** Returns the correct signature/footer block depending on whether the viewer is a supplier (admin). */
function signatureBlock(isSupplier = false): string {
  if (isSupplier) {
    // Receiving Signature Form — 4 columns: Delivered by | Received by | Checked by | Noted by
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:30px;margin-top:50px;font-size:11px;color:#000;">
        <div>
          <div style="border-bottom:1px solid #333;padding-bottom:4px;margin-bottom:6px;">&nbsp;</div>
          <div style="font-size:10px;color:#555;">Signature over Printed Name</div>
          <div style="margin-top:8px;font-weight:bold;">Delivered by</div>
          <div style="font-size:10px;color:#555;">Supplier Representative</div>
        </div>
        <div>
          <div style="border-bottom:1px solid #333;padding-bottom:4px;margin-bottom:6px;">&nbsp;</div>
          <div style="font-size:10px;color:#555;">Signature over Printed Name</div>
          <div style="margin-top:8px;font-weight:bold;">Received by</div>
          <div style="font-size:10px;color:#555;">School Representative</div>
        </div>
        <div>
          <div style="border-bottom:1px solid #333;padding-bottom:4px;margin-bottom:6px;">&nbsp;</div>
          <div style="font-size:10px;color:#555;">Signature over Printed Name</div>
          <div style="margin-top:8px;font-weight:bold;">Checked by</div>
          <div style="font-size:10px;color:#555;">Principal / Head</div>
        </div>
        <div>
          <div style="border-bottom:1px solid #333;padding-bottom:4px;margin-bottom:6px;">&nbsp;</div>
          <div style="font-size:10px;color:#555;">Signature over Printed Name</div>
          <div style="margin-top:8px;font-weight:bold;">Noted by</div>
          <div style="font-size:10px;color:#555;">OCCDC Officer</div>
        </div>
      </div>`;
  }
  // Default: Purchase Request signature form
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:50px;font-size:12px;color:#000;">
      <div>
        <div style="border-bottom:1px solid #333;padding-bottom:5px;margin-bottom:5px;"></div>
        <div style="font-size:11px;color:#000;">Prepared by: _________________</div>
        <div style="margin-top:15px;">Purchasing Coordinator</div>
      </div>
      <div>
        <div style="border-bottom:1px solid #333;padding-bottom:5px;margin-bottom:5px;"></div>
        <div style="font-size:11px;color:#000;">Checked by: _________________</div>
        <div style="margin-top:15px;">Principal/Head</div>
      </div>
    </div>`;
}

export function printCatalog(weekLabel: string, rows: any[]) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pricing Update - ${weekLabel}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 40px; background-color: #f5f5f5; }
        .container { background: white; max-width: 900px; margin: 0 auto; padding: 40px; border: 3px solid #001f3f; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #001f3f; padding-bottom: 20px; }
        .form-title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
        .form-info { display: flex; gap: 40px; margin-bottom: 30px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f0f0f0; border: 1px solid #999; padding: 12px; text-align: left; font-weight: bold; font-size: 12px; text-transform: uppercase; }
        td { border: 1px solid #999; padding: 12px; font-size: 12px; }
        @media print {
          body { background: white; padding: 0; }
          .container { border: 1px solid #999; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="form-title">Pricing Update</div>
          <div>Manage and view pricing for the selected week</div>
        </div>
        <div class="form-info">
          <div><strong>WEEK :</strong> ${weekLabel}</div>
          <div><strong>DATE PRINTED :</strong> ${new Date().toLocaleDateString("en-PH")}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>SCHOOL NAME</th>
              <th>ITEM</th>
              <th>CATEGORY</th>
              <th>DEFAULT QTY</th>
              <th>UNIT</th>
              <th>PRICE</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <td>${row.schoolName === "Z_NO_ORDERS" ? "<i>No Orders</i>" : row.schoolName}</td>
                <td>${row.product.name}</td>
                <td>${categoryLabels[row.product.category] ?? row.product.category}</td>
                <td>${row.product.defaultQty}</td>
                <td>${row.product.unit}</td>
                <td>₱${(row.product.price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}


export async function printOrderForm(order: WeeklyOrderRecord, notes?: string, client?: ClientRecord, isSupplier = false) {
  let resolvedClient = client;
  if (!resolvedClient) {
    try {
      const { resolveClientBySchoolName } = await import("../order/clientStorage");
      resolvedClient = await resolveClientBySchoolName(order.clientName);
    } catch (e) {
      console.error("Failed to resolve client details for printOrderForm:", e);
    }
  }
  const address = resolvedClient?.address || "Address not provided";
  const deliveryPrice = resolvedClient?.delivery_price || 0;

  // Exclude deleted items from print (show items even if not priced yet)
  const printableItems = order.items.filter(it => !it.deleted);

  const orderDateFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-PH")
    : new Date().toLocaleDateString("en-PH");

  let deliveryDateFormatted = "Not set";
  const dateStr = order.deliveryDate;
  let dDate: Date | null = null;
  if (dateStr) {
    dDate = new Date(dateStr + "T12:00:00");
  } else {
    dDate = getFridayFromWeekLabel(order.weekLabel, order.createdAt);
  }
  if (dDate) {
    deliveryDateFormatted = dDate.toLocaleDateString("en-PH");
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Purchase Request Form - ${order.clientName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 40px; background-color: #f5f5f5; color: #000; }
        .container { background: white; max-width: 800px; margin: 0 auto; padding: 40px; border: 3px solid #001f3f; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #001f3f; padding-bottom: 20px; }
        .school-name { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; color: #000; }
        .school-address { font-size: 14px; color: #000; }
        .form-title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 20px; text-decoration: underline; color: #000; }
        .form-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; font-size: 12px; color: #000; }
        .form-info-item { display: flex; }
        .form-info-label { font-weight: bold; width: 120px; color: #000; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f0f0f0; border: 1px solid #999; padding: 12px; text-align: left; font-weight: bold; font-size: 12px; text-transform: uppercase; color: #000; }
        td { border: 1px solid #999; padding: 12px; font-size: 12px; color: #000; }
        td.number-col { text-align: center; width: 40px; }
        td.total { text-align: right; font-weight: bold; }
        .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; font-size: 12px; color: #000; }
        .signature-line { border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 5px; }
        .signature-label { font-size: 11px; color: #000; }
        @media print {
          body { background: white; padding: 0; color: #000; }
          .container { border: 1px solid #999; box-shadow: none; }
          * { color: #000 !important; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="school-name">${order.clientName}</div>
          <div class="school-address">${address}</div>
        </div>
        <div class="form-title">Purchase Request Form</div>
        <div class="form-info">
          <div class="form-info-item"><span class="form-info-label">TO:</span><span>OCCDHPC</span></div>
          <div class="form-info-item"><span class="form-info-label">DATE :</span><span>${orderDateFormatted}</span></div>
          <div class="form-info-item"><span class="form-info-label">ORDER :</span><span>${order.weekLabel}</span></div>
          <div class="form-info-item"><span class="form-info-label">TARGET DELIVER :</span><span>${deliveryDateFormatted}</span></div>
          <div class="form-info-item"><span class="form-info-label">CATEGORY :</span><span style="font-weight:bold;text-transform:uppercase;">${categoryLabels[order.clientRole] ?? order.clientRole}</span></div>
          <div class="form-info-item"><span class="form-info-label">STATUS :</span><span style="font-weight:bold;text-transform:uppercase;">${order.status}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ITEM NO.</th><th>DESCRIPTION</th><th>CATEGORY</th>
              <th>QTY.</th><th>UNIT</th><th>UNIT PRICE</th><th>TOTAL COST</th>
            </tr>
          </thead>
          <tbody>
            ${printableItems.map((item, index) => `
              <tr>
                <td class="number-col">${index + 1}</td>
                <td>${item.name}</td>
                <td>${categoryLabels[item.category] ?? item.category}</td>
                <td class="number-col">${item.qty}</td>
                <td>${item.unit}</td>
                <td class="number-col">₱${(item.price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                <td class="total">₱${((item.qty || 0) * (item.price || 0)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join("")}
            ${deliveryPrice > 0 ? `
              <tr>
                <td class="number-col"></td>
                <td colspan="5" style="text-align:right;font-weight:bold;">Delivery Fee</td>
                <td class="total">₱${deliveryPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
              </tr>
            ` : ""}
          </tbody>
        </table>
        <div style="text-align:right;font-weight:bold;margin-bottom:30px;">
          Grand Total: <span style="border-bottom:1px solid #333;padding:0 20px;">
            ₱${(printableItems.reduce((sum, it) => sum + (it.qty || 0) * (it.price || 0), 0) + deliveryPrice).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        ${signatureBlock(isSupplier)}
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}

export function printClientSummary(
  clientName: string,
  weekLabel: string,
  items: { name: string; qty: number; unit: string; category: string; price?: number; deleted?: boolean }[],
  orders: { status: string }[],
  clientRecord?: ClientRecord,
  isSupplier = false,
) {
  const address = clientRecord?.address || "Address not provided";
  const deliveryPrice = clientRecord?.delivery_price || 0;

  // Exclude deleted items from print
  const printableItems = items.filter(it => !it.deleted);

  const ordersCount = orders.length;
  const statusSummary = (() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([s, c]) => `${s.toUpperCase()}${c > 1 ? ` (${c})` : ""}`)
      .join(" / ");
  })();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Purchase Request Summary - ${clientName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 40px; background-color: #f5f5f5; color: #000; }
        .container { background: white; max-width: 900px; margin: 0 auto; padding: 40px; border: 3px solid #001f3f; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #001f3f; padding-bottom: 20px; }
        .school-name { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; color: #000; }
        .school-address { font-size: 14px; color: #000; }
        .form-title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 20px; text-decoration: underline; color: #000; }
        .form-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; font-size: 12px; color: #000; }
        .form-info-item { display: flex; }
        .form-info-label { font-weight: bold; width: 120px; color: #000; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f0f0f0; border: 1px solid #999; padding: 12px; text-align: left; font-weight: bold; font-size: 12px; text-transform: uppercase; color: #000; }
        td { border: 1px solid #999; padding: 12px; font-size: 12px; color: #000; }
        td.number-col { text-align: center; width: 40px; }
        td.total { text-align: right; font-weight: bold; }
        .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; font-size: 12px; color: #000; }
        .signature-line { border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 5px; }
        .signature-label { font-size: 11px; color: #000; }
        @media print {
          body { background: white; padding: 0; color: #000; }
          .container { border: 1px solid #999; box-shadow: none; }
          * { color: #000 !important; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="school-name">${clientName}</div>
          <div class="school-address">${address}</div>
        </div>
        <div class="form-title">Purchase Request Form (Summary)</div>
        <div class="form-info">
          <div class="form-info-item"><span class="form-info-label">TO:</span><span>OCCDHPC</span></div>
          <div class="form-info-item"><span class="form-info-label">DATE :</span><span>${new Date().toLocaleDateString("en-PH")}</span></div>
          <div class="form-info-item"><span class="form-info-label">ORDER :</span><span>${weekLabel}</span></div>
          <div class="form-info-item"><span class="form-info-label">ORDERS :</span><span>Total ${ordersCount} Category Orders</span></div>
          <div class="form-info-item"><span class="form-info-label">CATEGORY :</span><span style="font-weight:bold;text-transform:uppercase;">${[...new Set(printableItems.map(it => categoryLabels[it.category] ?? it.category))].join(" / ")}</span></div>
          <div class="form-info-item"><span class="form-info-label">STATUS :</span><span style="font-weight:bold;text-transform:uppercase;">${statusSummary}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ITEM NO.</th><th>DESCRIPTION</th><th>CATEGORY</th>
              <th>QTY.</th><th>UNIT</th><th>UNIT PRICE</th><th>TOTAL COST</th>
            </tr>
          </thead>
          <tbody>
            ${printableItems.map((item, index) => `
              <tr>
                <td class="number-col">${index + 1}</td>
                <td>${item.name}</td>
                <td>${categoryLabels[item.category] ?? item.category}</td>
                <td class="number-col">${item.qty}</td>
                <td>${item.unit}</td>
                <td class="number-col">₱${(item.price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                <td class="total">₱${((item.qty || 0) * (item.price || 0)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join("")}
            ${deliveryPrice > 0 ? `
              <tr>
                <td class="number-col"></td>
                <td colspan="5" style="text-align:right;font-weight:bold;">Delivery Fee</td>
                <td class="total">₱${deliveryPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
              </tr>
            ` : ""}
          </tbody>
        </table>
        <div style="text-align:right;font-weight:bold;margin-bottom:30px;">
          Grand Total: <span style="border-bottom:1px solid #333;padding:0 20px;">
            ₱${(printableItems.reduce((sum, it) => sum + (it.qty || 0) * (it.price || 0), 0) + deliveryPrice).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        ${signatureBlock(isSupplier)}
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}

/**
 * Itemized Tally Print — styled to match the Purchase Request Form.
 * One row per unique item (name + unit + price), tallied across all schools.
 * School quantity columns are appended after UNIT PRICE, followed by TOTAL QTY and TOTAL COST.
 */
export function printItemizedTally(
  title: string,
  weekLabel: string,
  orders: WeeklyOrderRecord[],
  allSchools?: string[],
  isSupplier = false,
) {
  // Use provided allSchools list (full roster), fall back to schools derived from orders
  const schools = allSchools && allSchools.length > 0
    ? [...allSchools].sort()
    : Array.from(new Set(orders.map((o) => o.clientName))).sort();

  type TallyRow = {
    name: string;
    unit: string;
    price: number;
    category: string;
    schoolQty: Record<string, number>;
    totalQty: number;
    totalCost: number;
  };

  const rowMap = new Map<string, TallyRow>();

  orders.forEach((order) => {
    order.items
      .filter((item) => !item.deleted)
      .forEach((item) => {
        const normName = normalizeProductName(item.name);
        const normUnit = item.unit.toLowerCase().trim();
        const key = `${normName}||${normUnit}||${item.price ?? 0}`;
        if (!rowMap.has(key)) {
          rowMap.set(key, {
            name: item.name,
            unit: item.unit,
            price: item.price ?? 0,
            category: item.category,
            schoolQty: {},
            totalQty: 0,
            totalCost: 0,
          });
        }
        const row = rowMap.get(key)!;
        row.schoolQty[order.clientName] = (row.schoolQty[order.clientName] ?? 0) + (item.qty ?? 0);
        row.totalQty += item.qty ?? 0;
        row.totalCost += (item.qty ?? 0) * (item.price ?? 0);
      });
  });

  const rows = Array.from(rowMap.values()).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  const grandTotal = rows.reduce((s, r) => s + r.totalCost, 0);
  const categoryLabel = title;
  // Header always shows a fixed label instead of individual school names
  const schoolNamesHeader = "All School Orders";
  const datePrinted = new Date().toLocaleDateString("en-PH");
  const totalOrders = orders.length;

  // Status summary
  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1; });
  const statusSummary = Object.entries(statusCounts)
    .map(([s, c]) => `${s.toUpperCase()}${c > 1 ? ` (${c})` : ""}`)
    .join(" / ");

  // --- Build table: one row per school per item, item details only on first row ---
  // Header is static (no dynamic school columns) — school name appears inline per data row group
  const bodyRows = rows
    .map((row, itemIdx) => {
      // Only include schools that actually ordered this item
      const orderingSchools = schools.filter((s) => (row.schoolQty[s] ?? 0) > 0);
      // If no school ordered it (all deleted/zero), show one row with dashes
      const schoolList = orderingSchools.length > 0 ? orderingSchools : schools;

      return schoolList.map((school, sIdx) => {
        const qty = row.schoolQty[school] ?? 0;
        const subtotal = qty * row.price;
        const isFirstSchool = sIdx === 0;
        const shortSchool = school
          .replace(/\s+elementary\s+school/i, "")
          .replace(/\s+integrated\s+school.*/i, "")
          .trim();

        // Item-level cells — only on first school row, spans the school rows via rowspan
        const itemCells = isFirstSchool
          ? `
              <td class="num-col" rowspan="${schoolList.length}" style="vertical-align:middle;">${itemIdx + 1}</td>
              <td rowspan="${schoolList.length}" style="vertical-align:middle;">${row.name}</td>
              <td rowspan="${schoolList.length}" style="vertical-align:middle;">${categoryLabels[row.category] ?? row.category}</td>
              <td class="num-col" rowspan="${schoolList.length}" style="vertical-align:middle;">${row.unit}</td>
              <td class="price-col" rowspan="${schoolList.length}" style="vertical-align:middle;">₱${row.price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>`
          : "";

        // TOTAL QTY + TOTAL COST — rowspan on first row, omitted on subsequent rows
        const totalCells = isFirstSchool
          ? `
              <td class="num-col total-col" rowspan="${schoolList.length}" style="vertical-align:middle;font-weight:bold;font-size:13px;">${row.totalQty}</td>
              <td class="total" rowspan="${schoolList.length}" style="vertical-align:middle;">₱${row.totalCost.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>`
          : "";

        // School sub-header row inside tbody (school name as label)
        // Split into two cells: QTY (centered) | SUBTOTAL (right-aligned)
        const schoolNameLabel = `<span style="font-size:9px;font-weight:bold;text-transform:uppercase;display:block;color:#333;margin-bottom:1px;">${shortSchool}</span>`;

        return `
          <tr class="${sIdx > 0 ? "school-sub-row" : ""}">
            ${itemCells}
            <td style="text-align:center;vertical-align:middle;padding:6px 8px;border-left:1px solid #999;border-right:1px solid #ddd;">
              ${schoolNameLabel}
              <span style="font-size:10px;color:#666;display:block;margin-bottom:1px;">QTY</span>
              <strong style="font-size:12px;">${qty > 0 ? qty : "–"}</strong>
            </td>
            <td style="text-align:right;vertical-align:middle;padding:6px 8px;">
              ${sIdx === 0 ? `<span style="font-size:9px;color:#666;display:block;margin-bottom:1px;">SUBTOTAL</span>` : `<span style="font-size:9px;color:transparent;display:block;margin-bottom:1px;">.</span>`}
              <strong style="font-size:12px;">₱${subtotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong>
            </td>
            ${totalCells}
          </tr>`;
      }).join("");
    })
    .join("");

  const colSpanLeft = 7; // item# + desc + category + unit + price + school-block + total-qty + total-cost

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Itemized Tally — ${categoryLabel} (${weekLabel})</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 40px; background-color: #f5f5f5; color: #000; }
        .container { background: white; max-width: 1100px; margin: 0 auto; padding: 40px; border: 3px solid #001f3f; }

        /* Header */
        .header { margin-bottom: 30px; border-bottom: 2px solid #001f3f; padding-bottom: 20px; }
        .school-name { font-size: 22px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; color: #000; }
        .school-sub { font-size: 13px; color: #333; }

        /* Form title */
        .form-title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; text-decoration: underline; color: #000; }

        /* Form info grid */
        .form-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 30px; margin-bottom: 28px; font-size: 12px; color: #000; }
        .form-info-item { display: flex; gap: 6px; }
        .form-info-label { font-weight: bold; min-width: 90px; color: #000; }

        /* Table */
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th {
          background-color: #f0f0f0;
          border: 1px solid #999;
          padding: 9px 8px;
          text-align: center;
          font-weight: bold;
          font-size: 11px;
          text-transform: uppercase;
          color: #000;
          vertical-align: bottom;
        }
        td { border: 1px solid #999; padding: 9px 8px; font-size: 11px; color: #000; vertical-align: middle; }
        .num-col { text-align: center; }
        .price-col { text-align: right; }
        .total { text-align: right; font-weight: bold; }
        .total-col { background: #f5f8ff; text-align: center; font-weight: bold; }
        .school-sub-row td { border-top: 1px dashed #ccc; }

        /* Grand total row */
        .grand-total-row { text-align: right; font-weight: bold; font-size: 13px; margin-bottom: 36px; }
        .grand-total-row span { border-bottom: 1px solid #333; padding: 0 24px; display: inline-block; }

        /* Signature section */
        .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; font-size: 12px; color: #000; }
        .sig-line { border-bottom: 1px solid #333; margin-bottom: 6px; padding-bottom: 4px; }
        .sig-label { font-size: 11px; color: #555; }
        .sig-role { margin-top: 10px; font-size: 12px; }

        @media print {
          body { background: white; padding: 0; color: #000; }
          .container { border: 1px solid #999; box-shadow: none; max-width: 100%; }
          * { color: #000 !important; }
        }
      </style>
    </head>
    <body>
      <div class="container">

        <!-- Header -->
        <div class="header">
          <div class="school-name">${schoolNamesHeader || "All Schools"}</div>
          <div class="school-sub">Itemized Order Tally</div>
        </div>

        <!-- Title -->
        <div class="form-title">Purchase Request Form (Itemized Tally)</div>

        <!-- Meta info -->
        <div class="form-info">
          <div class="form-info-item"><span class="form-info-label">TO:</span><span>OCCDHPC</span></div>
          <div class="form-info-item"><span class="form-info-label">DATE :</span><span>${datePrinted}</span></div>
          <div class="form-info-item"><span class="form-info-label">ORDER :</span><span>${weekLabel}</span></div>
          <div class="form-info-item"><span class="form-info-label">ORDERS :</span><span>Total ${totalOrders} Order${totalOrders !== 1 ? "s" : ""}</span></div>
          <div class="form-info-item"><span class="form-info-label">CATEGORY :</span><span style="font-weight:bold;text-transform:uppercase;">${categoryLabel}</span></div>
          <div class="form-info-item"><span class="form-info-label">STATUS :</span><span style="font-weight:bold;text-transform:uppercase;">${statusSummary}</span></div>
        </div>

        <!-- Itemized table -->
        <table>
          <thead>
            <tr>
              <th style="width:36px;text-align:center;">ITEM<br>NO.</th>
              <th>DESCRIPTION</th>
              <th>CATEGORY</th>
              <th style="text-align:center;">UNIT</th>
              <th style="text-align:right;">UNIT<br>PRICE</th>
              <th style="text-align:center;width:80px;">SCHOOL<br>QTY</th>
              <th style="text-align:right;width:100px;">SCHOOL<br>SUBTOTAL</th>
              <th class="total-col" style="text-align:center;width:70px;">TOTAL<br>QTY</th>
              <th style="text-align:right;width:90px;">TOTAL<br>COST</th>
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>

        <!-- Grand total -->
        <div class="grand-total-row">
          Grand Total:&nbsp;
          <span>₱${grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
        </div>

        <!-- Signatures -->
        <div class="signature-section">
          <div>
            <div class="sig-line"></div>
            <div class="sig-label">Prepared by: _________________</div>
            <div class="sig-role">Purchasing Coordinator</div>
          </div>
          <div>
            <div class="sig-line"></div>
            <div class="sig-label">Checked by: _________________</div>
            <div class="sig-role">Principal/Head</div>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}

export function printAllOrders(
  title: string,
  weekLabel: string,
  orders: WeeklyOrderRecord[],
) {
  // Group orders by school name, sorted alphabetically
  const schoolMap = new Map<string, WeeklyOrderRecord[]>();
  [...orders].sort((a, b) => a.clientName.localeCompare(b.clientName)).forEach(order => {
    if (!schoolMap.has(order.clientName)) schoolMap.set(order.clientName, []);
    schoolMap.get(order.clientName)!.push(order);
  });

  // Build flat row list: { schoolName, item, isFirstForSchool, schoolRowCount }
  type PrintRow = {
    schoolName: string;
    item: { name: string; qty: number; unit: string; category: string; price?: number };
    isFirstForSchool: boolean;
    schoolRowCount: number;
    rowIndex: number;
  };

  const rows: PrintRow[] = [];
  let globalIdx = 0;

  schoolMap.forEach((schoolOrders, schoolName) => {
    // Merge items for this school across all their orders
    const itemsMap: Record<string, { name: string; qty: number; unit: string; category: string; price?: number }> = {};
    schoolOrders.forEach(order => {
      order.items
        .filter(it => !it.deleted)
        .forEach(it => {
          const key = `${it.productId}-${it.price}`;
          if (!itemsMap[key]) itemsMap[key] = { ...it };
          else itemsMap[key].qty += it.qty;
        });
    });

    const schoolItems = Object.values(itemsMap);
    schoolItems.forEach((item, sIdx) => {
      rows.push({
        schoolName,
        item,
        isFirstForSchool: sIdx === 0,
        schoolRowCount: schoolItems.length,
        rowIndex: ++globalIdx,
      });
    });
  });

  const grandTotal = rows.reduce((s, r) => s + (r.item.qty || 0) * (r.item.price || 0), 0);

  const statusCounts: Record<string, number> = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  const statusSummary = Object.entries(statusCounts)
    .map(([s, c]) => `${s.toUpperCase()}${c > 1 ? ` (${c})` : ""}`)
    .join(" / ");

  const bodyRows = rows.map(r => {
    const subtotal = (r.item.qty || 0) * (r.item.price || 0);
    const schoolCell = r.isFirstForSchool
      ? `<td rowspan="${r.schoolRowCount}" style="vertical-align:middle;text-align:center;font-weight:bold;font-size:11px;background:#f8f8f8;border:1px solid #999;">${r.schoolName}</td>`
      : "";

    return `
      <tr>
        <td style="text-align:center;border:1px solid #999;padding:10px 8px;font-size:12px;">${r.rowIndex}</td>
        ${schoolCell}
        <td style="border:1px solid #999;padding:10px 8px;font-size:12px;">${r.item.name}</td>
        <td style="border:1px solid #999;padding:10px 8px;font-size:12px;">${categoryLabels[r.item.category] ?? r.item.category}</td>
        <td style="text-align:center;border:1px solid #999;padding:10px 8px;font-size:12px;">${r.item.qty}</td>
        <td style="border:1px solid #999;padding:10px 8px;font-size:12px;">${r.item.unit}</td>
        <td style="text-align:right;border:1px solid #999;padding:10px 8px;font-size:12px;">₱${(r.item.price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
        <td style="text-align:right;font-weight:bold;border:1px solid #999;padding:10px 8px;font-size:12px;">₱${subtotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
      </tr>`;
  }).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>All School Orders - ${weekLabel}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 40px; background-color: #f5f5f5; color: #000; }
        .container { background: white; max-width: 1000px; margin: 0 auto; padding: 40px; border: 3px solid #001f3f; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #001f3f; padding-bottom: 20px; }
        .main-title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
        .sub-title { font-size: 13px; color: #555; }
        .form-title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; text-decoration: underline; }
        .form-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 30px; margin-bottom: 28px; font-size: 12px; }
        .form-info-item { display: flex; gap: 6px; }
        .form-info-label { font-weight: bold; min-width: 90px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f0f0f0; border: 1px solid #999; padding: 10px 8px; text-align: center; font-weight: bold; font-size: 11px; text-transform: uppercase; vertical-align: bottom; }
        .grand-total-row { text-align: right; font-weight: bold; font-size: 13px; margin-bottom: 36px; }
        .grand-total-row span { border-bottom: 1px solid #333; padding: 0 24px; display: inline-block; }
        .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; font-size: 12px; }
        .sig-line { border-bottom: 1px solid #333; margin-bottom: 6px; padding-bottom: 4px; }
        .sig-label { font-size: 11px; color: #555; }
        .sig-role { margin-top: 10px; font-size: 12px; }
        @media print {
          body { background: white; padding: 0; }
          .container { border: 1px solid #999; max-width: 100%; }
          * { color: #000 !important; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="main-title">All School Orders</div>
          <div class="sub-title">Purchase Request Summary</div>
        </div>
        <div class="form-title">Purchase Request Form (Summary)</div>
        <div class="form-info">
          <div class="form-info-item"><span class="form-info-label">TO:</span><span>OCCDHPC</span></div>
          <div class="form-info-item"><span class="form-info-label">DATE :</span><span>${new Date().toLocaleDateString("en-PH")}</span></div>
          <div class="form-info-item"><span class="form-info-label">ORDER :</span><span>${weekLabel}</span></div>
          <div class="form-info-item"><span class="form-info-label">ORDERS :</span><span>Total ${orders.length} Order${orders.length !== 1 ? "s" : ""}</span></div>
          <div class="form-info-item"><span class="form-info-label">CATEGORY :</span><span style="font-weight:bold;text-transform:uppercase;">${title}</span></div>
          <div class="form-info-item"><span class="form-info-label">STATUS :</span><span style="font-weight:bold;text-transform:uppercase;">${statusSummary}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:36px;">ITEM<br>NO.</th>
              <th style="min-width:130px;">SCHOOL NAME</th>
              <th>DESCRIPTION</th>
              <th>CATEGORY</th>
              <th style="width:55px;">QTY.</th>
              <th style="width:60px;">UNIT</th>
              <th style="width:80px;text-align:right;">UNIT<br>PRICE</th>
              <th style="width:90px;text-align:right;">TOTAL<br>COST</th>
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
        <div class="grand-total-row">
          Grand Total:&nbsp;<span>₱${grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="signature-section">
          <div>
            <div class="sig-line"></div>
            <div class="sig-label">Prepared by: _________________</div>
            <div class="sig-role">Purchasing Coordinator</div>
          </div>
          <div>
            <div class="sig-line"></div>
            <div class="sig-label">Checked by: _________________</div>
            <div class="sig-role">Principal/Head</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}

// ─── Client Summary: Download as PDF ────────────────────────────────────────

export function downloadClientSummaryPdf(
  clientName: string,
  weekLabel: string,
  items: { name: string; qty: number; unit: string; category: string; price?: number; deleted?: boolean }[],
  orders: { status: string }[],
  clientRecord?: ClientRecord,
  isSupplier = false,
) {
  const address = clientRecord?.address || "Address not provided";
  const deliveryPrice = clientRecord?.delivery_price || 0;
  const printableItems = items.filter((it) => !it.deleted);

  const ordersCount = orders.length;
  const statusSummary = (() => {
    const counts: Record<string, number> = {};
    for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1;
    return Object.entries(counts)
      .map(([s, c]) => `${s.toUpperCase()}${c > 1 ? ` (${c})` : ""}`)
      .join(" / ");
  })();

  const grandTotal =
    printableItems.reduce((sum, it) => sum + (it.qty || 0) * (it.price || 0), 0) + deliveryPrice;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Purchase Request Summary - ${clientName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; background-color: #fff; color: #000; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px; border: 3px solid #001f3f; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #001f3f; padding-bottom: 20px; }
    .school-name { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
    .school-address { font-size: 14px; }
    .form-title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 20px; text-decoration: underline; }
    .form-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; font-size: 12px; }
    .form-info-item { display: flex; }
    .form-info-label { font-weight: bold; width: 120px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background-color: #f0f0f0; border: 1px solid #999; padding: 12px; text-align: left; font-weight: bold; font-size: 12px; text-transform: uppercase; }
    td { border: 1px solid #999; padding: 12px; font-size: 12px; }
    td.number-col { text-align: center; width: 40px; }
    td.total { text-align: right; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="school-name">${clientName}</div>
      <div class="school-address">${address}</div>
    </div>
    <div class="form-title">Purchase Request Form (Summary)</div>
    <div class="form-info">
      <div class="form-info-item"><span class="form-info-label">TO:</span><span>OCCDHPC</span></div>
      <div class="form-info-item"><span class="form-info-label">DATE:</span><span>${new Date().toLocaleDateString("en-PH")}</span></div>
      <div class="form-info-item"><span class="form-info-label">ORDER:</span><span>${weekLabel}</span></div>
      <div class="form-info-item"><span class="form-info-label">ORDERS:</span><span>Total ${ordersCount} Category Orders</span></div>
      <div class="form-info-item"><span class="form-info-label">CATEGORY:</span><span style="font-weight:bold;text-transform:uppercase;">${[...new Set(printableItems.map((it) => categoryLabels[it.category] ?? it.category))].join(" / ")}</span></div>
      <div class="form-info-item"><span class="form-info-label">STATUS:</span><span style="font-weight:bold;text-transform:uppercase;">${statusSummary}</span></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>ITEM NO.</th><th>DESCRIPTION</th><th>CATEGORY</th>
          <th>QTY.</th><th>UNIT</th><th>UNIT PRICE</th><th>TOTAL COST</th>
        </tr>
      </thead>
      <tbody>
        ${printableItems
          .map(
            (item, index) => `
          <tr>
            <td class="number-col">${index + 1}</td>
            <td>${item.name}</td>
            <td>${categoryLabels[item.category] ?? item.category}</td>
            <td class="number-col">${item.qty}</td>
            <td>${item.unit}</td>
            <td class="number-col">₱${(item.price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
            <td class="total">₱${((item.qty || 0) * (item.price || 0)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
          </tr>`,
          )
          .join("")}
        ${
          deliveryPrice > 0
            ? `<tr>
            <td class="number-col"></td>
            <td colspan="5" style="text-align:right;font-weight:bold;">Delivery Fee</td>
            <td class="total">₱${deliveryPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
          </tr>`
            : ""
        }
      </tbody>
    </table>
    <div style="text-align:right;font-weight:bold;margin-bottom:30px;">
      Grand Total: ₱${grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
    </div>
    ${signatureBlock(isSupplier)}
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = clientName.replace(/[^a-z0-9]/gi, "_");
  const safeWeek = weekLabel.replace(/[^a-z0-9]/gi, "_");
  a.href = url;
  a.download = `${safeName}_${safeWeek}_Summary.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ─── Client Summary: Download as Excel ──────────────────────────────────────

export async function downloadClientSummaryExcel(
  clientName: string,
  weekLabel: string,
  items: { name: string; qty: number; unit: string; category: string; price?: number; deleted?: boolean }[],
  orders: { status: string }[],
  clientRecord?: ClientRecord,
) {
  const XLSX = await import("xlsx");

  const deliveryPrice = clientRecord?.delivery_price || 0;
  const printableItems = items.filter((it) => !it.deleted);

  const ordersCount = orders.length;
  const statusSummary = (() => {
    const counts: Record<string, number> = {};
    for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1;
    return Object.entries(counts)
      .map(([s, c]) => `${s.toUpperCase()}${c > 1 ? ` (${c})` : ""}`)
      .join(" / ");
  })();

  // Meta rows at the top
  const metaRows = [
    ["Purchase Request Form (Summary)"],
    [],
    ["Client", clientName],
    ["Week / Order", weekLabel],
    ["Date", new Date().toLocaleDateString("en-PH")],
    ["Total Orders", ordersCount],
    ["Status", statusSummary],
    [],
    // Header row
    ["#", "Description", "Category", "Qty", "Unit", "Unit Price (₱)", "Total Cost (₱)"],
  ];

  // Data rows
  const dataRows = printableItems.map((item, i) => [
    i + 1,
    item.name,
    categoryLabels[item.category] ?? item.category,
    item.qty,
    item.unit,
    item.price || 0,
    (item.qty || 0) * (item.price || 0),
  ]);

  // Delivery fee row
  if (deliveryPrice > 0) {
    dataRows.push(["", "", "", "", "", "Delivery Fee", deliveryPrice]);
  }

  // Grand total row
  const grandTotal =
    printableItems.reduce((sum, it) => sum + (it.qty || 0) * (it.price || 0), 0) + deliveryPrice;
  dataRows.push(["", "", "", "", "", "Grand Total", grandTotal]);

  const allRows = [...metaRows, ...dataRows];

  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  ws["!cols"] = [
    { wch: 4 },  // #
    { wch: 30 }, // Description
    { wch: 14 }, // Category
    { wch: 6 },  // Qty
    { wch: 8 },  // Unit
    { wch: 14 }, // Unit Price
    { wch: 14 }, // Total Cost
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Summary");

  const safeName = clientName.replace(/[^a-z0-9]/gi, "_");
  const safeWeek = weekLabel.replace(/[^a-z0-9]/gi, "_");
  XLSX.writeFile(wb, `${safeName}_${safeWeek}_Summary.xlsx`);
}

// ─── Shared helper: encode a cell address ────────────────────────────────────
function cellAddr(row: number, col: number): string {
  // row and col are 0-indexed
  let colStr = "";
  let c = col;
  do {
    colStr = String.fromCharCode(65 + (c % 26)) + colStr;
    c = Math.floor(c / 26) - 1;
  } while (c >= 0);
  return `${colStr}${row + 1}`;
}

function setCell(
  ws: Record<string, unknown>,
  row: number,
  col: number,
  value: string | number,
  type?: "s" | "n",
) {
  const addr = cellAddr(row, col);
  const t = type ?? (typeof value === "number" ? "n" : "s");
  (ws as Record<string, { v: string | number; t: string }>)[addr] = { v: value, t };
}

function addMerge(
  ws: Record<string, unknown>,
  rs: number,
  re: number,
  cs: number,
  ce: number,
) {
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] =
    ((ws as Record<string, unknown>)["!merges"] as typeof merges) ?? [];
  merges.push({ s: { r: rs, c: cs }, e: { r: re, c: ce } });
  (ws as Record<string, unknown>)["!merges"] = merges;
}

// ─── All Orders: Download as Excel ──────────────────────────────────────────
// Layout matches Purchase Request Form (per-school summary)

export async function downloadAllOrdersExcel(
  title: string,
  weekLabel: string,
  orders: WeeklyOrderRecord[],
) {
  const XLSX = await import("xlsx");

  // Build per-school aggregated items
  const schoolMap = new Map<
    string,
    {
      items: Map<string, { name: string; qty: number; unit: string; category: string; price: number }>;
      status: string;
    }
  >();
  [...orders]
    .sort((a, b) => a.clientName.localeCompare(b.clientName))
    .forEach((order) => {
      if (!schoolMap.has(order.clientName)) {
        schoolMap.set(order.clientName, { items: new Map(), status: "" });
      }
      const entry = schoolMap.get(order.clientName)!;
      order.items
        .filter((it) => !it.deleted)
        .forEach((it) => {
          const key = `${it.name}||${it.unit}`;
          if (!entry.items.has(key)) {
            entry.items.set(key, { name: it.name, qty: 0, unit: it.unit, category: it.category, price: it.price ?? 0 });
          }
          entry.items.get(key)!.qty += it.qty ?? 0;
        });
    });

  // Status counts
  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1; });
  const statusSummary = Object.entries(statusCounts)
    .map(([s, c]) => `${s.toUpperCase()}${c > 1 ? ` (${c})` : ""}`)
    .join(" / ");

  const datePrinted = new Date().toLocaleDateString("en-PH");

  // Columns: A=ITEM NO, B=DESCRIPTION, C=CATEGORY, D=QTY, E=UNIT, F=UNIT PRICE, G=TOTAL COST
  // Col indices:           0              1            2     3      4     5            6

  const ws: Record<string, unknown> = {};
  let r = 0; // current row (0-indexed)

  // ── Header block ─────────────────────────────────────────────────────────
  setCell(ws, r, 0, "ALL SCHOOL ORDERS"); addMerge(ws, r, r, 0, 6);
  r++;
  setCell(ws, r, 0, "Purchase Request Form (All Orders)"); addMerge(ws, r, r, 0, 6);
  r++;
  r++; // blank

  // Meta info — 2-column grid (left: TO, ORDER, CATEGORY | right: DATE, ORDERS, STATUS)
  setCell(ws, r, 0, "TO:"); setCell(ws, r, 1, "OCCDHPC");
  setCell(ws, r, 4, "DATE :"); setCell(ws, r, 5, datePrinted); addMerge(ws, r, r, 5, 6);
  r++;
  setCell(ws, r, 0, "ORDER :"); setCell(ws, r, 1, weekLabel); addMerge(ws, r, r, 1, 3);
  setCell(ws, r, 4, "ORDERS :"); setCell(ws, r, 5, `Total ${orders.length} Orders`); addMerge(ws, r, r, 5, 6);
  r++;
  setCell(ws, r, 0, "CATEGORY :"); setCell(ws, r, 1, title.toUpperCase()); addMerge(ws, r, r, 1, 3);
  setCell(ws, r, 4, "STATUS :"); setCell(ws, r, 5, statusSummary); addMerge(ws, r, r, 5, 6);
  r++;
  r++; // blank

  // ── Table header ─────────────────────────────────────────────────────────
  const colHeaders = ["ITEM NO.", "DESCRIPTION", "CATEGORY", "QTY.", "UNIT", "UNIT PRICE", "TOTAL COST"];
  colHeaders.forEach((h, c) => setCell(ws, r, c, h));
  r++;

  // ── School sections ───────────────────────────────────────────────────────
  let grandTotal = 0;
  schoolMap.forEach(({ items, status: _ }, schoolName) => {
    const sortedItems = Array.from(items.values()).sort((a, b) => a.name.localeCompare(b.name));
    const schoolStatus = orders
      .filter((o) => o.clientName === schoolName)
      .map((o) => o.status.toUpperCase())
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .join(" / ");

    // School name row spanning all columns
    const schoolStartRow = r;
    setCell(ws, r, 0, schoolName); addMerge(ws, r, r, 0, 6);
    r++;

    sortedItems.forEach((item, idx) => {
      const totalCost = item.qty * item.price;
      grandTotal += totalCost;
      setCell(ws, r, 0, idx + 1, "n");
      setCell(ws, r, 1, item.name);
      setCell(ws, r, 2, categoryLabels[item.category] ?? item.category);
      setCell(ws, r, 3, item.qty, "n");
      setCell(ws, r, 4, item.unit);
      setCell(ws, r, 5, item.price, "n");
      setCell(ws, r, 6, totalCost, "n");
      r++;
    });

    // Status row for this school
    setCell(ws, r, 0, `Status: ${schoolStatus}`); addMerge(ws, r, r, 0, 6);
    r++;
    r++; // blank between schools
    void schoolStartRow;
  });

  // ── Grand total ───────────────────────────────────────────────────────────
  setCell(ws, r, 5, "Grand Total"); setCell(ws, r, 6, grandTotal, "n");
  r++;
  r++;

  // ── Signatures ────────────────────────────────────────────────────────────
  setCell(ws, r, 0, "Prepared by: _________________"); addMerge(ws, r, r, 0, 2);
  setCell(ws, r, 4, "Checked by: _________________"); addMerge(ws, r, r, 4, 6);
  r++;
  setCell(ws, r, 0, "Purchasing Coordinator"); addMerge(ws, r, r, 0, 2);
  setCell(ws, r, 4, "Principal/Head"); addMerge(ws, r, r, 4, 6);

  ws["!ref"] = `A1:${cellAddr(r, 6)}`;
  ws["!cols"] = [
    { wch: 8 },  // Item No
    { wch: 30 }, // Description
    { wch: 16 }, // Category
    { wch: 6 },  // Qty
    { wch: 10 }, // Unit
    { wch: 14 }, // Unit Price
    { wch: 14 }, // Total Cost
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws as Parameters<typeof XLSX.utils.book_append_sheet>[1], "All Orders");

  const safeTitle = title.replace(/[^a-z0-9]/gi, "_");
  const safeWeek = weekLabel.replace(/[^a-z0-9]/gi, "_");
  XLSX.writeFile(wb, `${safeTitle}_${safeWeek}_AllOrders.xlsx`);
}

// ─── Itemized Tally: Download as Excel ───────────────────────────────────────
// Layout matches the Itemized Tally print form:
// Fixed cols: ITEM NO | DESCRIPTION | CATEGORY | UNIT | UNIT PRICE
// Per-item: one row per school (school name + qty | subtotal), merged item cells
// Final cols: TOTAL QTY | TOTAL COST

export async function downloadItemizedTallyExcel(
  title: string,
  weekLabel: string,
  orders: WeeklyOrderRecord[],
  allSchools?: string[],
) {
  const XLSX = await import("xlsx");

  const schools =
    allSchools && allSchools.length > 0
      ? [...allSchools].sort()
      : Array.from(new Set(orders.map((o) => o.clientName))).sort();

  type TallyRow = {
    name: string;
    unit: string;
    price: number;
    category: string;
    schoolQty: Record<string, number>;
    totalQty: number;
    totalCost: number;
  };

  const rowMap = new Map<string, TallyRow>();
  orders.forEach((order) => {
    order.items
      .filter((it) => !it.deleted)
      .forEach((it) => {
        const normName = normalizeProductName(it.name);
        const normUnit = it.unit.toLowerCase().trim();
        const key = `${normName}||${normUnit}||${it.price ?? 0}`;
        if (!rowMap.has(key)) {
          rowMap.set(key, {
            name: it.name,
            unit: it.unit,
            price: it.price ?? 0,
            category: it.category,
            schoolQty: {},
            totalQty: 0,
            totalCost: 0,
          });
        }
        const row = rowMap.get(key)!;
        row.schoolQty[order.clientName] = (row.schoolQty[order.clientName] ?? 0) + (it.qty ?? 0);
        row.totalQty += it.qty ?? 0;
        row.totalCost += (it.qty ?? 0) * (it.price ?? 0);
      });
  });

  const tallyRows = Array.from(rowMap.values()).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  const grandTotal = tallyRows.reduce((s, r) => s + r.totalCost, 0);

  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1; });
  const statusSummary = Object.entries(statusCounts)
    .map(([s, c]) => `${s.toUpperCase()}${c > 1 ? ` (${c})` : ""}`)
    .join(" / ");
  const datePrinted = new Date().toLocaleDateString("en-PH");

  // Column layout (0-indexed):
  // 0=ITEM NO | 1=DESCRIPTION | 2=CATEGORY | 3=UNIT | 4=UNIT PRICE
  // 5=SCHOOL (name+qty label) | 6=SCHOOL SUBTOTAL | 7=TOTAL QTY | 8=TOTAL COST
  const TOTAL_COLS = 9;

  const ws: Record<string, unknown> = {};
  let r = 0;

  // ── Header block ──────────────────────────────────────────────────────────
  setCell(ws, r, 0, "ALL SCHOOL ORDERS"); addMerge(ws, r, r, 0, TOTAL_COLS - 1);
  r++;
  setCell(ws, r, 0, "Itemized Order Tally"); addMerge(ws, r, r, 0, TOTAL_COLS - 1);
  r++;
  r++; // blank

  // Meta info
  setCell(ws, r, 0, "TO:"); setCell(ws, r, 1, "OCCDHPC"); addMerge(ws, r, r, 1, 3);
  setCell(ws, r, 5, "DATE :"); setCell(ws, r, 6, datePrinted); addMerge(ws, r, r, 6, TOTAL_COLS - 1);
  r++;
  setCell(ws, r, 0, "ORDER :"); setCell(ws, r, 1, weekLabel); addMerge(ws, r, r, 1, 3);
  setCell(ws, r, 5, "ORDERS :"); setCell(ws, r, 6, `Total ${orders.length} Order${orders.length !== 1 ? "s" : ""}`); addMerge(ws, r, r, 6, TOTAL_COLS - 1);
  r++;
  setCell(ws, r, 0, "CATEGORY :"); setCell(ws, r, 1, title.toUpperCase()); addMerge(ws, r, r, 1, 3);
  setCell(ws, r, 5, "STATUS :"); setCell(ws, r, 6, statusSummary); addMerge(ws, r, r, 6, TOTAL_COLS - 1);
  r++;
  r++; // blank before table

  // ── Table column headers ──────────────────────────────────────────────────
  const headers = [
    "ITEM NO.",
    "DESCRIPTION",
    "CATEGORY",
    "UNIT",
    "UNIT PRICE",
    "SCHOOL QTY",
    "SCHOOL SUBTOTAL",
    "TOTAL QTY",
    "TOTAL COST",
  ];
  headers.forEach((h, c) => setCell(ws, r, c, h));
  r++;

  // ── Data rows ─────────────────────────────────────────────────────────────
  // For each tally item, emit one row per school that ordered it.
  // Item-level cells (cols 0–4, 7, 8) are merged vertically across all school rows.
  tallyRows.forEach((row, itemIdx) => {
    const orderingSchools = schools.filter((s) => (row.schoolQty[s] ?? 0) > 0);
    const schoolList = orderingSchools.length > 0 ? orderingSchools : [schools[0] ?? "—"];
    const itemRowStart = r;

    schoolList.forEach((school, sIdx) => {
      const qty = row.schoolQty[school] ?? 0;
      const subtotal = qty * row.price;
      const shortSchool = school
        .replace(/\s+elementary\s+school/i, "")
        .replace(/\s+integrated\s+school.*/i, "")
        .trim();

      // Item-level cells on first school row only (will be merged below)
      if (sIdx === 0) {
        setCell(ws, r, 0, itemIdx + 1, "n");
        setCell(ws, r, 1, row.name);
        setCell(ws, r, 2, categoryLabels[row.category] ?? row.category);
        setCell(ws, r, 3, row.unit);
        setCell(ws, r, 4, row.price, "n");
        setCell(ws, r, 7, row.totalQty, "n");
        setCell(ws, r, 8, row.totalCost, "n");
      }

      // Per-school data
      setCell(ws, r, 5, `${shortSchool} — ${qty > 0 ? qty : "–"}`);
      setCell(ws, r, 6, subtotal, "n");

      r++;
    });

    // Merge item-level columns across all school rows for this item
    if (schoolList.length > 1) {
      const itemRowEnd = r - 1;
      [0, 1, 2, 3, 4, 7, 8].forEach((c) =>
        addMerge(ws, itemRowStart, itemRowEnd, c, c),
      );
    }
    void itemRowStart;
  });

  // ── Grand total row ───────────────────────────────────────────────────────
  r++; // blank separator
  setCell(ws, r, 7, "Grand Total"); addMerge(ws, r, r, 0, 7);
  setCell(ws, r, 8, grandTotal, "n");
  r++;
  r++;

  // ── Signatures ────────────────────────────────────────────────────────────
  setCell(ws, r, 0, "Prepared by: _________________"); addMerge(ws, r, r, 0, 3);
  setCell(ws, r, 5, "Checked by: _________________"); addMerge(ws, r, r, 5, TOTAL_COLS - 1);
  r++;
  setCell(ws, r, 0, "Purchasing Coordinator"); addMerge(ws, r, r, 0, 3);
  setCell(ws, r, 5, "Principal/Head"); addMerge(ws, r, r, 5, TOTAL_COLS - 1);

  ws["!ref"] = `A1:${cellAddr(r, TOTAL_COLS - 1)}`;
  ws["!cols"] = [
    { wch: 8 },  // Item No
    { wch: 28 }, // Description
    { wch: 14 }, // Category
    { wch: 10 }, // Unit
    { wch: 12 }, // Unit Price
    { wch: 28 }, // School QTY (name + qty)
    { wch: 16 }, // School Subtotal
    { wch: 10 }, // Total Qty
    { wch: 14 }, // Total Cost
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws as Parameters<typeof XLSX.utils.book_append_sheet>[1], "Itemized Tally");

  const safeTitle = title.replace(/[^a-z0-9]/gi, "_");
  const safeWeek = weekLabel.replace(/[^a-z0-9]/gi, "_");
  XLSX.writeFile(wb, `${safeTitle}_${safeWeek}_ItemizedTally.xlsx`);
}

// ─── Pricing Update Catalog: Download as Excel ───────────────────────────────
// Mirrors the printCatalog layout: School Name | Item | Category | Default Qty | Unit | Price

export async function exportCatalogExcel(
  weekLabel: string,
  rows: {
    schoolName: string;
    product: {
      name: string;
      category: string;
      defaultQty: number;
      unit: string;
      price: number;
    };
    order?: { id: string; status: string };
  }[],
) {
  const XLSX = await import("xlsx");

  const ws: Record<string, unknown> = {};
  let r = 0;

  // ── Title block ─────────────────────────────────────────────────────────────
  setCell(ws, r, 0, "PRICING UPDATE"); addMerge(ws, r, r, 0, 5);
  r++;
  setCell(ws, r, 0, "Weekly Product Catalog"); addMerge(ws, r, r, 0, 5);
  r++;
  r++; // blank

  // ── Meta info ───────────────────────────────────────────────────────────────
  setCell(ws, r, 0, "WEEK :"); setCell(ws, r, 1, weekLabel); addMerge(ws, r, r, 1, 3);
  setCell(ws, r, 4, "DATE PRINTED :"); setCell(ws, r, 5, new Date().toLocaleDateString("en-PH"));
  r++;
  r++; // blank

  // ── Table header ─────────────────────────────────────────────────────────────
  const colHeaders = ["SCHOOL NAME", "ITEM", "CATEGORY", "DEFAULT QTY", "UNIT", "PRICE"];
  colHeaders.forEach((h, c) => setCell(ws, r, c, h));
  r++;

  // ── Data rows ────────────────────────────────────────────────────────────────
  rows.forEach((row) => {
    setCell(ws, r, 0, row.schoolName === "Z_NO_ORDERS" ? "No Orders" : row.schoolName);
    setCell(ws, r, 1, row.product.name);
    setCell(ws, r, 2, categoryLabels[row.product.category] ?? row.product.category);
    setCell(ws, r, 3, row.product.defaultQty, "n");
    setCell(ws, r, 4, row.product.unit);
    setCell(ws, r, 5, row.product.price, "n");
    r++;
  });

  ws["!ref"] = `A1:${cellAddr(r - 1, 5)}`;
  ws["!cols"] = [
    { wch: 30 }, // School Name
    { wch: 28 }, // Item
    { wch: 14 }, // Category
    { wch: 12 }, // Default Qty
    { wch: 10 }, // Unit
    { wch: 14 }, // Price
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws as Parameters<typeof XLSX.utils.book_append_sheet>[1], "Catalog");

  const safeWeek = weekLabel.replace(/[^a-z0-9]/gi, "_");
  XLSX.writeFile(wb, `PricingUpdate_${safeWeek}.xlsx`);
}

export async function printDeliveryReceipt(
  order: WeeklyOrderRecord,
  notes?: string,
  client?: ClientRecord,
  copyType: "ocgempc" | "school" | "deliverer" | "all" = "ocgempc",
  contactPerson?: string,
  contactNumber?: string,
  adminCoopId?: string,
  adminCoopName?: string,
  adminCoopAddress?: string,
  signatureDataUrl?: string
) {
  let resolvedClient = client;
  if (!resolvedClient) {
    try {
      const { resolveClientBySchoolName } = await import("../order/clientStorage");
      resolvedClient = await resolveClientBySchoolName(order.clientName);
    } catch (e) {
      console.error("Failed to resolve client record:", e);
    }
  }

  // Retrieve delivery price directly from schools table for maximum reliability
  let deliveryPrice = resolvedClient?.delivery_price || 0;
  try {
    const { data: schoolRecord } = await supabase
      .from("schools")
      .select("delivery_price")
      .ilike("name", order.clientName.trim())
      .maybeSingle();

    if (schoolRecord && schoolRecord.delivery_price !== null && schoolRecord.delivery_price !== undefined) {
      deliveryPrice = Number(schoolRecord.delivery_price);
    }
  } catch (e) {
    console.error("Failed to fetch delivery price directly from schools table:", e);
  }

  const address = resolvedClient?.address || "Address not provided";
  const resolvedContactPerson = contactPerson || resolvedClient?.contact_person || "";
  const resolvedContactNumber = contactNumber || resolvedClient?.contact_number || "";

  // Dynamic Cooperative Info from database (with OCGEMPC defaults if query fails)
  let coopName = adminCoopName || "OLONGAPO CITY GOVERNMENT EMPLOYEES' MULTIPURPOSE COOPERATIVE (OCGEMPC)";
  let coopAddress = adminCoopAddress || "3rd Floor City Hall Annex, Rizal Ave., West Bajac-Bajac, Olongapo City";
  let coopContact = "Contact No. 09323735919 / 09423124513";
  let coopShort = adminCoopName || "OCGEMPC";

  if (!adminCoopName) {
    let targetCoopId = adminCoopId || resolvedClient?.coop_id || "coop-1";
    let resolvedCoopName = "";
    let resolvedCoopAddress = "";

    try {
      const { data: receiptRec } = await supabase
        .from("delivery_receipt_records")
        .select("coop_id, printed_by, signature_data")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (receiptRec) {
        // Use saved signature from DB if none was passed in
        if (!signatureDataUrl && receiptRec.signature_data) {
          signatureDataUrl = receiptRec.signature_data as string;
        }
        if (receiptRec.coop_id) {
          targetCoopId = receiptRec.coop_id;
        }

        if (receiptRec.printed_by) {
          const { data: supplierProfile } = await supabase
            .from("user_profiles")
            .select("school_name, school_address, coop_id")
            .eq("email", receiptRec.printed_by)
            .maybeSingle();

          if (supplierProfile) {
            if (supplierProfile.school_name && supplierProfile.school_name.trim() !== "") {
              resolvedCoopName = supplierProfile.school_name;
              resolvedCoopAddress = supplierProfile.school_address || "";
            }
            if (supplierProfile.coop_id) {
              targetCoopId = supplierProfile.coop_id;
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to query supplier details from receipt records/user profiles:", e);
    }

    const isDefaultCoopName = !resolvedCoopName ||
      resolvedCoopName.toUpperCase() === "OCGEMPC" ||
      resolvedCoopName.toUpperCase() === "OLONGAPO CITY GOVERNMENT EMPLOYEES' MULTIPURPOSE COOPERATIVE (OCGEMPC)";

    if (!isDefaultCoopName) {
      coopName = resolvedCoopName;
      coopAddress = resolvedCoopAddress;
      coopShort = resolvedCoopName;
    } else {
      try {
        const { data: coop } = await supabase
          .from("coop_profile")
          .select("name,address,contact_no,short_name")
          .eq("id", targetCoopId)
          .maybeSingle();

        if (coop) {
          coopName = coop.name;
          coopAddress = coop.address || "";
          coopContact = coop.contact_no ? `Contact No. ${coop.contact_no}` : "";
          coopShort = coop.short_name || "OCGEMPC";
        }
      } catch (e) {
        console.error("Failed to fetch coop profile from database:", e);
      }
    }
  }

  // Exclude deleted items or items with no quantity
  const printableItems = order.items.filter(it => !it.deleted && it.qty && it.qty > 0);

  const orderDateFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });

  let deliveryDateFormatted = "Not set";
  const dateStr = order.deliveryDate;
  let dDate: Date | null = null;
  if (dateStr) {
    dDate = new Date(dateStr + "T12:00:00");
  } else {
    dDate = getFridayFromWeekLabel(order.weekLabel, order.createdAt);
  }
  if (dDate) {
    deliveryDateFormatted = dDate.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
  }

  const copiesToPrint: ("ocgempc" | "school" | "deliverer")[] =
    copyType === "all" ? ["ocgempc", "school", "deliverer"] : [copyType as any];

  const copyLabels: Record<string, string> = {
    ocgempc: `${coopShort} COPY`,
    school: "SCHOOL COPY",
    deliverer: "DELIVERER COPY",
  };

  const grandTotal = printableItems.reduce((sum, it) => sum + (it.qty || 0) * (it.price || 0), 0) + deliveryPrice;

  // Build HTML per copy
  let htmlContent = "";

  copiesToPrint.forEach((copy, idx) => {
    const isLast = idx === copiesToPrint.length - 1;
    const badgeLabel = copyLabels[copy] || "OCGEMPC COPY";

    // Build the received-by block: show signature image if provided, else blank line
    const receivedByBlock = signatureDataUrl
      ? `<img src="${signatureDataUrl}" class="sig-image" alt="Signature" />`
      : `<div class="sig-line"></div>`;

    htmlContent += `
      <div class="container ${!isLast ? 'page-break' : ''}">
        <!-- Header -->
        <div class="header-container">
          <div class="header-main">
            <div class="supplier-title">${coopName}</div>
            ${coopAddress ? `<div class="supplier-address">${coopAddress}</div>` : ""}
            ${coopContact ? `<div class="supplier-contact">${coopContact}</div>` : ""}
          </div>
        </div>

        <!-- Title and Badge -->
        <div class="title-row">
          <div class="form-title">DELIVERY RECEIPT</div>
          <div class="copy-badge">${badgeLabel}</div>
        </div>

        <!-- Metadata Box -->
        <div class="meta-box">
          <div class="meta-row">
            <div class="meta-label">TO:</div>
            <div class="meta-val">${order.clientName}</div>
          </div>
          <div class="meta-row">
            <div class="meta-label">DATE:</div>
            <div class="meta-val">${deliveryDateFormatted}</div>
          </div>
        </div>

        <!-- Items Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 80px; text-align: center;">ITEM NO.</th>
              <th>DESCRIPTION</th>
              <th style="width: 80px; text-align: center;">Qty.</th>
              <th style="width: 100px; text-align: center;">Unit</th>
              <th style="width: 120px; text-align: right;">Unit Price</th>
              <th style="width: 150px; text-align: right;">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            ${printableItems.map((item, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.qty}</td>
                <td style="text-align: center;">${item.unit}</td>
                <td style="text-align: right;">PHP ${(item.price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: right; font-weight: bold;">PHP ${((item.qty || 0) * (item.price || 0)).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `).join("")}
            <!-- nothing follows row -->
            <tr>
              <td style="text-align: center;">${printableItems.length + 1}</td>
              <td style="font-weight: bold; font-style: italic;">***nothing follows***</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            ${deliveryPrice > 0 ? `
              <tr>
                <td colspan="4" style="border: none;"></td>
                <td style="text-align: right; border: 1px solid #000; font-weight: bold;">Delivery Fee</td>
                <td style="text-align: right; border: 1px solid #000; font-weight: bold;">PHP ${deliveryPrice.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ` : ""}
            <!-- grand total row -->
            <tr>
              <td colspan="4" style="border: none;"></td>
              <td style="text-align: right; border: 1px solid #000; font-weight: bold; background-color: #fafafa;">PHP</td>
              <td style="text-align: right; border: 1px solid #000; font-weight: bold; background-color: #fafafa; font-size: 14px;">${grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <!-- Signatures & Contacts -->
        <div class="footer-row">
          <div class="sig-block">
            <div class="sig-line-container">
              ${receivedByBlock}
              <div class="sig-label">RECEIVED BY: (NAME &amp; SIGN)</div>
            </div>
            ${resolvedContactPerson ? `
              <div class="contact-details">
                <div>Contact Person: ${resolvedContactPerson}</div>
                ${resolvedContactNumber ? `<div>${resolvedContactNumber}</div>` : ""}
              </div>
            ` : ""}
          </div>
        </div>
      </div>
    `;
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Delivery Receipt - ${order.clientName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; color: #000; padding: 40px 20px; }

        .container {
          background: white;
          max-width: 800px;
          margin: 0 auto 40px auto;
          padding: 45px;
          border: 1px solid #ccc;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }

        .header-container { text-align: center; margin-bottom: 25px; }
        .supplier-title { font-size: 14px; font-weight: bold; text-transform: uppercase; line-height: 1.3; }
        .supplier-address, .supplier-contact { font-size: 11px; color: #333; margin-top: 2px; }

        .title-row { display: flex; align-items: center; justify-content: center; position: relative; margin: 25px 0 15px 0; }
        .form-title { font-size: 20px; font-weight: 800; letter-spacing: 1.5px; text-align: center; }
        .copy-badge { position: absolute; right: 0; border: 1px solid #7c3aed; background-color: #f5f3ff; color: #7c3aed; padding: 4px 10px; font-size: 10px; font-weight: bold; border-radius: 4px; }

        .meta-box { border: 1px solid #000; margin-bottom: 20px; font-size: 12px; width: 100%; }
        .meta-row { display: flex; border-bottom: 1px solid #000; }
        .meta-row:last-child { border-bottom: none; }
        .meta-label { width: 80px; font-weight: bold; padding: 6px 10px; border-right: 1px solid #000; background-color: #fafafa; }
        .meta-val { padding: 6px 10px; flex: 1; font-weight: bold; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
        th { border: 1px solid #000; padding: 8px 10px; font-weight: bold; background-color: #fafafa; text-transform: uppercase; }
        td { border: 1px solid #000; padding: 8px 10px; }

        .footer-row { display: flex; justify-content: space-between; margin-top: 45px; font-size: 11px; }
        .sig-block { width: 48%; }
        .sig-line-container { display: flex; flex-direction: column; margin-bottom: 8px; }
        .sig-line { border-bottom: 1.5px solid #000; width: 220px; height: 30px; }
        .sig-image { width: 220px; height: 70px; object-fit: contain; display: block; border-bottom: 1.5px solid #000; }
        .sig-label { font-size: 10px; font-weight: bold; margin-top: 4px; }
        .contact-details { margin-top: 10px; font-size: 11px; font-weight: bold; line-height: 1.4; }

        @media print {
          body { background: white; padding: 0; }
          .container { border: none; box-shadow: none; padding: 20px; margin-bottom: 0; }
          .page-break { page-break-after: always; border-bottom: 1px dashed #ccc; padding-bottom: 20px; margin-bottom: 20px; }
          th { background-color: #f0f0f0 !important; }
          .copy-badge { border: 1px solid #000 !important; background-color: transparent !important; color: #000 !important; }
          * { color: #000 !important; }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
      <script>
        // Wait for data-URI signature images to fully decode before opening print dialog
        window.addEventListener('load', function() {
          var imgs = document.querySelectorAll('img.sig-image');
          if (imgs.length === 0) {
            window.print();
            return;
          }
          var remaining = imgs.length;
          function tryPrint() {
            remaining--;
            if (remaining <= 0) { window.focus(); window.print(); }
          }
          imgs.forEach(function(img) {
            if (img.complete && img.naturalWidth > 0) {
              tryPrint();
            } else {
              img.addEventListener('load', tryPrint);
              img.addEventListener('error', tryPrint);
            }
          });
        });
      <\/script>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // print() is triggered by the inline window load listener inside the HTML,
    // ensuring data-URI signature images are fully decoded before the print dialog opens.
  }
}
