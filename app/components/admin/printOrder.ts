import type { WeeklyOrderRecord } from "../order/types";

export function printOrderForm(order: WeeklyOrderRecord) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Purchase Request - ${order.clientName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px;
          border: 3px solid #001f3f;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #001f3f;
          padding-bottom: 20px;
        }
        .school-name {
          font-size: 18px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .school-address {
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
        }
        .form-title {
          font-size: 24px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .form-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
          font-size: 13px;
        }
        .form-info-item {
          display: flex;
          gap: 10px;
        }
        .form-info-label {
          font-weight: bold;
          min-width: 80px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: #f0f0f0;
          border: 1px solid #999;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          font-size: 12px;
          text-transform: uppercase;
        }
        td {
          border: 1px solid #999;
          padding: 12px;
          font-size: 12px;
        }
        td.number-col {
          text-align: center;
          width: 40px;
        }
        td.total {
          text-align: right;
          font-weight: bold;
        }
        .empty-row {
          height: 30px;
        }
        .grand-total {
          text-align: right;
          font-weight: bold;
          padding-top: 10px;
          border-top: 2px solid #999;
        }
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 50px;
          font-size: 12px;
        }
        .signature-line {
          border-bottom: 1px solid #333;
          padding-bottom: 5px;
          margin-bottom: 5px;
        }
        .signature-label {
          font-size: 11px;
          color: #666;
        }
        .notes-section {
          margin-top: 20px;
          font-size: 12px;
        }
        .notes-label {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .notes-content {
          border: 1px solid #ddd;
          padding: 10px;
          min-height: 40px;
          white-space: pre-wrap;
        }
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .container {
            border: 1px solid #999;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="school-name">${order.clientName}</div>
          <div class="school-address">Block 19, Long Road, Gordon Heights, Olongapo City</div>
        </div>

        <div class="form-title">Purchase Request Form</div>

        <div class="form-info">
          <div class="form-info-item">
            <span class="form-info-label">TO:</span>
            <span>OCCDHPC</span>
          </div>
          <div class="form-info-item">
            <span class="form-info-label">DATE :</span>
            <span>${new Date().toLocaleDateString("en-PH")}</span>
          </div>
          <div class="form-info-item">
            <span class="form-info-label">ORDER :</span>
            <span>${order.weekLabel}</span>
          </div>
          <div class="form-info-item">
            <span class="form-info-label">DELIVERY DATE :</span>
            <span>${new Date().toLocaleDateString("en-PH")}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ITEM NO.</th>
              <th>DESCRIPTION</th>
              <th>QTY.</th>
              <th>UNIT</th>
              <th>UNIT PRICE</th>
              <th>TOTAL COST</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (item, index) => `
              <tr>
                <td class="number-col">${index + 1}</td>
                <td>${item.name}</td>
                <td class="number-col">${item.qty}</td>
                <td>${item.unit}</td>
                <td>PHP</td>
                <td class="total">-</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div style="text-align: right; font-weight: bold; margin-bottom: 30px;">
          Grand Total: <span style="border-bottom: 1px solid #333; padding: 0 20px;">PHP -</span>
        </div>

        ${
          order.notes
            ? `
        <div class="notes-section">
          <div class="notes-label">NOTES:</div>
          <div class="notes-content">${order.notes}</div>
        </div>
        `
            : ""
        }

        <div class="signature-section">
          <div>
            <div class="signature-line"></div>
            <div class="signature-label">Prepared by: _________________</div>
            <div style="margin-top: 15px;">Purchasing Coordinator</div>
          </div>
          <div>
            <div class="signature-line"></div>
            <div class="signature-label">Checked by: _________________</div>
            <div style="margin-top: 15px;">Principal/Head</div>
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
