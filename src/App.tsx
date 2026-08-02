/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ProductListTable } from './components/ProductListTable';
import { StickyFooterBar } from './components/StickyFooterBar';
import { CustomerOrderModal } from './components/CustomerOrderModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminLayout } from './components/admin/AdminLayout';
import { Product, Order } from './types';
import { openWhatsAppForOrder } from './utils/whatsapp';
import { Calendar, RefreshCw, Sparkles, Loader2, Info } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('calendar_admin_token') === 'admin-session-token-2026';
  });

  // UI Navigation & Modals
  const [viewMode, setViewMode] = useState<'customer' | 'admin'>(() => {
    return window.location.pathname.startsWith('/admin') ? 'admin' : 'customer';
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(() => {
    const isAuth = localStorage.getItem('calendar_admin_token') === 'admin-session-token-2026';
    return window.location.pathname.startsWith('/admin') && !isAuth;
  });

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const isAuth = localStorage.getItem('calendar_admin_token') === 'admin-session-token-2026';
      if (window.location.pathname.startsWith('/admin')) {
        setViewMode('admin');
        if (!isAuth) {
          setIsAdminLoginOpen(true);
        }
      } else {
        setViewMode('customer');
        setIsAdminLoginOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async (instantProducts?: Product[]) => {
    if (instantProducts && Array.isArray(instantProducts)) {
      setProducts([...instantProducts]);
      try {
        localStorage.setItem('cached_portal_products', JSON.stringify(instantProducts));
      } catch (e) {}
      return;
    }
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        // If we have cached products, merge/respect user modifications
        const cachedStr = localStorage.getItem('cached_portal_products');
        if (cachedStr) {
          try {
            const cached: Product[] = JSON.parse(cachedStr);
            if (Array.isArray(cached) && cached.length < data.products.length) {
              setProducts(cached);
              return;
            }
          } catch (e) {}
        }
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  }, []);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  }, []);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      await Promise.all([fetchProducts(), fetchOrders(), fetchCategories()]);
      setIsLoading(false);
    }
    loadData();
  }, [fetchProducts, fetchOrders, fetchCategories]);

  // Handle Qty Update from Customer Table
  const handleQtyChange = (productId: string, newQty: number) => {
    setQuantities((prev) => {
      const updated = { ...prev };
      if (newQty <= 0) {
        delete updated[productId];
      } else {
        updated[productId] = newQty;
      }
      return updated;
    });
  };

  // Clear all selected quantities
  const handleClearAllQuantities = () => {
    setQuantities({});
  };

  // Submit Order API
  const handleSubmitOrder = async (customerData: {
    customerName: string;
    mobileNumber: string;
    city: string;
    notes?: string;
  }) => {
    setIsSubmittingOrder(true);

    const selectedItems = products
      .filter((p) => (quantities[p.id] || 0) > 0)
      .map((p) => ({
        productId: p.id,
        sno: p.sno,
        productName: p.name,
        qty: quantities[p.id],
        unitPrice: p.price,
        imageUrl: p.imageUrl,
      }));

    if (selectedItems.length === 0) {
      setIsSubmittingOrder(false);
      throw new Error('Please select at least one product with quantity > 0');
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customerData,
          items: selectedItems,
        }),
      });

      const data = await res.json();

      if (data.success && data.order) {
        setSubmittedOrder(data.order);
        setIsOrderModalOpen(false);
        setQuantities({});
        fetchOrders();
        // Automatically redirect / open WhatsApp with target phone number
        try {
          const settingsRes = await fetch('/api/settings');
          const settingsData = await settingsRes.json();
          const targetPhone = settingsData?.settings?.whatsappNumber || '9080917850';
          openWhatsAppForOrder(data.order, targetPhone);
        } catch {
          openWhatsAppForOrder(data.order, '9080917850');
        }
      } else {
        throw new Error(data.message || 'Failed to submit order');
      }
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Admin Login Success
  const handleAdminLoginSuccess = (token: string) => {
    localStorage.setItem('calendar_admin_token', 'admin-session-token-2026');
    setIsAdminAuthenticated(true);
    setViewMode('admin');
    setIsAdminLoginOpen(false);
    window.history.pushState({}, '', '/admin');
  };

  // Admin Logout
  const handleAdminLogout = () => {
    localStorage.removeItem('calendar_admin_token');
    setIsAdminAuthenticated(false);
    setViewMode('customer');
    window.history.pushState({}, '', '/');
  };

  // Filtered Products for Customer View
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute total selected items and quantity
  const totalQty = Object.values(quantities).reduce((acc: number, q: number) => acc + q, 0);
  const selectedProductIds = Object.keys(quantities);
  const totalEstimatedPrice = products
    .filter((p) => quantities[p.id])
    .reduce((acc: number, p: Product) => acc + (quantities[p.id] * (p.price || 0)), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0C8D99] text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
          <Calendar className="w-6 h-6" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
        <p className="text-sm font-semibold text-slate-300">Loading Calendar Order Portal...</p>
      </div>
    );
  }

  // Render Admin View if requested and authenticated
  if (viewMode === 'admin' && isAdminAuthenticated) {
    return (
      <AdminLayout
        products={products}
        orders={orders}
        categories={categories}
        onRefresh={(updatedProducts) => {
          fetchProducts(updatedProducts);
          fetchOrders();
          fetchCategories();
        }}
        onLogout={handleAdminLogout}
        onExitToStore={() => {
          setViewMode('customer');
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  // Render Customer Ordering View
  return (
    <div id="customer-view-app" className="min-h-screen bg-slate-100 text-slate-900 pb-28">
      
      {/* Sticky Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalQty={totalQty}
        uniqueCount={selectedProductIds.length}
        onProceedOrder={() => setIsOrderModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Product Table Component */}
        <ProductListTable
          products={filteredProducts}
          quantities={quantities}
          onQtyChange={handleQtyChange}
          searchQuery={searchQuery}
        />

      </main>

      {/* Sticky Bottom Footer */}
      <StickyFooterBar
        totalQty={totalQty}
        totalProductsCount={selectedProductIds.length}
        totalEstimatedPrice={totalEstimatedPrice}
        onClearAll={handleClearAllQuantities}
        onProceedOrder={() => setIsOrderModalOpen(true)}
      />

      {/* CUSTOMER ORDER MODAL */}
      <CustomerOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        products={products}
        quantities={quantities}
        onSubmitOrder={handleSubmitOrder}
        isSubmitting={isSubmittingOrder}
      />

      {/* ORDER SUCCESS RECEIPT MODAL */}
      <OrderSuccessModal
        order={submittedOrder}
        onClose={() => setSubmittedOrder(null)}
      />

      {/* ADMIN LOGIN MODAL */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => {
          setIsAdminLoginOpen(false);
          if (window.location.pathname.startsWith('/admin') && !isAdminAuthenticated) {
             window.history.pushState({}, '', '/');
             setViewMode('customer');
          }
        }}
        onLoginSuccess={handleAdminLoginSuccess}
      />

    </div>
  );
}

