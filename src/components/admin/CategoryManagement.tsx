import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, AlertTriangle } from 'lucide-react';
import { Category } from '../../types';

interface CategoryManagementProps {
  categories: Category[];
  onRefresh: () => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  onRefresh,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setFormData({ name: '' });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setFormError('');
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.name.trim()) {
      setFormError('Category name is required.');
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');

    try {
      const isEdit = !!editingCategory;
      const url = isEdit ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = isEdit ? 'PUT' : 'POST';

      let res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok && isEdit) {
        res = await fetch(`/api/categories/update/${editingCategory.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      const data = await res.json();
      if (data.success) {
        closeModals();
        onRefresh();
      } else {
        setFormError(data.message || 'Failed to save category');
      }
    } catch (err) {
      console.error('Failed to save category:', err);
      setFormError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      let res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        res = await fetch(`/api/categories/delete/${id}`, { method: 'POST' });
      }
      const data = await res.json();
      if (data.success) {
        setDeletingCategoryId(null);
        onRefresh();
      } else {
        setFormError(data.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  return (
    <div id="category-management-module" className="space-y-6">
      
      {/* Action Header Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Categories</h2>
          <p className="text-xs text-slate-500 mt-1">Manage product categories</p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16 text-center">S.No</th>
                <th className="py-3.5 px-4 min-w-[200px]">Category Name</th>
                <th className="py-3.5 px-4 text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-500 text-xs">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((category, index) => (
                  <tr key={category.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-600 text-xs">
                      #{index + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {category.name}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Category"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCategoryId(category.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {(isAddModalOpen || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModals}></div>
          <form onSubmit={handleSaveCategory} className="relative bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col z-10">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button type="button" onClick={closeModals} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2 border border-red-100">
                  <AlertTriangle className="w-4 h-4" />
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Desk Calendar"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModals}
                className="px-5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {isSubmitting ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategoryId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingCategoryId(null)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Category?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this category? Products in this category will be unassigned.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeletingCategoryId(null)}
                className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCategory(deletingCategoryId)}
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
