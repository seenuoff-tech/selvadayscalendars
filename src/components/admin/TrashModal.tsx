import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  isInline?: boolean;
}

export const TrashModal: React.FC<TrashModalProps> = ({ isOpen, onClose, onRefresh, isInline = false }) => {
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTrash = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products/trash');
      const data = await res.json();
      if (data.success && Array.isArray(data.deletedProducts)) {
        setDeletedProducts(data.deletedProducts);
      }
    } catch (err) {
      console.error('Failed to fetch trash products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTrash();
    }
  }, [isOpen]);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      const res = await fetch(`/api/products/trash/restore/${id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDeletedProducts(data.deletedProducts || []);
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to restore product:', err);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/trash/permanent/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeletedProducts(data.deletedProducts || []);
      }
    } catch (err) {
      console.error('Failed to permanently delete product:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all items in Trash?')) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/products/trash/empty', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDeletedProducts([]);
      }
    } catch (err) {
      console.error('Failed to empty trash:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-2xl w-full ${isInline ? '' : 'max-w-3xl my-auto animate-in fade-in zoom-in-95 duration-200'} overflow-hidden`}>
      
      {/* Header */}
      <div className="bg-[#0C8D99] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-300">
            <Trash2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">Product Trash Bin</h3>
            <p className="text-xs text-slate-300">Restore accidentally deleted products or remove permanently</p>
          </div>
        </div>
        {!isInline && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          
          {deletedProducts.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleEmptyTrash}
                disabled={isLoading}
                className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Trash</span>
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#0C8D99]" />
              <span>Loading Trash items...</span>
            </div>
          ) : deletedProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <Trash2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Trash Bin is empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Deleted products will appear here for easy restoration.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-3 text-center">Category</th>
                    <th className="py-3 px-3 text-center">Price</th>
                    <th className="py-3 px-4 text-center w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center space-x-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-slate-50 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{product.name}</span>
                            <span className="text-[10px] text-slate-400">ID: {product.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center align-middle text-slate-600 font-medium">
                        {product.category || 'Calendar'}
                      </td>
                      <td className="py-3 px-3 text-center align-middle font-bold text-slate-800">
                        ₹{product.price || 0}
                      </td>
                      <td className="py-3 px-4 text-center align-middle">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleRestore(product.id)}
                            disabled={restoringId === product.id}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center gap-1 transition-colors"
                            title="Restore Product"
                          >
                            {restoringId === product.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(product.id)}
                            disabled={deletingId === product.id}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Permanently"
                          >
                            {deletingId === product.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!isInline && (
            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          )}

        </div>

      </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0C8D99]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      {content}
    </div>
  );
};
