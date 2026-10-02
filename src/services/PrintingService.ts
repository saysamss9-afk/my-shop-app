import RNPrint from 'react-native-print';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Receipt {
  shopName: string;
  companyName?: string;
  address: string;
  location?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  saleId: string;
  timestamp: string;
  items: ReceiptItem[];
  total: number;
  employeeName: string;
  customerName?: string;
  paymentMethod: string;
  currency: string;
}

export class PrintingService {
  private static isPrinting = false;

  private static async executePrint(html: string, jobName: string): Promise<void> {
    if (this.isPrinting) {
      console.warn('Printing is already in progress. Skipping duplicate print call.');
      return;
    }
    this.isPrinting = true;
    try {
      if (RNPrint && typeof RNPrint.print === 'function') {
        await RNPrint.print({
          html,
          jobName,
          baseUrl: 'file:///',
        });
      } else if (typeof window !== 'undefined' && typeof window.print === 'function') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        console.warn('Printing is not supported on this platform.');
      }
    } catch (error) {
      console.error('Print execution failed gracefully:', error);
    } finally {
      // Cooldown buffer to prevent Android WebView mWebView lifecycle races
      setTimeout(() => {
        PrintingService.isPrinting = false;
      }, 1500);
    }
  }

  static async printReceipt(receipt: Receipt): Promise<void> {
    try {
      const html = this.generateHtml(receipt);
      await this.executePrint(html, `Receipt_${receipt.saleId || 'Sale'}`);
    } catch (error) {
      console.error('Printing receipt failed:', error);
    }
  }

  private static generateHtml(receipt: Receipt): string {
    const items = receipt.items || [];
    const itemsHtml = items.length > 0
      ? items.map(
        (item) => {
          const name = item.name || 'Item';
          const qty = Number(item.quantity || 0);
          const price = Number(item.price || 0);
          return `<tr>
            <td>${name}</td>
            <td style="text-align: center;">${qty}</td>
            <td>${receipt.currency}${price.toFixed(2)}</td>
            <td style="text-align: right;">${receipt.currency}${(qty * price).toFixed(2)}</td>
          </tr>`;
        }
      ).join('')
      : `<tr><td colspan="4" style="text-align: center; color: #888;">No items listed</td></tr>`;

    const total = Number(receipt.total || 0);
    const shopName = receipt.shopName || 'My Shop';
    const companyName = receipt.companyName || '';
    const address = receipt.location || receipt.address || '';
    const phone = receipt.phone || '';
    const email = receipt.email || '';
    const workingHours = receipt.workingHours || '';

    return `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: monospace; padding: 20px; margin: 0; background: #fff; color: #000; }
            table { width: 100%; border-collapse: collapse; text-align: left; }
            th, td { padding: 4px 0; }
            .header { text-align: center; margin-bottom: 12px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
            .header h2 { margin: 0 0 2px 0; font-size: 20px; font-weight: bold; }
            .header .tagline { font-size: 11px; font-style: italic; color: #333; margin-bottom: 4px; }
            .header .info { font-size: 11px; margin: 2px 0; color: #222; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${shopName}</h2>
            ${companyName ? `<div class="tagline">${companyName}</div>` : ''}
            ${address ? `<div class="info">Location: ${address}</div>` : ''}
            ${phone ? `<div class="info">Tel: ${phone}</div>` : ''}
            ${email ? `<div class="info">Email: ${email}</div>` : ''}
            ${workingHours ? `<div class="info">Hours: ${workingHours}</div>` : ''}
          </div>
          <p>Sale ID: ${receipt.saleId || 'N/A'}</p>
          <p>Date: ${receipt.timestamp || ''}</p>
          <table>
            <thead>
              <tr><th>Item</th><th style="text-align: center;">Qty</th><th>Price</th><th style="text-align: right;">Total</th></tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <hr/>
          <h3 style='text-align: right;'>Total: ${receipt.currency || '$'}${total.toFixed(2)}</h3>
          <p>Served by: ${receipt.employeeName || 'Staff'}</p>
          ${receipt.customerName ? `<p>Customer: ${receipt.customerName}</p>` : ''}
          <p style='text-align: center; margin-top: 20px;'>Thank you for choosing us! We value your presence and hope to see you again soon.</p>
        </body>
      </html>
    `;
  }

  static async printBarcodes(products: any[]): Promise<void> {
    try {
      const barcodeHtml = `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
                width: 130px;
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
                const codeValue = p.barcode || (p.id ? p.id.slice(-8).toUpperCase() : 'CODE');
                return `
                <div class="barcode-card">
                  <div style="font-size: 11px; font-weight: 700; margin-bottom: 2px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; width: 100%;">
                    ${p.name || 'Product'}
                  </div>
                  <div style="font-size: 9px; color: #64748b; margin-bottom: 6px;">
                    LN: ${(p.id || '').slice(-6).toUpperCase()}
                  </div>

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

      await this.executePrint(barcodeHtml, 'Inventory_Auto_Barcodes');
    } catch (e) {
      console.error('Barcode listing print failed:', e);
    }
  }

  static async printSalesSummary(shopInfo: any, sales: any[], currency: string): Promise<void> {
    try {
      const summaryHtml = `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
              <h2 style="margin: 0;">${shopInfo.name || 'My Shop'}</h2>
              ${shopInfo.companyName ? `<div style="font-size: 12px; font-style: italic;">${shopInfo.companyName}</div>` : ''}
              ${shopInfo.location || shopInfo.address ? `<div style="font-size: 12px;">Location: ${shopInfo.location || shopInfo.address}</div>` : ''}
              ${shopInfo.phone ? `<div style="font-size: 11px;">Tel: ${shopInfo.phone}</div>` : ''}
              ${shopInfo.email ? `<div style="font-size: 11px;">Email: ${shopInfo.email}</div>` : ''}
              ${shopInfo.workingHours ? `<div style="font-size: 11px;">Hours: ${shopInfo.workingHours}</div>` : ''}
              <h3 style="margin: 10px 0 0 0;">BATCH SALES REPORT</h3>
            </div>

            ${sales.map(s => {
              const saleId = (s.id || '').slice(-8).toUpperCase();
              const timestampStr = s.timestamp ? new Date(Number(s.timestamp)).toLocaleDateString() : '';
              const totalAmount = Number(s.totalAmount || 0);
              const items = Array.isArray(s.items) ? s.items : [];

              return `
              <div class="sale-box">
                <div class="sale-header">
                  <span>#${saleId} ${s.isReverted ? '(REVERTED)' : ''}</span>
                  <span>${timestampStr}</span>
                </div>
                <div style="font-size: 11px; margin-bottom: 5px;">
                  Staff: ${s.staffName || 'Staff'} | Payment: ${s.paymentMethod || 'CASH'}
                </div>

                ${items.length > 0 ? items.map((i: any) => {
                  const pName = i.productName || i.productname || 'Item';
                  const qty = Number(i.quantity || 0);
                  const price = Number(i.priceAtSale || i.priceatsale || 0);
                  return `
                  <div class="item-row">
                    <span>${pName} (${qty} x ${currency}${price.toFixed(2)})</span>
                    <span style="font-weight: bold;">${currency}${(qty * price).toFixed(2)}</span>
                  </div>
                  `;
                }).join('') : '<div style="font-size:11px; color:#888;">No item details available</div>'}

                <div class="total-row">
                  <span>TOTAL</span>
                  <span>${currency}${totalAmount.toFixed(2)}</span>
                </div>
              </div>
              `;
            }).join('')}

            <div class="footer">
              Printed on ${new Date().toLocaleString()} | My Shop Management System
            </div>
          </body>
        </html>
      `;

      await this.executePrint(summaryHtml, 'Sales_Batch_Report');
    } catch (e) {
      console.error('Batch sales print failed:', e);
    }
  }
}
