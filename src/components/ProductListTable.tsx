import React from 'react';
import { Minus, Plus, SearchX, ImageOff, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface ProductListTableProps {
  products: Product[];
  quantities: Record<string, number>;
  onQtyChange: (productId: string, newQty: number) => void;
  searchQuery: string;
}

export const ProductListTable: React.FC<ProductListTableProps> = ({
  products,
  quantities,
  onQtyChange,
  searchQuery,
}) => {
  // Image error state fallback tracker
  const [failedImages, setFailedImages] = React.useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  const activeProducts = products.filter((p) => p.enabled);

  if (activeProducts.length === 0) {
    return (
      <div id="empty-products-container" className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 my-6 shadow-sm">
        <SearchX className="w-12 h-12 text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-800">No products available</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          {searchQuery
            ? `No products found matching "${searchQuery}". Try clearing your search.`
            : 'Product catalog is currently empty or pending admin configuration.'}
        </p>
      </div>
    );
  }

  return (
    <div id="product-list-wrapper" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden my-4">
      {/* Table header info bar */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-600 font-medium">
        <span>Showing {activeProducts.length} Product{activeProducts.length !== 1 ? 's' : ''}</span>
        <span className="text-slate-500 hidden sm:inline">Enter quantities or use + / - buttons to build order</span>
      </div>

      <div className="overflow-x-auto">
        <table id="products-table" className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <th className="py-3 px-3 text-center w-12 sm:w-16">S.No</th>
              <th className="py-3 px-3 w-24 text-center">Image</th>
              <th className="py-3 px-4 min-w-[180px]">Product Name</th>
              <th className="py-3 px-4 text-center w-36 sm:w-44">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {activeProducts.map((product) => {
              const currentQty = quantities[product.id] || 0;
              const isSelected = currentQty > 0;
              const isImgFailed = failedImages[product.id];

              return (
                <tr
                  key={product.id}
                  id={`product-row-${product.id}`}
                  className={`transition-colors hover:bg-slate-50/80 ${
                    isSelected ? 'bg-[#0C8D99]/10' : ''
                  }`}
                >
                  {/* Column 1: S.No */}
                  <td className="py-3.5 px-3 text-center text-slate-600 font-medium text-xs sm:text-sm">
                    {product.sno}
                  </td>

                  {/* Column 2: Product Image (80x80 thumbnail) */}
                  <td className="py-3.5 px-3 text-center align-middle">
                    <div className="w-[80px] h-[80px] min-w-[80px] min-h-[80px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 mx-auto relative flex items-center justify-center shadow-2xs">
                      {!isImgFailed ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          onError={() => handleImageError(product.id)}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-1">
                          <ImageOff className="w-5 h-5 mb-0.5" />
                          <span className="text-[9px] leading-none">No image</span>
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-[#0C8D99] text-white p-0.5 rounded-full shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Column 3: Product Name */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 text-sm sm:text-base leading-snug">
                        {product.name}
                      </span>
                      {product.category && (
                        <span className="inline-flex text-[11px] font-medium text-slate-500 mt-0.5">
                          {product.category}
                        </span>
                      )}
                      {product.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-md hidden sm:block">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Column 4: Qty (Number Input) */}
                  <td className="py-3.5 px-4 align-middle text-center">
                    <div className="inline-flex items-center justify-center bg-slate-100 rounded-xl border border-slate-300 p-1 shadow-2xs">
                      {/* Decrement Button */}
                      <button
                        id={`btn-qty-minus-${product.id}`}
                        type="button"
                        onClick={() => onQtyChange(product.id, Math.max(0, currentQty - 1))}
                        disabled={currentQty <= 0}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-white text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white active:scale-95 transition-all text-sm font-bold shadow-2xs"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      {/* Number Input (Only positive numbers / 0) */}
                      <input
                        id={`input-qty-${product.id}`}
                        type="number"
                        min="0"
                        step="1"
                        value={currentQty === 0 ? '' : currentQty}
                        placeholder="0"
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (isNaN(val) || val < 0) {
                            onQtyChange(product.id, 0);
                          } else {
                            onQtyChange(product.id, val);
                          }
                        }}
                        className="w-12 sm:w-16 text-center text-slate-900 font-bold text-sm sm:text-base bg-transparent focus:outline-none focus:ring-1 focus:ring-[#0C8D99] rounded py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      {/* Increment Button */}
                      <button
                        id={`btn-qty-plus-${product.id}`}
                        type="button"
                        onClick={() => onQtyChange(product.id, currentQty + 1)}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-[#0C8D99] hover:bg-[#0a7983] text-white active:scale-95 transition-all text-sm font-bold shadow-2xs"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
