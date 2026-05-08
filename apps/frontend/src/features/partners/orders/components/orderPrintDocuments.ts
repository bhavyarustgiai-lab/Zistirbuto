import type { PartnerClientBusiness, PartnerClientOutlet, PartnerFirm, PartnerInvoice } from "@shared/types/domain";
import type { PartnerOrder } from "../types";

type PrintContext = {
  firm?: PartnerFirm;
  order: PartnerOrder;
  business?: PartnerClientBusiness;
  outlet?: PartnerClientOutlet;
};

type InvoicePrintContext = PrintContext & {
  invoice: PartnerInvoice;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function printHtmlDocument(title: string, body: string) {
  const iframe = document.createElement("iframe");
  iframe.title = title;
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  document.body.appendChild(iframe);

  const printWindow = iframe.contentWindow;
  const printDocument = printWindow?.document;
  if (!printWindow || !printDocument) {
    iframe.remove();
    throw new Error("Unable to prepare print document. Please try again.");
  }

  printDocument.open();
  printDocument.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #f8fafc;
            color: #0f172a;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 13px;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: #fff;
            padding: 18mm;
          }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 16px;
          }
          h1, h2, h3, p { margin: 0; }
          h1 { font-size: 24px; line-height: 1.2; }
          h2 { font-size: 15px; margin-bottom: 6px; }
          .muted { color: #64748b; }
          .strong { font-weight: 700; }
          .section-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            margin-top: 18px;
          }
          .box {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
          }
          th {
            background: #f8fafc;
            color: #475569;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            text-align: left;
            border: 1px solid #e2e8f0;
            padding: 8px;
          }
          td {
            border: 1px solid #e2e8f0;
            padding: 8px;
            vertical-align: top;
          }
          .right { text-align: right; }
          .totals {
            width: 320px;
            margin: 18px 0 0 auto;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding: 9px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .total-row:last-child { border-bottom: 0; }
          .grand { font-size: 15px; font-weight: 800; }
          .footer {
            margin-top: 28px;
            display: flex;
            justify-content: space-between;
            gap: 24px;
            color: #475569;
          }
          .checkbox {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 1px solid #64748b;
            border-radius: 2px;
          }
          @media print {
            body { background: #fff; }
            .page { width: auto; min-height: auto; margin: 0; padding: 10mm; }
          }
        </style>
      </head>
      <body>
        <main class="page">${body}</main>
      </body>
    </html>
  `);
  printDocument.close();

  const cleanup = () => {
    setTimeout(() => iframe.remove(), 500);
    printWindow.removeEventListener("afterprint", cleanup);
  };

  printWindow.addEventListener("afterprint", cleanup);
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        iframe.remove();
      }
    }, 10_000);
  }, 150);
}

function firmBlock(firm?: PartnerFirm) {
  return `
    <h2>${escapeHtml(firm?.tradeName || firm?.name || "Zistributo Partner")}</h2>
    ${firm?.billingAddress ? `<p>${escapeHtml(firm.billingAddress)}</p>` : ""}
    ${firm?.city ? `<p>${escapeHtml(firm.city)}</p>` : ""}
    ${firm?.gstin ? `<p>GST: ${escapeHtml(firm.gstin)}</p>` : ""}
    ${firm?.phone ? `<p>Phone: ${escapeHtml(firm.phone)}</p>` : ""}
    ${firm?.email ? `<p>Email: ${escapeHtml(firm.email)}</p>` : ""}
  `;
}

export function printPartnerInvoice({ firm, invoice, order, business, outlet }: InvoicePrintContext) {
  const documentTitle = "Invoice";
  const subtotal = invoice.items.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  const taxableTotal = invoice.items.reduce((sum, item) => sum + (item.taxableValue ?? item.rate * item.quantity), 0);
  const cgstTotal = invoice.items.reduce((sum, item) => sum + (item.cgstAmount ?? 0), 0);
  const sgstTotal = invoice.items.reduce((sum, item) => sum + (item.sgstAmount ?? 0), 0);
  const igstTotal = invoice.items.reduce((sum, item) => sum + (item.igstAmount ?? 0), 0);
  const gstTotal = cgstTotal + sgstTotal + igstTotal;
  const discount = Math.max(subtotal - taxableTotal, 0);
  const rows = invoice.items
    .map(
      (item, index) => `
        <tr>
          <td class="right">${index + 1}</td>
          <td>
            <div class="strong">${escapeHtml(item.itemName)}</div>
            <div class="muted">SKU: ${escapeHtml(item.itemCode)}</div>
          </td>
          <td>${escapeHtml(item.hsnSac || "-")}</td>
          <td class="right">${formatNumber(item.quantity)}</td>
          <td class="right">${formatMoney(item.rate)}</td>
          <td class="right">${item.gstPercentage ?? 0}%</td>
          <td class="right">${formatMoney(item.taxableValue ?? item.rate * item.quantity)}</td>
          <td class="right">${formatMoney(item.cgstAmount ?? 0)}</td>
          <td class="right">${formatMoney(item.sgstAmount ?? 0)}</td>
          <td class="right">${formatMoney(item.igstAmount ?? 0)}</td>
          <td class="right strong">${formatMoney(item.lineTotal)}</td>
        </tr>
      `,
    )
    .join("");

  printHtmlDocument(
    `${invoice.invoiceNumber} ${documentTitle}`,
    `
      <div class="header">
        <div>
          <h1>${documentTitle}</h1>
          <p class="muted">Order ${escapeHtml(order.orderNumber)}</p>
        </div>
        <div class="right">
          <p class="strong">${escapeHtml(invoice.invoiceNumber)}</p>
          <p>Invoice date: ${escapeHtml(formatDate(invoice.invoiceDate))}</p>
          <p>Due date: ${escapeHtml(formatDate(invoice.dueDate || invoice.invoiceDate))}</p>
        </div>
      </div>

      <div class="section-grid">
        <div class="box">
          <h2>Seller</h2>
          ${firmBlock(firm)}
        </div>
        <div class="box">
          <h2>Buyer</h2>
          <p class="strong">${escapeHtml(invoice.billToName || business?.businessName || order.clientBusinessName)}</p>
          ${invoice.billToGstin ? `<p>GST: ${escapeHtml(invoice.billToGstin)}</p>` : ""}
          ${invoice.billToAddress ? `<p>${escapeHtml(invoice.billToAddress)}</p>` : ""}
          <p class="muted" style="margin-top: 8px;">Ship to</p>
          <p>${escapeHtml(invoice.deliverToName || outlet?.outletName || order.clientOutletName)}</p>
          ${invoice.deliverToAddress ? `<p>${escapeHtml(invoice.deliverToAddress)}</p>` : ""}
          ${invoice.deliverToManagerPhone ? `<p>Phone: ${escapeHtml(invoice.deliverToManagerPhone)}</p>` : ""}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="right">#</th>
            <th>Item</th>
            <th>HSN</th>
            <th class="right">Qty</th>
            <th class="right">Rate</th>
            <th class="right">GST %</th>
            <th class="right">Taxable</th>
            <th class="right">CGST</th>
            <th class="right">SGST</th>
            <th class="right">IGST</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>${formatMoney(subtotal)}</span></div>
        <div class="total-row"><span>Margin discount</span><span>-${formatMoney(discount)}</span></div>
        <div class="total-row"><span>Taxable value</span><span>${formatMoney(taxableTotal)}</span></div>
        <div class="total-row"><span>GST</span><span>${formatMoney(gstTotal)}</span></div>
        <div class="total-row grand"><span>Total payable</span><span>${formatMoney(invoice.amount)}</span></div>
      </div>

      <div class="footer">
        <p>This is a computer generated invoice.</p>
        <p class="right">Authorised signatory</p>
      </div>
    `,
  );
}

export function printPartnerPackagingSlip({ firm, order, business, outlet }: PrintContext) {
  const allocationsByCatalog = new Map<string, PartnerOrder["items"]>();
  for (const line of order.items) {
    const catalogItemId = line.catalogItemId || line.itemId;
    allocationsByCatalog.set(catalogItemId, [...(allocationsByCatalog.get(catalogItemId) ?? []), line]);
  }
  const requestedLines = order.requestedItems?.length ? order.requestedItems : order.items;
  const rows = requestedLines
    .flatMap((line) => {
      const catalogItemId = line.catalogItemId || line.itemId;
      const allocations = allocationsByCatalog.get(catalogItemId) ?? [];
      if (!allocations.length) {
        return [
          `
            <tr>
              <td>
                <div class="strong">${escapeHtml(line.itemName)}</div>
                <div class="muted">SKU: ${escapeHtml(line.itemCode)}</div>
              </td>
              <td class="muted">No allocated batch</td>
              <td class="right">${formatNumber(line.quantity)}</td>
              <td class="right">0</td>
              <td class="right"><span class="checkbox"></span></td>
            </tr>
          `,
        ];
      }
      return allocations.map(
        (allocation) => `
          <tr>
            <td>
              <div class="strong">${escapeHtml(line.itemName)}</div>
              <div class="muted">SKU: ${escapeHtml(line.itemCode)}</div>
            </td>
            <td>${escapeHtml(allocation.itemCode)}</td>
            <td class="right">${formatNumber(line.quantity)}</td>
            <td class="right strong">${formatNumber(allocation.quantity)}</td>
            <td class="right"><span class="checkbox"></span></td>
          </tr>
        `,
      );
    })
    .join("");

  printHtmlDocument(
    `${order.orderNumber} Packaging Slip`,
    `
      <div class="header">
        <div>
          <h1>Packaging Slip</h1>
          <p class="muted">Internal warehouse document</p>
        </div>
        <div class="right">
          <p class="strong">${escapeHtml(order.orderNumber)}</p>
          <p>Order date: ${escapeHtml(formatDate(order.orderDate))}</p>
          <p>Dispatch date: ${escapeHtml(formatDate(order.dispatchDate || order.dispatchedAt))}</p>
          <p>Status: ${escapeHtml(order.status)}</p>
        </div>
      </div>

      <div class="section-grid">
        <div class="box">
          <h2>Firm</h2>
          ${firmBlock(firm)}
        </div>
        <div class="box">
          <h2>Client / Outlet</h2>
          <p class="strong">${escapeHtml(business?.businessName || order.clientBusinessName)}</p>
          ${business?.gstin ? `<p>GST: ${escapeHtml(business.gstin)}</p>` : ""}
          <p class="muted" style="margin-top: 8px;">Outlet</p>
          <p>${escapeHtml(outlet?.outletName || order.clientOutletName)}</p>
          ${outlet?.address ? `<p>${escapeHtml(outlet.address)}</p>` : ""}
          ${outlet?.contacts?.[0]?.phone ? `<p>Phone: ${escapeHtml(outlet.contacts[0].phone)}</p>` : ""}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Batch / Source</th>
            <th class="right">Requested</th>
            <th class="right">Pick Qty</th>
            <th class="right">Packed</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="footer">
        <p>Picked by: ____________________</p>
        <p>Packed by: ____________________</p>
        <p>Checked by: ____________________</p>
      </div>
    `,
  );
}
