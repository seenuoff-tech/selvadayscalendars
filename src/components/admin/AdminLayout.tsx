import React, { useState } from 'react';
import {
  LayoutDashboard, Layers, ShoppingBag, FileSpreadsheet, LogOut,
  Store, ShieldCheck, RefreshCw
} from 'lucide-react';
import { Product, Order } from '../../types';
import { AdminDashboard } from './AdminDashboard';
import { ProductManagement } from './ProductManagement';
import { OrderManagement } from './OrderManagement';
import { BulkUploadModal } from './BulkUploadModal';
import { CategoryManagement } from './CategoryManagement';
import { MediaManagement } from './MediaManagement';
import { SettingsPanel } from './SettingsPanel';
import { Image as ImageIcon, Settings as SettingsIcon } from 'lucide-react';

interface AdminLayoutProps {
  products: Product[];
  orders: Order[];
  categories: any[];
  onRefresh: () => void;
  onLogout: () => void;
  onExitToStore: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  products,
  orders,
  categories,
  onRefresh,
  onLogout,
  onExitToStore,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'bulk' | 'media' | 'settings'>('dashboard');

  const navItemClass = (isActive: boolean) => 
    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
      isActive 
        ? 'bg-white/10 text-white font-bold shadow-sm' 
        : 'text-white/70 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <div id="admin-panel-container" className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-800">
      
      {/* Sidebar (WordPress Style) */}
      <aside className="w-full md:w-64 bg-[#0C8D99] text-white flex flex-col shrink-0 md:h-screen md:sticky md:top-0 z-40 shadow-xl">
        
        {/* Brand / Logo Area */}
        <div className="p-4 border-b border-white/10 flex justify-center">
          <div className="w-full flex items-center justify-center">
            <img src="/sspic-logo.png" alt="SelvaScreen Logo" className="h-12 object-contain" />
          </div>
        </div>

        {/* Sidebar Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-3 px-2">Menu</div>
          
          <button onClick={() => setActiveTab('dashboard')} className={navItemClass(activeTab === 'dashboard')}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          <button onClick={() => setActiveTab('products')} className={navItemClass(activeTab === 'products')}>
            <Layers className="w-5 h-5" />
            <span>Products ({products.length})</span>
          </button>

          <button onClick={() => setActiveTab('categories')} className={navItemClass(activeTab === 'categories')}>
            <FileSpreadsheet className="w-5 h-5" />
            <span>Categories ({categories.length})</span>
          </button>

          <button onClick={() => setActiveTab('orders')} className={navItemClass(activeTab === 'orders')}>
            <ShoppingBag className="w-5 h-5" />
            <span>Orders ({orders.length})</span>
          </button>

          <button onClick={() => setActiveTab('media')} className={navItemClass(activeTab === 'media')}>
            <ImageIcon className="w-5 h-5" />
            <span>Media Library</span>
          </button>

          <button onClick={() => setActiveTab('bulk')} className={navItemClass(activeTab === 'bulk')}>
            <FileSpreadsheet className="w-5 h-5" />
            <span>Bulk Excel</span>
          </button>

          <button onClick={() => setActiveTab('settings')} className={navItemClass(activeTab === 'settings')}>
            <SettingsIcon className="w-5 h-5" />
            <span>Settings</span>
          </button>

        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-end px-4 sm:px-6 sticky top-0 z-30 shadow-sm">
          <button
            id="btn-admin-logout"
            onClick={onLogout}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </header>

        {/* Main Admin Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto pb-16">
            {activeTab === 'dashboard' && (
              <AdminDashboard 
                products={products} 
                orders={orders} 
                onNavigateTab={setActiveTab} 
              />
            )}
            {activeTab === 'products' && (
              <ProductManagement 
                products={products} 
                categories={categories}
                onRefresh={onRefresh} 
              />
            )}
            {activeTab === 'categories' && (
              <CategoryManagement 
                categories={categories} 
                onRefresh={onRefresh} 
              />
            )}
            {activeTab === 'orders' && (
              <OrderManagement 
                orders={orders} 
                onRefresh={onRefresh} 
              />
            )}
            {activeTab === 'bulk' && (
              <BulkUploadModal 
                onSuccess={() => {
                  onRefresh();
                  setActiveTab('products');
                }} 
              />
            )}
            {activeTab === 'media' && (
              <MediaManagement />
            )}
            {activeTab === 'settings' && (
              <SettingsPanel />
            )}
          </div>
        </main>
      </div>

    </div>
  );
};
