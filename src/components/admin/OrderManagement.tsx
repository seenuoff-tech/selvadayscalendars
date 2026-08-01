import React, { useState } from 'react';
import {
  Search, Download, Trash2, Eye, Calendar, User, Phone,
  MapPin, Clock, CheckCircle, AlertTriangle, FileText, X, Hash
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { exportOrdersToExcel } from '../../lib/excel';
import { InvoiceGeneratorModal } from './InvoiceGeneratorModal';

interface OrderManagementProps {
  orders: Order[];
  onRefresh: () => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ orders, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.mobileNumber.includes(searchQuery) ||
      order.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatusFilter === 'ALL' || order.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Update order status
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        if (viewingOrder && viewingOrder.id === orderId) {
          setViewingOrder({ ...viewingOrder, status: newStatus });
        }
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeletingOrderId(null);
        if (viewingOrder && viewingOrder.id === orderId) {
          setViewingOrder(null);
        }
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
  };

  const statusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Delivered':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div id="order-management-module" className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="order-search-input"
            type="text"
            placeholder="Search by customer name, mobile, city, or order #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Status Filter & Export Button */}
        <div className="flex items-center space-x-3 justify-between sm:justify-end">
          
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses ({orders.length})</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Export Orders to Excel */}
          <button
            id="btn-export-orders-excel"
            onClick={() => exportOrdersToExcel(filteredOrders)}
            disabled={filteredOrders.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

        </div>

      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="admin-orders-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3.5 px-4">Order # / Date</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-3 text-center">Place / City</th>
                <th className="py-3.5 px-3 text-center">Total Qty</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No orders found matching your search.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">

                    {/* Order # & Date */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-bold text-indigo-700 text-xs sm:text-sm">
                        {order.orderNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-bold text-slate-900 text-sm">
                        {order.customerName}
                      </div>
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{order.mobileNumber}</span>
                      </div>
                    </td>

                    {/* City */}
                    <td className="py-3.5 px-3 text-center align-middle">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {order.city}
                      </span>
                    </td>

                    {/* Total Quantity */}
                    <td className="py-3.5 px-3 text-center align-middle">
                      <span className="font-extrabold text-slate-900 text-sm bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                        {order.totalQty} Units
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-3 text-center align-middle">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer transition-colors ${statusBadgeStyle(order.status)}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center align-middle">
                      <div className="inline-flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setViewingOrder(order)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setInvoiceOrder(order)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors text-xs font-bold"
                          title="Generate Invoice"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Generate Invoice</span>
                        </button>
                        <button
                          onClick={() => setDeletingOrderId(order.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Order"
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

      {/* VIEW ORDER DETAILS MODAL */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-[#0C8D99]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-[#0C8D99] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Hash className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-slate-100">Order Details: {viewingOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              
              {/* Customer Info Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Customer Name</span>
                  <span className="font-bold text-slate-900 text-sm">{viewingOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Mobile Number</span>
                  <span className="font-bold text-slate-900 text-sm">{viewingOrder.mobileNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Place / City</span>
                  <span className="font-semibold text-slate-800">{viewingOrder.city}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Order Date</span>
                  <span className="font-semibold text-slate-800">{new Date(viewingOrder.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">Update Order Status:</span>
                <select
                  value={viewingOrder.status}
                  onChange={(e) => handleUpdateStatus(viewingOrder.id, e.target.value as OrderStatus)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${statusBadgeStyle(viewingOrder.status)}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Items Breakdown */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 uppercase text-[11px] tracking-wider">Ordered Products</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">S.No</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-slate-500">{item.sno || idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{item.productName}</td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-indigo-700">{item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#0C8D99] text-white font-bold border-t border-slate-800">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3">Total Quantity:</td>
                        <td className="py-2.5 px-3 text-right text-indigo-300 text-sm">{viewingOrder.totalQty} Units</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {viewingOrder.notes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                  <span className="font-bold">Customer Notes:</span> {viewingOrder.notes}
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  onClick={() => setDeletingOrderId(viewingOrder.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Order</span>
                </button>

                <button
                  onClick={() => setViewingOrder(null)}
                  className="px-5 py-2 bg-[#0C8D99] text-white text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingOrderId && (
        <div className="fixed inset-0 z-50 bg-[#0C8D99]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm text-center space-y-4 my-auto">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete Order Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete this order?
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingOrderId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrder(deletingOrderId)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE GENERATOR MODAL */}
      {invoiceOrder && (
        <InvoiceGeneratorModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

    </div>
  );
};
