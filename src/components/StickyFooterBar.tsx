import React from 'react';
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';

interface StickyFooterBarProps {
  totalQty: number;
  totalProductsCount: number;
  totalEstimatedPrice?: number;
  onClearAll: () => void;
  onProceedOrder: () => void;
}

export const StickyFooterBar: React.FC<StickyFooterBarProps> = ({
  totalQty,
  totalProductsCount,
  totalEstimatedPrice,
  onClearAll,
  onProceedOrder,
}) => {
  return (
    <div id="sticky-footer-bar" className="fixed bottom-0 left-0 right-0 z-40 bg-[#0C8D99]/95 backdrop-blur-md text-white border-t border-[#0a7983] shadow-xl py-3 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-3">
        
        {/* Quantity Summary */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-white flex items-center justify-center text-[#0C8D99] shadow-sm">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xs text-white/80 uppercase tracking-wider font-semibold">Total Quantity:</span>
              <span id="total-qty-counter" className="text-lg sm:text-xl font-extrabold text-white">
                {totalQty} <span className="text-xs font-normal text-white/90">Unit{totalQty !== 1 ? 's' : ''}</span>
              </span>
            </div>
            <div className="text-xs text-white/80 flex items-center gap-2">
              <span>{totalProductsCount} Product{totalProductsCount !== 1 ? 's' : ''} Selected</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {totalQty > 0 && (
            <button
              id="btn-clear-cart"
              onClick={onClearAll}
              className="p-2.5 bg-white text-[#0C8D99] hover:bg-slate-100 hover:text-red-500 rounded-xl shadow-sm transition-colors text-xs font-bold flex items-center gap-1"
              title="Reset Quantities"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            id="btn-submit-order-trigger"
            onClick={onProceedOrder}
            disabled={totalQty === 0}
            className="bg-white hover:bg-slate-50 text-[#0C8D99] font-extrabold text-sm sm:text-base px-5 py-2.5 sm:px-7 sm:py-3 rounded-xl shadow-lg shadow-black/10 flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-95"
          >
            <span>Proceed to Order</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
