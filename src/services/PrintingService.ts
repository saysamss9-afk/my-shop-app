import RNPrint from 'react-native-print';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Receipt {
  shopName: string;
  address: string;
  saleId: string;
  timestamp: string;
  items: ReceiptItem[];
  total: number;
  employeeName: string;
  customerName?: string;
  paymentMethod: string;
}

export class PrintingService {
  static async printReceipt(receipt: Receipt): Promise<void> {
    try {
      const html = this.generateHtml(receipt);
      if (RNPrint && typeof RNPrint.print === 'function') {
        await RNPrint.print({
          html: html,
          jobName: `Receipt_${receipt.saleId}`,
        });
      } else if (typeof window !== 'undefined' && typeof window.print === 'function') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        console.warn('Printing is not supported on this platform platform structure.');
      }
    } catch (error) {
      console.error('Printing failed:', error);
      throw error;
    }
  }

  private static generateHtml(receipt: Receipt): string {
    const itemsHtml = receipt.items
      .map(
        (item) =>
          `<tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td style="text-align: right;">$${(item.quantity * item.price).toFixed(2)}</td>
          </tr>`
      )
      .join('');

    return `
      <html>
        <body style='font-family: monospace; padding: 20px;'>
          <h2 style='text-align: center;'>${receipt.shopName}</h2>
          <p style='text-align: center;'>${receipt.address}</p>
          <hr/>
          <p>Sale ID: ${receipt.saleId}</p>
          <p>Date: ${receipt.timestamp}</p>
          <table style='width: 100%; text-align: left;'>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th><th style="text-align: right;">Total</th></tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <hr/>
          <h3 style='text-align: right;'>Total: $${receipt.total.toFixed(2)}</h3>
          <p>Served by: ${receipt.employeeName}</p>
          <p style='text-align: center; margin-top: 20px;'>Thank you for choosing us! We value your presence and hope to see you again soon.</p>
        </body>
      </html>
    `;
  }

  static async printBarcodes(products: any[]): Promise<void> {
    try {
      const barcodeHtml = `
        <html>
          <head>
            <style>
              @page {
                size: auto;
                margin: 5mm;
              }
              @media print {
                body { margin: 0; padding: 0; background: #fff; width: 100%; }
                .no-print { display: none; }
                .page-break { page-break-inside: avoid; break-inside: avoid; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              }
              body { font-family: system-ui, -apple-system, sans-serif; padding: 10px; background: #fff; color: #333; width: 100%; margin: 0; }
              .grid-container {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                justify-content: center;
                width: 100%;
              }
              .barcode-card {
                border: 1px solid #000;
                padding: 8px;
                border-radius: 4px;
                width: 130px; /* Compact width for mini-printers */
                background: #fff;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                page-break-inside: avoid;
                break-inside: avoid;
                margin-bottom: 5px;
              }
              .bar-line {
                display: inline-block;
                height: 34px;
                background-color: #000 !important;
                border-left: 1px solid #000;
              }
            </style>
          </head>
          <body>
            <h3 style="text-align: center; color: #1e293b; margin-top: 0;" class="no-print">Print Preview Sheet</h3>
            <div class="grid-container">
              ${products.map(p => {
                const codeValue = p.barcode || p.id.slice(-8).toUpperCase();
                return `
                <div class="barcode-card">
                  <div style="font-size: 11px; font-weight: 700; margin-bottom: 2px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; width: 100%;">
                    ${p.name}
                  </div>
                  <div style="font-size: 9px; color: #64748b; margin-bottom: 6px;">
                    LN: ${p.id.slice(-6).toUpperCase()}
                  </div>

                  <!-- Absolute size render metrics with forced color adjustment for all printers -->
                  <div style="display: flex; align-items: stretch; justify-content: center; width: 120px; height: 36px; background: #fff; overflow: hidden; margin-bottom: 4px; border-bottom: 1px solid #eee;">
                    <span class="bar-line" style="width: 2px; border-left-width: 2px; margin-right: 2px;"></span>
                    <span class="bar-line" style="width: 1px; border-left-width: 1px; margin-right: 1px;"></span>
                    <span class="bar-line" style="width: 3px; border-left-width: 3px; margin-right: 2px;"></span>
                    <span class="bar-line" style="width: 1px; border-left-width: 1px; margin-right: 1px;"></span>
                    <span class="bar-line" style="width: 2px; border-left-width: 2px; margin-right: 3px;"></span>
                    <span class="bar-line" style="width: 4px; border-left-width: 4px; margin-right: 1px;"></span>
                    <span class="bar-line" style="width: 1px; border-left-width: 1px; margin-right: 2px;"></span>
                    <span class="bar-line" style="width: 2px; border-left-width: 2px; margin-right: 1px;"></span>
                    <span class="bar-line" style="width: 3px; border-left-width: 3px; margin-right: 2px;"></span>
                    <span class="bar-line" style="width: 1px; border-left-width: 1px; margin-right: 1px;"></span>
                    <span class="bar-line" style="width: 2px; border-left-width: 2px; margin-right: 1px;"></span>
                    <span class="bar-line" style="width: 4px; border-left-width: 4px; margin-right: 2px;"></span>
                    <span class="bar-line" style="width: 1px; border-left-width: 1px; margin-right: 1px;"></span>
                    <span class="bar-line" style="width: 3px; border-left-width: 3px; margin-right: 0;"></span>
                  </div>

                  <div style="font-family: monospace; font-size: 11px; font-weight: 600; letter-spacing: 1px;">
                    ${codeValue}
                  </div>
                </div>
                `;
              }).join('')}
            </div>
          </body>
        </html>
      `;

      if (RNPrint && typeof RNPrint.print === 'function') {
        await RNPrint.print({
          html: barcodeHtml,
          jobName: 'Inventory_Auto_Barcodes',
        });
      } else if (typeof window !== 'undefined' && typeof window.print === 'function') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(barcodeHtml);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (e) {
      console.error('Barcode listing print failed:', e);
    }
  }

  static async printSalesSummary(shopInfo: any, sales: any[], currency: string): Promise<void> {
    try {
      const summaryHtml = `
        <html>
          <head>
            <style>
              @page { size: auto; margin: 5mm; }
              @media print {
                body { margin: 0; padding: 0; background: #fff; width: 100%; }
                .no-print { display: none; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              }
              body { font-family: system-ui, sans-serif; padding: 10px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
              .sale-box { border: 1px solid #000; padding: 8px; margin-bottom: 10px; page-break-inside: avoid; }
              .sale-header { display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px dashed #ccc; margin-bottom: 5px; padding-bottom: 2px; }
              .item-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px; }
              .total-row { display: flex; justify-content: space-between; font-weight: bold; margin-top: 5px; border-top: 1px solid #eee; padding-top: 2px; }
              .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2 style="margin: 0;">${shopInfo.name}</h2>
              <div style="font-size: 12px;">${shopInfo.address || ''}</div>
              <h3 style="margin: 10px 0 0 0;">BATCH SALES REPORT</h3>
            </div>

            ${sales.map(s => `
              <div class="sale-box">
                <div class="sale-header">
                  <span>#${s.id.slice(-8).toUpperCase()} ${s.isReverted ? '(REVERTED)' : ''}</span>
                  <span>${new Date(s.timestamp).toLocaleDateString()}</span>
                </div>
                <div style="font-size: 11px; margin-bottom: 5px;">
                  Staff: ${s.staffName} (${s.staffRole}) | Payment: ${s.paymentMethod}
                </div>

                ${s.items.map((i: any) => `
                  <div class="item-row">
                    <span>${i.productName} (${i.quantity} x ${currency}${i.priceAtSale.toFixed(2)})</span>
                    <span style="font-weight: bold;">${currency}${(i.quantity * i.priceAtSale).toFixed(2)}</span>
                  </div>
                `).join('')}

                <div class="total-row">
                  <span>TOTAL</span>
                  <span>${currency}${s.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            `).join('')}

            <div class="footer">
              Printed on ${new Date().toLocaleString()} | My Shop Management System
            </div>
          </body>
        </html>
      `;

      if (RNPrint && typeof RNPrint.print === 'function') {
        await RNPrint.print({ html: summaryHtml, jobName: 'Sales_Batch_Report' });
      } else if (typeof window !== 'undefined' && typeof window.print === 'function') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(summaryHtml);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (e) {
      console.error('Batch sales print failed:', e);
    }
  }
}
