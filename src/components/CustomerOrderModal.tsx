import React, { useState } from 'react';
import { X, Send, User, Phone, MapPin, FileText, ShoppingBag, AlertCircle, Loader2 } from 'lucide-react';
import { Product, OrderItem } from '../types';

interface CustomerOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  quantities: Record<string, number>;
  onSubmitOrder: (customerData: { customerName: string; mobileNumber: string; city: string; notes?: string }) => Promise<void>;
  isSubmitting: boolean;
}

export const CustomerOrderModal: React.FC<CustomerOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  quantities,
  onSubmitOrder,
  isSubmitting,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Selected products with qty > 0
  const selectedItems: (OrderItem & { imageUrl?: string; price?: number })[] = products
    .filter((p) => (quantities[p.id] || 0) > 0)
    .map((p) => ({
      productId: p.id,
      sno: p.sno,
      productName: p.name,
      qty: quantities[p.id],
      unitPrice: p.price,
      imageUrl: p.imageUrl,
    }));

  const totalQty = selectedItems.reduce((acc, item) => acc + item.qty, 0);
  const totalPrice = selectedItems.reduce((acc, item) => acc + (item.qty * (item.unitPrice || 0)), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please enter your Customer Name.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.trim().length < 8) {
      setErrorMessage('Please enter a valid Mobile Number (at least 8 digits).');
      return;
    }
    if (!city.trim()) {
      setErrorMessage('Please enter your Place / City.');
      return;
    }

    try {
      await onSubmitOrder({
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        city: city.trim(),
        notes: notes.trim(),
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit order. Please try again.');
    }
  };

  return (
    <div id="customer-order-modal-backdrop" className="fixed inset-0 z-50 bg-[#0C8D99]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Modal Header */}
        <div className="bg-[#0C8D99] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0C8D99]/20 border border-[#0C8D99]/40 flex items-center justify-center text-[#3eb1be]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Customer Order Form</h2>
              <p className="text-xs text-slate-400">Complete details to confirm your order</p>
            </div>
          </div>
          <button
            id="btn-close-order-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            
            {/* Customer Name */}
            <div>
              <label htmlFor="customer-name-input" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                id="customer-name-input"
                type="text"
                required
                placeholder="e.g. Customer Name / Company Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#0C8D99] focus:border-transparent text-sm text-slate-900 rounded-xl px-3.5 py-2.5 outline-none transition-all"
              />
            </div>

            {/* Mobile Number & City Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mobile Number */}
              <div>
                <label htmlFor="mobile-number-input" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="mobile-number-input"
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#0C8D99] focus:border-transparent text-sm text-slate-900 rounded-xl px-3.5 py-2.5 outline-none transition-all"
                />
              </div>

              {/* City / Place */}
              <div>
                <label htmlFor="city-input" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Place / City <span className="text-red-500">*</span>
                </label>
                <input
                  id="city-input"
                  type="text"
                  required
                  placeholder="e.g. Mumbai / New Delhi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#0C8D99] focus:border-transparent text-sm text-slate-900 rounded-xl px-3.5 py-2.5 outline-none transition-all"
                />
              </div>
            </div>

            {/* Notes / Special Instructions (Optional) */}
            <div>
              <label htmlFor="order-notes-input" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Notes / Special Instructions (Optional)
              </label>
              <textarea
                id="order-notes-input"
                rows={2}
                placeholder="e.g. Delivery preference, packaging instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#0C8D99] focus:border-transparent text-sm text-slate-900 rounded-xl px-3.5 py-2 outline-none transition-all resize-none"
              />
            </div>

          </div>

          {/* Selected Products Order Summary Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Selected Products Summary ({selectedItems.length})
            </h3>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 p-2 space-y-2">
              {selectedItems.map((item) => (
                <div key={item.productId} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center space-x-2.5">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-10 h-10 rounded-md object-cover border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                        #{item.sno}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-slate-800 line-clamp-1">{item.productName}</span>
                    </div>
                  </div>
                  <div className="text-right pl-2">
                    <span className="font-bold text-[#0C8D99] text-sm bg-[#0C8D99]/10 px-2 py-1 rounded-md border border-[#0C8D99]/20">
                      Qty: {item.qty}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Footer inside summary */}
            <div className="mt-3 bg-[#0C8D99] text-white p-3 rounded-xl flex items-center justify-between text-xs font-semibold">
              <span>Total Selected Quantity:</span>
              <span className="text-sm font-extrabold text-[#3eb1be]">{totalQty} Units</span>
            </div>
          </div>

          {/* Form Submit Button */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              id="btn-cancel-order"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-submit-order"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#0C8D99] hover:bg-[#0a7983] text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Order...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Order Now</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
