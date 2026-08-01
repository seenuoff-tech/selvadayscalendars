import React, { useState, useEffect } from 'react';
import { CheckCircle2, Printer, PlusCircle, Calendar, Phone, MapPin, User, Hash, MessageCircle, X } from 'lucide-react';
import { Order } from '../types';
import { openWhatsAppForOrder } from '../utils/whatsapp';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ order, onClose }) => {
  const [adminPhone, setAdminPhone] = useState<string>("9080917850");

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings && data.settings.whatsappNumber) {
          setAdminPhone(data.settings.whatsappNumber);
        }
      })
      .catch(console.error);
  }, []);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    // Check if the number has a country code. If not, default to +91 (India) since the default number is 9080917850
    let phoneToUse = adminPhone;
    if (phoneToUse && phoneToUse.length === 10) {
      phoneToUse = `91${phoneToUse}`;
    }
    openWhatsAppForOrder(order, phoneToUse);
  };

  return (
    <div id="order-success-modal-backdrop" className="fixed inset-0 z-50 bg-[#0C8D99]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto print:shadow-none print:border-none print:max-w-none print:w-full relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Banner */}
        <div className="bg-emerald-600 text-white p-6 text-center print:bg-white print:text-black pt-8">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 print:hidden">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Order Placed Successfully!</h2>
          <p className="text-xs text-emerald-100 mt-1 print:text-slate-600">
            Thank you, {order.customerName}. Your order has been recorded in the system.
          </p>
        </div>

        {/* Order Details Body */}
        <div className="p-6 space-y-4">
          
          {/* Order Info Cards Grid */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-semibold text-slate-800">
              <span className="flex items-center gap-1 text-slate-500">
                <Hash className="w-3.5 h-3.5" /> Order ID:
              </span>
              <span className="text-[#0C8D99] font-bold bg-[#0C8D99]/10 px-2 py-0.5 rounded border border-[#0C8D99]/20">
                {order.orderNumber}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-medium">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium">{order.mobileNumber}</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium">City/Place: {order.city}</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2 text-slate-500 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Date: {new Date(order.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Order Line Items</h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2 px-3">S.No</th>
                    <th className="py-2 px-3">Product Name</th>
                    <th className="py-2 px-3 text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500">{item.sno || idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{item.productName}</td>
                      <td className="py-2 px-3 text-right font-bold text-[#0C8D99]">{item.qty}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#0C8D99] text-white font-bold border-t border-slate-800">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-3">Total Ordered Quantity:</td>
                    <td className="py-2.5 px-3 text-right text-[#3eb1be] text-sm">{order.totalQty} Units</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {order.notes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <span className="font-bold">Customer Notes:</span> {order.notes}
            </div>
          )}

          {/* WhatsApp Notification Banner */}
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-900 print:hidden">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Redirected to WhatsApp with order details.</span>
            </div>
            <button
              onClick={handleSendWhatsApp}
              className="text-emerald-700 hover:text-emerald-900 underline font-bold shrink-0 text-xs"
            >
              Open WhatsApp Again
            </button>
          </div>

          {/* Receipt Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 print:hidden">
            <button
              id="btn-send-whatsapp"
              onClick={handleSendWhatsApp}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Send via WhatsApp</span>
            </button>

            <button
              id="btn-print-receipt"
              onClick={handlePrint}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              id="btn-start-new-order"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#0C8D99] hover:bg-[#0a7983] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Order</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
