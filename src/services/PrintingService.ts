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
}

export class PrintingService {
  static async printReceipt(receipt: Receipt): Promise<void> {
    try {
      const html = this.generateHtml(receipt);
      await RNPrint.print({
        html: html,
        jobName: `Receipt_${receipt.saleId}`,
      });
    } catch (error) {
      console.error('Printing failed:', error);
      throw error;
    }
  }

  private static generateHtml(receipt: Receipt): string {
    const itemsHtml = receipt.items
      .map(
        (item) =>
          `<tr><td>${item.name}</td><td>${item.quantity}</td><td>$${item.price.toFixed(
            2
          )}</td></tr>`
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
              <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <hr/>
          <h3 style='text-align: right;'>Total: $${receipt.total.toFixed(2)}</h3>
          <p>Served by: ${receipt.employeeName}</p>
          <p style='text-align: center; margin-top: 20px;'>Thank you for your business!</p>
        </body>
      </html>
    `;
  }
}
