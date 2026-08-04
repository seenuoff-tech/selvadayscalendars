import React, { useState } from 'react';
import { X, FileText, Download, CheckCircle, Calculator } from 'lucide-react';
import { Order, OrderItem } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceGeneratorModalProps {
  order: Order;
  onClose: () => void;
}

export const InvoiceGeneratorModal: React.FC<InvoiceGeneratorModalProps> = ({ order, onClose }) => {
  const [gstNumber, setGstNumber] = useState('');
  const [gstPercentage, setGstPercentage] = useState<number>(18);
  const [prices, setPrices] = useState<Record<string, number>>({});

  const handlePriceChange = (productId: string, value: string) => {
    const numValue = parseFloat(value);
    setPrices(prev => ({
      ...prev,
      [productId]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const calculateSubtotal = () => {
    return order.items.reduce((sum, item) => {
      const price = prices[item.productId] || 0;
      return sum + (price * item.qty);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const gstAmount = (subtotal * gstPercentage) / 100;
  const grandTotal = subtotal + gstAmount;

  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const img = new window.Image();
    img.src = '/sspic-logo.png';
    
    img.onload = () => {
      buildAndSavePDF(doc, img);
    };
    img.onerror = () => {
      // If logo fails to load, still generate PDF without it
      buildAndSavePDF(doc, null);
    };
  };

  const buildAndSavePDF = (doc: jsPDF, logoImg: HTMLImageElement | null) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    
    // --- COLORS ---
    const primaryColor: [number, number, number] = [15, 139, 157]; // #0F8B9D
    const secondaryColor: [number, number, number] = [15, 23, 42]; // #0F172A (very dark)
    const grayColor: [number, number, number] = [51, 65, 85]; // #334155 (darker gray for better readability)
    const lightGray: [number, number, number] = [243, 244, 246]; // #F3F4F6
    const accentColor: [number, number, number] = [248, 250, 252]; // #F8FAFC

    // --- HELPER FUNCTIONS ---
    const setFont = (type: "normal" | "bold" | "italic", size: number, color: [number, number, number]) => {
      doc.setFont("times", type);
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
    };

    let currentY = margin;

    // ==========================================
    // HEADER
    // ==========================================
    
    // Left: Logo
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', margin, currentY + 4, 30, 18); // Reduced logo size further
    }
    
    // Right: INVOICE Title and Details
    setFont("bold", 28, primaryColor);
    doc.text('INVOICE', pageWidth - margin, currentY + 10, { align: 'right' });
    
    setFont("bold", 12, grayColor);
    doc.text(`Invoice No: ${order.orderNumber}`, pageWidth - margin, currentY + 17, { align: 'right' });
    doc.text(`Date & Time: ${new Date(order.createdAt).toLocaleString()}`, pageWidth - margin, currentY + 23, { align: 'right' });
    
    currentY += 32;

    // Divider
    doc.setDrawColor(229, 231, 235); // #E5E7EB
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    
    currentY += 8;

    // ==========================================
    // CUSTOMER SECTION (Two Cards)
    // ==========================================
    const cardWidth = 85; // Fixed width for both cards
    const leftCardX = margin;
    const rightCardX = pageWidth - margin - cardWidth; // Pushed fully to the right edge
    const cardHeight = 42;

    // Left Card: Invoice Details
    setFont("bold", 13, secondaryColor); // Increased font size and ensuring bold
    doc.text('Invoice Details', leftCardX + 5, currentY + 8);
    
    setFont("bold", 9, secondaryColor);
    doc.text('Order No:', leftCardX + 5, currentY + 15);
    doc.text('Date & Time:', leftCardX + 5, currentY + 21);
    doc.text('Payment Mode:', leftCardX + 5, currentY + 27);
    doc.text('Order Status:', leftCardX + 5, currentY + 33);
    if(gstNumber) doc.text('GST No:', leftCardX + 5, currentY + 39);

    setFont("bold", 9, grayColor);
    doc.text(order.orderNumber, leftCardX + 35, currentY + 15);
    doc.text(new Date(order.createdAt).toLocaleString(), leftCardX + 35, currentY + 21);
    doc.text('Online / Cash', leftCardX + 35, currentY + 27);
    doc.text(order.status, leftCardX + 35, currentY + 33);
    if(gstNumber) doc.text(gstNumber, leftCardX + 35, currentY + 39);

    // Right Card: Bill To
    setFont("bold", 13, secondaryColor); // Increased font size and ensuring bold
    doc.text('Bill To', rightCardX + 5, currentY + 8);
    
    setFont("bold", 10, secondaryColor);
    doc.text(order.customerName, rightCardX + 5, currentY + 15);
    
    setFont("bold", 9, grayColor);
    doc.text(`Phone: ${order.mobileNumber}`, rightCardX + 5, currentY + 21);
    doc.text(`City: ${order.city}`, rightCardX + 5, currentY + 27);

    currentY += cardHeight + 10;

    // ==========================================
    // PRODUCT TABLE
    // ==========================================
    const tableColumn = ["S.NO", "Product Name", "Qty", "Unit Price", "GST %", "Amount"];
    const tableRows = order.items.map((item, index) => {
      const price = prices[item.productId] || 0;
      const total = price * item.qty;
      return [
        (index + 1).toString(),
        item.productName,
        item.qty.toString(),
        price.toFixed(2),
        `${gstPercentage}%`,
        total.toFixed(2)
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: secondaryColor,
        valign: 'middle',
        fontStyle: 'bold' // Makes table body text thicker
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 18 }, // S.NO (widened further to prevent wrapping)
        1: { halign: 'left' },                  // Product Name
        2: { halign: 'center', cellWidth: 15 }, // Qty
        3: { halign: 'right', cellWidth: 25 },  // Unit Price
        4: { halign: 'center', cellWidth: 20 }, // GST %
        5: { halign: 'right', cellWidth: 30 },  // Amount
      },
      styles: {
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
        cellPadding: 4
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // ==========================================
    // TOTALS SECTION
    // ==========================================
    const summaryBoxWidth = 80;
    const summaryBoxX = pageWidth - margin - summaryBoxWidth;
    
    const addSummaryRow = (label: string, value: string, yOff: number, isBold: boolean = false, isGrand: boolean = false) => {
      if (isGrand) {
        setFont("bold", 14, primaryColor);
      } else if (isBold) {
        setFont("bold", 10, secondaryColor);
      } else {
        setFont("normal", 10, grayColor);
      }
      doc.text(label, summaryBoxX, currentY + yOff);
      doc.text(`Rs ${value}`, pageWidth - margin, currentY + yOff, { align: 'right' });
    };

    addSummaryRow("Subtotal:", subtotal.toFixed(2), 0);
    addSummaryRow(`GST (${gstPercentage}%):`, gstAmount.toFixed(2), 6);
    
    // Draw line above grand total
    doc.setDrawColor(229, 231, 235);
    doc.line(summaryBoxX, currentY + 12, pageWidth - margin, currentY + 12);
    
    addSummaryRow("Grand Total:", grandTotal.toFixed(2), 20, true, true);

    // ==========================================
    // FOOTER
    // ==========================================
    const footerY = pageHeight - 35; // Position at bottom
    
    // Thank you message centered ABOVE the line
    setFont("bold", 14, primaryColor);
    doc.text("Thank you for your business.", pageWidth / 2, footerY - 10, { align: 'center' });

    // Line separator for footer
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    // Center/Bottom: Company Details
    setFont("bold", 22, secondaryColor); // Much bigger font for shop name
    doc.text("selvascreen", pageWidth / 2, footerY + 8, { align: 'center' });
    
    setFont("bold", 10, grayColor);
    doc.text("8, AVT Paadasalai Street, Anil Complex, Sivakasi-626 123. India", pageWidth / 2, footerY + 15, { align: 'center' });
    doc.text("Phone: +91 9843425703, +91 7010482345 | Email: selvascreenuv@gmail.com", pageWidth / 2, footerY + 20, { align: 'center' });

    doc.save(`${order.orderNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Generate Invoice</h2>
              <p className="text-xs text-slate-500">Order {order.orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Configuration */}
            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-slate-400" />
                  Invoice Settings
                </h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="Enter GST Number"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GST Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(Number(e.target.value))}
                    min="0"
                    max="100"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-indigo-600 p-5 rounded-xl border border-indigo-500 shadow-sm text-white">
                <h3 className="font-bold text-indigo-100 text-sm mb-4">Invoice Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-indigo-200">Subtotal</span>
                    <span className="font-semibold">Rs {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-200">GST ({gstPercentage}%)</span>
                    <span className="font-semibold">Rs {gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-indigo-400 flex justify-between text-lg font-bold">
                    <span>Grand Total</span>
                    <span>Rs {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right: Products Pricing */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Enter Product Prices</h3>
              
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="pb-2 font-semibold">Product</th>
                      <th className="pb-2 font-semibold text-center">Qty</th>
                      <th className="pb-2 font-semibold w-24">Unit Price</th>
                      <th className="pb-2 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items.map((item, idx) => {
                      const price = prices[item.productId] || 0;
                      return (
                        <tr key={idx} className="text-sm">
                          <td className="py-3 font-medium text-slate-700">
                            {item.productName}
                          </td>
                          <td className="py-3 text-center text-slate-600">
                            {item.qty}
                          </td>
                          <td className="py-3">
                            <input
                              type="number"
                              min="0"
                              placeholder="0.00"
                              value={prices[item.productId] || ''}
                              onChange={(e) => handlePriceChange(item.productId, e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </td>
                          <td className="py-3 text-right font-bold text-slate-800">
                            Rs {(price * item.qty).toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-2xl sticky bottom-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generatePDF}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Generate & Download PDF
          </button>
        </div>

      </div>
    </div>
  );
};
