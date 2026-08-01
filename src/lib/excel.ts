import * as XLSX from 'xlsx';
import { Product, Order, BulkUploadRow } from '../types';

/**
 * Download a sample Excel template for bulk product upload
 */
export function downloadSampleExcelTemplate() {
  const sampleData: Omit<BulkUploadRow, 'sno'>[] = [
    {
      productName: "2026 Desk Spiral Calendar",
      imageFilename: "calendar1.jpg",
      enabled: "TRUE",
      description: "12-month desk calendar with spiral binding",
      category: "Desk Calendar"
    },
    {
      productName: "Executive Wall Calendar 2026",
      imageFilename: "wall-cal.png",
      enabled: "TRUE",
      description: "Large 12-sheet wall hanging calendar",
      category: "Wall Calendar"
    },
    {
      productName: "Eco Wooden Stand Tabletop Calendar",
      imageFilename: "wooden.jpg",
      enabled: "TRUE",
      description: "Solid wood block calendar with monthly cards",
      category: "Premium Calendar"
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 35 }, // productName
    { wch: 20 }, // imageFilename
    { wch: 10 }, // enabled
    { wch: 45 }, // description
    { wch: 20 }  // category
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products_Template');
  
  XLSX.writeFile(workbook, 'Calendar_Products_Bulk_Template.xlsx');
}

/**
 * Parse uploaded Excel or CSV file into product objects
 */
export async function parseExcelOrCsvFile(file: File): Promise<BulkUploadRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawJson = XLSX.utils.sheet_to_json<any>(worksheet);

        const parsedRows: BulkUploadRow[] = rawJson.map((row, index) => {
          // Normalize column keys (case insensitive / space variations)
          const keys = Object.keys(row);
          const getKey = (term: string) => keys.find(k => k.toLowerCase().trim().replace(/[^a-z0-9]/g, '') === term.toLowerCase().replace(/[^a-z0-9]/g, ''));

          const nameKey = getKey('productName') || getKey('product') || getKey('name') || getKey('title');
          const imageFileKey = getKey('imageFilename') || getKey('imageName') || getKey('imageFile') || getKey('image');
          const enabledKey = getKey('enabled') || getKey('status') || getKey('active');
          const descKey = getKey('description') || getKey('desc') || getKey('details');
          const catKey = getKey('category') || getKey('type');
          const snoKey = getKey('sno') || getKey('srno') || getKey('slno');

          return {
            sno: row[snoKey || ''] ? Number(row[snoKey || '']) : index + 1,
            productName: row[nameKey || ''] ? String(row[nameKey || '']).trim() : `Product ${index + 1}`,
            imageFilename: row[imageFileKey || ''] ? String(row[imageFileKey || '']).trim() : undefined,
            enabled: row[enabledKey || ''] !== undefined ? String(row[enabledKey || '']).toLowerCase() !== 'false' && String(row[enabledKey || '']).toLowerCase() !== '0' && String(row[enabledKey || '']).toLowerCase() !== 'disabled' : true,
            description: row[descKey || ''] ? String(row[descKey || '']).trim() : '',
            category: row[catKey || ''] ? String(row[catKey || '']).trim() : 'Calendar',
            // Default placeholder image for newly imported products
            imageUrl: '/placeholder-image.png'
          };
        });

        resolve(parsedRows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export orders to Excel workbook file
 */
export function exportOrdersToExcel(orders: Order[]) {
  const exportRows = orders.flatMap(order => {
    return order.items.map(item => ({
      'Order Number': order.orderNumber,
      'Date': new Date(order.createdAt).toLocaleString(),
      'Customer Name': order.customerName,
      'Mobile Number': order.mobileNumber,
      'City / Place': order.city,
      'Status': order.status,
      'Product Name': item.productName,
      'Quantity': item.qty,
      'Unit Price': item.unitPrice ? item.unitPrice : '-',
      'Item Subtotal': item.unitPrice ? item.unitPrice * item.qty : '-',
      'Order Total Qty': order.totalQty,
      'Order Total Price': order.totalPrice ? order.totalPrice : '-',
      'Notes': order.notes || ''
    }));
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 16 }, // Order Number
    { wch: 20 }, // Date
    { wch: 22 }, // Customer Name
    { wch: 15 }, // Mobile Number
    { wch: 18 }, // City
    { wch: 12 }, // Status
    { wch: 35 }, // Product Name
    { wch: 10 }, // Quantity
    { wch: 12 }, // Unit Price
    { wch: 14 }, // Item Subtotal
    { wch: 16 }, // Order Total Qty
    { wch: 16 }, // Order Total Price
    { wch: 25 }  // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders_Report');

  XLSX.writeFile(workbook, `Calendar_Orders_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
