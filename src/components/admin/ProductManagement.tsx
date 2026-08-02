import React, { useState } from 'react';
import {
  Plus, Search, ArrowUp, ArrowDown, Edit3, Trash2,
  CheckCircle2, XCircle, Image as ImageIcon, Upload, Loader2,
  ChevronLeft, ChevronRight, AlertTriangle, ToggleLeft, ToggleRight, X
} from 'lucide-react';
import { Product, Category } from '../../types';

interface ProductManagementProps {
  products: Product[];
  categories: Category[];
  onRefresh: (updatedProducts?: Product[]) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  categories,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    imageUrl: '',
    category: categories.length > 0 ? categories[0].name : '',
    description: '',
    enabled: true,
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Bulk Selection
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Filter products by search query
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination logic
  const totalItems = filteredProducts.length;
  const totalPages = itemsPerPage === 0 ? 1 : Math.ceil(totalItems / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);

  const displayedProducts = itemsPerPage === 0
    ? filteredProducts
    : filteredProducts.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedProductIds.length === displayedProducts.length && displayedProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(displayedProducts.map(p => p.id));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      imageUrl: '',
      category: categories.length > 0 ? categories[0].name : '',
      description: '',
      enabled: true,
    });
    setImagePreview('');
    setFormError('');
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price ? String(product.price) : '',
      imageUrl: product.imageUrl,
      category: product.category || 'Calendar',
      description: product.description || '',
      enabled: product.enabled,
    });
    setImagePreview(product.imageUrl);
    setFormError('');
  };

  // Handle Image File Upload (Convert to Base64)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image size exceeds 5MB limit. Please select a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData((prev) => ({ ...prev, imageUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle product enable status
  const handleToggleEnable = async (id: string) => {
    try {
      const res = await fetch(`/api/products/toggle/${id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to toggle product status:', err);
    }
  };

  // Move Product Up/Down (Rearrange order)
  const handleMoveProduct = async (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return;

    const reordered = [...products];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const productIds = reordered.map((p) => p.id);

    try {
      const res = await fetch('/api/products/rearrange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds }),
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to rearrange products:', err);
    }
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Product Name is required.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      price: formData.price ? Number(formData.price) : 0,
      imageUrl: formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=300&q=80',
      category: formData.category,
      description: formData.description.trim(),
      enabled: formData.enabled,
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setEditingProduct(null);
        resetForm();
        onRefresh();
      } else {
        setFormError(data.message || 'Operation failed.');
      }
    } catch (err: any) {
      setFormError('Failed to communicate with server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    try {
      let res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        res = await fetch(`/api/products/delete/${id}`, { method: 'POST' });
      }
      const data = await res.json();
      if (data.success) {
        setDeletingProductId(null);
        onRefresh(data.products);
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;

    try {
      let res = await fetch('/api/products/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProductIds })
      });
      
      // Fallback to POST if DELETE returns non-ok (e.g. proxy issues)
      if (!res.ok) {
        res = await fetch('/api/products/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedProductIds })
        });
      }

      const data = await res.json();
      if (data.success) {
        setSelectedProductIds([]);
        onRefresh(data.products);
      }
    } catch (err) {
      console.error('Failed to bulk delete products:', err);
    }
  };

  return (
    <div id="product-management-module" className="space-y-6">
      
      {/* Action Header Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="admin-product-search"
            type="text"
            placeholder="Search products by name or category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-3 justify-between sm:justify-end">
          
          {/* Per Page Select */}
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
            <span>Per Page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={0}>All</option>
            </select>
          </div>

          {/* Bulk Delete Button */}
          {selectedProductIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete ({selectedProductIds.length})</span>
            </button>
          )}

          {/* Add Product Button */}
          <button
            id="btn-add-product-modal"
            onClick={openAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="admin-products-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3.5 px-3 text-center w-10">
                  <input 
                    type="checkbox" 
                    checked={displayedProducts.length > 0 && selectedProductIds.length === displayedProducts.length}
                    onChange={toggleAllSelection}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3 text-center w-16">S.No</th>
                <th className="py-3.5 px-3 text-center w-24">Image</th>
                <th className="py-3.5 px-4 min-w-[200px]">Product Details</th>
                <th className="py-3.5 px-3 text-center w-28">Status</th>
                <th className="py-3.5 px-3 text-center w-28">Sequence</th>
                <th className="py-3.5 px-4 text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                displayedProducts.map((product) => {
                  const actualIndex = products.findIndex((p) => p.id === product.id);
                  const isSelected = selectedProductIds.includes(product.id);

                  return (
                    <tr key={product.id} className={`transition-colors ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'}`}>
                      {/* Selection Checkbox */}
                      <td className="py-3 px-3 text-center align-middle">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(product.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* S.No */}
                      <td className="py-3 px-3 text-center font-bold text-slate-600 text-xs">
                        #{product.sno}
                      </td>

                      {/* Image Thumbnail */}
                      <td className="py-3 px-3 text-center align-middle">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-14 h-14 object-contain rounded-xl border border-slate-200 mx-auto bg-slate-50 shadow-2xs"
                        />
                      </td>

                      {/* Name & Details */}
                      <td className="py-3 px-4 align-middle">
                        <div className="font-bold text-slate-900 text-sm leading-snug">
                          {product.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {product.category && (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                              {product.category}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-3 text-center align-middle">
                        <button
                          onClick={() => handleToggleEnable(product.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                            product.enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {product.enabled ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-slate-400" />
                              <span>Disabled</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Rearrange Sequence */}
                      <td className="py-3 px-3 text-center align-middle">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => handleMoveProduct(actualIndex, 'up')}
                            disabled={actualIndex === 0}
                            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg disabled:opacity-25 transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveProduct(actualIndex, 'down')}
                            disabled={actualIndex === products.length - 1}
                            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg disabled:opacity-25 transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center align-middle">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProductId(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {itemsPerPage > 0 && totalPages > 1 && (
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing Page <strong>{safePage}</strong> of <strong>{totalPages}</strong> ({totalItems} total products)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage <= 1}
                className="p-1.5 border border-slate-300 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage >= totalPages}
                className="p-1.5 border border-slate-300 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-[#0C8D99]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0C8D99] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-base">
                {editingProduct ? 'Edit Calendar Product' : 'Add New Calendar Product'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Executive Desk Spiral Calendar"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Category & Price Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {categories.length === 0 && <option value="">No Categories</option>}
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 150"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Product Image Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Product Image</span>
                  <span className="text-[11px] text-slate-500">Upload File</span>
                </label>

                <div className="space-y-3">
                  {/* File Upload Trigger */}
                  <div className="flex items-center space-x-3">
                    <label className="flex-1 cursor-pointer bg-slate-50 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-3 flex items-center justify-center space-x-2 text-xs font-medium text-slate-600 transition-colors">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      <span>Choose Image File...</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Image Preview Box */}
                  {imagePreview && (
                    <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 flex items-center space-x-3">
                      <img src={imagePreview} alt="Preview" className="w-16 h-16 object-contain bg-slate-50 rounded-lg border border-slate-200" />
                      <div className="text-xs text-slate-600">
                        <span className="font-bold text-slate-800 block">Thumbnail Preview</span>
                        <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready for product
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description of the calendar product..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              {/* Enabled Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
                <span>Product Status (Enable in Customer View):</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData((prev) => ({ ...prev, enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingProduct ? 'Update Product' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 bg-[#0C8D99]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm text-center space-y-4 my-auto">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete Product?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this product? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deletingProductId)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
