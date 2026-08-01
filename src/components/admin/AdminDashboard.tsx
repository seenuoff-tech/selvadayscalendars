import React from 'react';
import {
  ShoppingBag, PackageCheck, Layers, EyeOff, Plus,
  FileSpreadsheet, ArrowRight, Clock, CheckCircle2
} from 'lucide-react';
import { Product, Order } from '../../types';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  onNavigateTab: (tab: 'products' | 'orders' | 'bulk') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  onNavigateTab,
}) => {
  const totalOrders = orders.length;
  const totalItemsOrdered = orders.reduce((acc, o) => acc + o.totalQty, 0);
  const activeProducts = products.filter((p) => p.enabled).length;
  const disabledProducts = products.length - activeProducts;

  const recentOrders = orders.slice(0, 5);

  return (
    <div id="admin-dashboard-module" className="space-y-6">
      
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Orders Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Orders</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalOrders}</span>
          </div>
        </div>

        {/* Total Items Ordered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Units Ordered</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalItemsOrdered}</span>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Active Products</span>
            <span className="text-2xl font-extrabold text-slate-900">{activeProducts}</span>
          </div>
        </div>

        {/* Disabled Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <EyeOff className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Disabled Products</span>
            <span className="text-2xl font-extrabold text-slate-900">{disabledProducts}</span>
          </div>
        </div>

      </div>

      {/* Quick Actions Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold">Quick Administrative Shortcuts</h3>
          <p className="text-xs text-slate-300 mt-1">Manage catalog, upload excel sheets, or review recent customer orders</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTab('products')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Manage Products</span>
          </button>

          <button
            onClick={() => onNavigateTab('bulk')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Bulk Excel Upload</span>
          </button>
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Recent Customer Orders
          </h3>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1"
          >
            <span>View All ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No customer orders placed yet.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3 text-center">Total Qty</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-indigo-700">{ord.orderNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{ord.customerName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{ord.city}</td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">{ord.totalQty}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
