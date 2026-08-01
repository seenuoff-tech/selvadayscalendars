import React from 'react';
import { Search, ShoppingBag, X } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalQty: number;
  uniqueCount: number;
  onProceedOrder: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  totalQty,
  uniqueCount,
  onProceedOrder,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-30 bg-[#0C8D99] text-white shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-5">
        <div className="flex flex-col items-center gap-5">
          
          {/* Brand Logo (Centered) */}
          <div className="flex flex-col items-center justify-center text-center w-full">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:space-x-3 mb-2">
              <img src="/sspic-logo.png" alt="SSP Logo" className="h-16 w-auto object-contain drop-shadow-md" />
            </div>
          </div>

          {/* Search Bar & Actions */}
          <div className="relative flex items-center justify-center w-full mt-2">
            
            {/* Centered Search Bar */}
            <div className="relative w-full max-w-4xl">
              <input
                id="product-search-input"
                type="text"
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-900 text-base pl-6 pr-20 py-3.5 rounded-full border border-white focus:outline-none focus:ring-2 focus:ring-[#086169] focus:border-transparent placeholder-slate-400 shadow-sm"
              />
              <Search className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-500" />
              {searchQuery && (
                <button
                  id="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Desktop Cart Summary Pill (Right Corner) */}
            {totalQty > 0 && (
              <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2">
                <button
                  id="btn-header-cart"
                  onClick={onProceedOrder}
                  className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-[#0C8D99] text-base font-semibold px-5 py-3 rounded-xl shadow-sm transition-all"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{totalQty} Items ({uniqueCount} Products)</span>
                </button>
              </div>
            )}
            
          </div>

        </div>
      </div>
    </header>
  );
};
