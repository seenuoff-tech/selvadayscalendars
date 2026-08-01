import { Order } from '../types';

export function generateWhatsAppUrl(order: Order, recipientPhone?: string): string {
  const itemsText = order.items
    .map((item, idx) => `${idx + 1}. *${item.productName}* - Qty: *${item.qty}*`)
    .join('\n');

  const text = `*NEW CALENDAR ORDER*\n` +
    `----------------------------------\n` +
    `*Order ID:* ${order.orderNumber}\n` +
    `*Customer Name:* ${order.customerName}\n` +
    `*Mobile Number:* ${order.mobileNumber}\n` +
    `*Place / City:* ${order.city}\n` +
    (order.notes ? `*Notes:* ${order.notes}\n` : '') +
    `----------------------------------\n` +
    `*Order Items:*\n${itemsText}\n` +
    `----------------------------------\n` +
    `*Total Quantity:* ${order.totalQty} Units\n\n` +
    `Please confirm my order. Thank you!`;

  const encoded = encodeURIComponent(text);

  if (recipientPhone && recipientPhone.trim().length >= 8) {
    let cleanNum = recipientPhone.replace(/[^0-9]/g, '');
    if (cleanNum.length === 10) {
      cleanNum = `91${cleanNum}`;
    }
    return `https://api.whatsapp.com/send?phone=${cleanNum}&text=${encoded}`;
  }

  return `https://api.whatsapp.com/send?text=${encoded}`;
}

export function openWhatsAppForOrder(order: Order, recipientPhone?: string) {
  const url = generateWhatsAppUrl(order, recipientPhone);
  window.open(url, '_blank');
}
