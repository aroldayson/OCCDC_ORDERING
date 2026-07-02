import type { WeeklyOrderRecord } from "../order/types";
import type { WeeklyProduct } from "../order/products";
import { ClientRecord } from "../order/clientStorage";

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


export function printOrderForm(order: WeeklyOrderRecord, notes?: string, client?: ClientRecord) {
  const address = client?.address || "Address not provided";
  const deliveryPrice = client?.delivery_price || 0;

  // Exclude deleted items and items with no price from print
  const printableItems = order.items.filter(it => !it.deleted && it.price && it.price > 0);

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
          <div class="form-info-item"><span class="form-info-label">DATE :</span><span>${new Date().toLocaleDateString("en-PH")}</span></div>
          <div class="form-info-item"><span class="form-info-label">ORDER :</span><span>${order.weekLabel}</span></div>
          <div class="form-info-item"><span class="form-info-label">DELIVERY DATE :</span><span>${new Date().toLocaleDateString("en-PH")}</span></div>
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
        <div class="signature-section">
          <div>
            <div class="signature-line"></div>
            <div class="signature-label">Prepared by: _________________</div>
            <div style="margin-top:15px;">Purchasing Coordinator</div>
          </div>
          <div>
            <div class="signature-line"></div>
            <div class="signature-label">Checked by: _________________</div>
            <div style="margin-top:15px;">Principal/Head</div>
          </div>
        </div>
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
  clientRecord?: ClientRecord
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
        <div class="signature-section">
          <div>
            <div class="signature-line"></div>
            <div class="signature-label">Prepared by: _________________</div>
            <div style="margin-top:15px;">Purchasing Coordinator</div>
          </div>
          <div>
            <div class="signature-line"></div>
            <div class="signature-label">Checked by: _________________</div>
            <div style="margin-top:15px;">Principal/Head</div>
          </div>
        </div>
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

export function printAllOrders(
  title: string,
  weekLabel: string,
  orders: WeeklyOrderRecord[]
) {
  const itemsMap: Record<string, { name: string; qty: number; unit: string; category: string; price?: number; deleted?: boolean }> = {};

  orders.forEach(order => {
    order.items
      .filter(item => !item.deleted) // exclude deleted items
      .forEach(item => {
        const key = `${item.productId}-${item.price}`;
        if (!itemsMap[key]) {
          itemsMap[key] = { ...item };
        } else {
          itemsMap[key].qty += item.qty;
        }
      });
  });

  const allItems = Object.values(itemsMap);
  const schoolNames = Array.from(new Set(orders.map(o => o.clientName))).join(" / ");
  printClientSummary(schoolNames || title, weekLabel, allItems, orders);
}
