"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency } from "@/lib/pricing";

/* ─────────────────────────── Types ─────────────────────────── */

type OrderStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type AdminOrder = {
  id: string;
  status: OrderStatus;
  paymentStatus: string;
  totalCents: number;
  createdAt: string;
  user: { name: string; email: string };
  items: { productName: string; quantity: number; unitPriceCents: number }[];
};

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  category: { id: string; name: string };
  images: { url: string; alt: string }[];
};

type Category = { id: string; name: string; slug: string };

type Analytics = {
  dailyOrders: number;
  dailyRevenueCents: number;
  topProducts: { productId: string; productName: string; _sum: { quantity: number; lineTotalCents: number } }[];
};

type LiveEvent =
  | { type: "connected"; at: string }
  | { type: "heartbeat"; at: string }
  | { type: "order.created"; orderId: string; totalCents: number; itemCount: number; createdAt: string }
  | { type: "order.status.updated"; orderId: string; status: OrderStatus; updatedAt: string }
  | { type: "stock.updated"; productId: string; stock: number; lowStockThreshold: number; updatedAt: string }
  | { type: "stock.low"; productId: string; stock: number; lowStockThreshold: number; productName: string; updatedAt: string };

/* ─────────────────────────── Constants ─────────────────────────── */

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pending Payment",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  PENDING_PAYMENT: { bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" }, // Amber
  CONFIRMED: { bg: "#DBEAFE", text: "#2563EB", border: "#BFDBFE" },       // Blue
  PACKED: { bg: "#EDE9FE", text: "#7C3AED", border: "#DDD6FE" },          // Violet
  OUT_FOR_DELIVERY: { bg: "#FFEDD5", text: "#EA580C", border: "#FED7AA" },// Orange
  DELIVERED: { bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0" },       // Green
  CANCELLED: { bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },       // Red
};

/* ─────────────────────────── Small UI Components ─────────────────────────── */

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider"
      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function Card({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md border border-slate-200 bg-white ${className}`}
      style={{
        animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`,
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, delay }: { label: string; value: string; sub?: string; delay: number }) {
  return (
    <Card delay={delay} className="group !border-transparent !shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:!shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#4CAF50]/10 rounded-full blur-2xl transition-all duration-500 group-hover:bg-[#4CAF50]/20" />
      <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-slate-500">
        {label}
      </p>
      <p className="text-4xl font-black tracking-tight text-slate-900">
        {value}
      </p>
      {sub && (
        <p className="text-sm mt-2 font-medium text-slate-500">
          {sub}
        </p>
      )}
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer overflow-hidden ${
        active ? "text-[#1B5E20] shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
      }`}
    >
      {active && (
        <div className="absolute inset-0 bg-white border border-slate-200 rounded-xl" />
      )}
      <div className="relative z-10 flex items-center gap-2.5">
        {icon}
        {label}
      </div>
    </button>
  );
}

/* ─────────────────────────── Icons ─────────────────────────── */
const iconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function IconDashboard() { return <svg {...iconProps}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></svg>; }
function IconBox() { return <svg {...iconProps}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>; }
function IconOrders() { return <svg {...iconProps}><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="4" width="6" height="16" /><line x1="9" y1="12" x2="15" y2="12" /></svg>; }
function IconChart() { return <svg {...iconProps}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>; }
function IconPlus() { return <svg {...iconProps} strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function IconEdit() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>; }
function IconTrash() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>; }
function IconAlert() { return <svg {...iconProps}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>; }

/* ─────────────────────────── Live Dashboard Tab ─────────────────────────── */

function LiveDashboard({
  orders,
  products,
  events,
  connected,
}: {
  orders: AdminOrder[];
  products: AdminProduct[];
  events: LiveEvent[];
  connected: boolean;
}) {
  const lowStock = useMemo(
    () => products.filter((p) => p.stock <= p.lowStockThreshold && p.isActive),
    [products]
  );

  const recentOrders = useMemo(() => orders.slice(0, 8), [orders]);

  const liveEvents = useMemo(
    () => events.filter((e) => e.type !== "heartbeat" && e.type !== "connected").slice(0, 20),
    [events]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-[13px] font-bold tracking-wide transition-all duration-300 shadow-sm bg-white"
            style={{
              color: connected ? "#16A34A" : "#DC2626",
              border: `1px solid ${connected ? "#BBF7D0" : "#FECACA"}`,
              boxShadow: connected ? "0 4px 15px rgba(22, 163, 74, 0.1)" : "none",
            }}
          >
            <div className="relative flex items-center justify-center w-2.5 h-2.5">
              {connected && <span className="absolute inset-0 rounded-full bg-[#4ADE80] animate-ping opacity-75" />}
              <span className="relative w-2 h-2 rounded-full" style={{ background: connected ? "#22C55E" : "#EF4444" }} />
            </div>
            {connected ? "LIVE EVENT STREAM" : "STREAM DISCONNECTED"}
          </div>

          {lowStock.length > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold tracking-wide shadow-sm animate-pulse-soft bg-amber-50 text-amber-700 border border-amber-200">
              <IconAlert />
              {lowStock.length} LOW STOCK {lowStock.length === 1 ? "ALERT" : "ALERTS"}
            </div>
          )}
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        
        {/* Live Event Feed (Left Column) */}
        <Card delay={0.1} className="lg:col-span-5 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Event Feed <span className="flex w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></span>
            </h2>
            <span className="text-xs font-semibold text-[#1B5E20] bg-[#4CAF50]/10 px-2 py-1 rounded-md border border-[#4CAF50]/20">
              Real-time
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
            {liveEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-50">
                <IconChart />
                <p className="text-sm text-slate-500">Waiting for store activity...</p>
              </div>
            ) : (
              liveEvents.map((event, i) => {
                let label: string = event.type;
                let detail = "";
                let color = "#64748b";
                let bgColor = "#f8fafc";
                let borderColor = "#f1f5f9";

                if (event.type === "order.created") {
                  label = "New Order";
                  detail = `${formatCurrency(event.totalCents)} · ${event.itemCount} items`;
                  color = "#16a34a";
                  bgColor = "#f0fdf4";
                  borderColor = "#dcfce7";
                } else if (event.type === "order.status.updated") {
                  label = "Order Updated";
                  detail = `${event.orderId.slice(0, 8)}… → ${STATUS_LABELS[event.status]}`;
                  color = "#2563eb";
                  bgColor = "#eff6ff";
                  borderColor = "#dbeafe";
                } else if (event.type === "stock.updated") {
                  label = "Stock Changed";
                  detail = `Product stock: ${event.stock}`;
                  color = "#7c3aed";
                  bgColor = "#f5f3ff";
                  borderColor = "#ede9fe";
                } else if (event.type === "stock.low") {
                  label = "Low Stock";
                  detail = `${event.productName}: ${event.stock} remaining`;
                  color = "#d97706";
                  bgColor = "#fffbeb";
                  borderColor = "#fef3c7";
                }

                return (
                  <div
                    key={i}
                    className="group flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md"
                    style={{ background: bgColor, borderColor: borderColor }}
                  >
                    <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                    <div>
                      <p className="text-[13px] font-bold tracking-wide" style={{ color }}>{label}</p>
                      <p className="text-sm font-medium mt-0.5 text-slate-700">{detail}</p>
                    </div>
                    <div className="ml-auto text-[10px] text-slate-400 uppercase tracking-wider font-bold pt-0.5">
                      {new Date((event as any).updatedAt || (event as any).createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Incoming Orders & Stock Alerts (Right Column) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Low Stock Banner (conditionally shown) */}
          {lowStock.length > 0 && (
            <Card delay={0.2} className="border-l-4 !border-l-amber-500 bg-amber-50/50">
              <h2 className="text-sm font-black uppercase tracking-widest text-amber-600 flex items-center gap-2 mb-4">
                <IconAlert /> Inventory Action Required
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {lowStock.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-200 shadow-sm"
                  >
                    <div>
                      <p className="text-[13px] font-bold text-slate-900 truncate max-w-[140px]">{p.name}</p>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">Threshold: {p.lowStockThreshold}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black" style={{ color: p.stock === 0 ? "#DC2626" : "#D97706" }}>
                        {p.stock}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Left</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Orders List */}
          <Card delay={0.3} className="flex-1 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Incoming Orders</h2>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Last 8</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {recentOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-50">
                  <IconOrders />
                  <p className="text-sm text-slate-500">No orders yet today.</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-[#1B5E20] font-bold shadow-inner">
                        {order.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-slate-900">{order.user.name}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                          {order.items.length} {order.items.length === 1 ? "item" : "items"} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <p className="text-[14px] font-black text-[#1B5E20]">{formatCurrency(order.totalCents)}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Products Tab ─────────────────────────── */

function ProductsTab({
  products,
  categories,
  onRefresh,
}: {
  products: AdminProduct[];
  categories: Category[];
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkDeltas, setBulkDeltas] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this product?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) onRefresh();
  };

  const handleBulkSubmit = async () => {
    const adjustments = Object.entries(bulkDeltas)
      .map(([productId, delta]) => ({ productId, delta: parseInt(delta, 10) }))
      .filter((a) => !isNaN(a.delta) && a.delta !== 0);
    if (!adjustments.length) return;
    setSaving(true);
    const res = await fetch("/api/admin/stock-adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adjustments }),
    });
    setSaving(false);
    if (res.ok) { setBulkDeltas({}); setBulkMode(false); onRefresh(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">Product Catalog</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setBulkMode((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all duration-300 shadow-sm ${
              bulkMode ? "bg-purple-100 text-purple-700 border border-purple-300" : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200"
            }`}
          >
            Bulk Adjust
          </button>
          {bulkMode && (
            <button
              onClick={handleBulkSubmit}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white cursor-pointer transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}
            >
              {saving ? "Saving…" : "Apply Changes"}
            </button>
          )}
          <button
            onClick={() => { setEditingProduct(null); setShowForm((v) => !v); }}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #4CAF50, #1B5E20)" }}
          >
            <IconPlus /> Add Product
          </button>
        </div>
      </div>

      {(showForm || editingProduct) && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSaved={() => { setShowForm(false); setEditingProduct(null); onRefresh(); }}
        />
      )}

      <Card delay={0.1} className="!p-0 border-slate-200 shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Product Details", "Category", "Price / Unit", "Inventory", "Status", "Actions"].map((h) => (
                  <th key={h} className="py-4 px-5 text-[11px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                ))}
                {bulkMode && <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-widest text-purple-600 whitespace-nowrap">Stock Δ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {products.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-slate-50">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-4">
                      {product.images[0] ? (
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                          <img src={product.images[0].url} alt={product.images[0].alt} className="w-full h-full object-cover bg-slate-100" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                          <IconBox />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-[14px] text-slate-900">{product.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-[13px] font-semibold text-slate-600">{product.category?.name || "—"}</td>
                  <td className="py-3 px-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#1B5E20]">{formatCurrency(product.priceCents)}</span>
                      <span className="text-[11px] text-slate-500 uppercase">per {product.unit}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex flex-col">
                      <span className="font-black text-[15px]" style={{ color: product.stock === 0 ? "#DC2626" : product.stock <= product.lowStockThreshold ? "#D97706" : "#0F172A" }}>
                        {product.stock}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">in stock</span>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm" style={{ background: product.isActive ? "#DCFCE7" : "#FEE2E2", color: product.isActive ? "#16A34A" : "#DC2626", border: `1px solid ${product.isActive ? "#BBF7D0" : "#FECACA"}` }}>
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setEditingProduct(product); setShowForm(false); }} className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors border border-transparent shadow-sm" title="Edit"><IconEdit /></button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-transparent shadow-sm" title="Deactivate"><IconTrash /></button>
                    </div>
                  </td>
                  {bulkMode && (
                    <td className="py-3 px-5">
                      <input
                        type="number"
                        placeholder="± qty"
                        className="w-20 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 bg-white border border-purple-200 text-purple-700 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-inner"
                        value={bulkDeltas[product.id] ?? ""}
                        onChange={(e) => setBulkDeltas((prev) => ({ ...prev, [product.id]: e.target.value }))}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────── Product Form ─────────────────────────── */

function ProductForm({ product, categories, onClose, onSaved }: any) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name"),
      slug: form.get("slug"),
      description: form.get("description"),
      categoryId: form.get("categoryId"),
      priceCents: Math.round(parseFloat(form.get("price") as string) * 100),
      unit: form.get("unit"),
      stock: parseInt(form.get("stock") as string, 10),
      lowStockThreshold: parseInt(form.get("lowStockThreshold") as string, 10),
      imageUrl: form.get("imageUrl") || undefined,
      imageAlt: form.get("imageAlt") || undefined,
    };

    const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
    const method = product ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

    if (res.ok) onSaved();
    else setError((await res.json()).error ?? "Failed to save product");
    setSaving(false);
  };

  const inputClass = "w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/50 bg-white border border-slate-300 text-slate-900 transition-all hover:border-slate-400 shadow-inner";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-600 mb-2";

  return (
    <Card className="animate-fade-in-down border-t-4 border-t-[#4CAF50] shadow-xl z-20 relative">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center text-[#1B5E20]">
            {product ? <IconEdit /> : <IconPlus />}
          </div>
          {product ? "Edit Product" : "Create New Product"}
        </h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">✕</button>
      </div>
      {error && <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">{error}</div>}
      
      <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Product Name</label>
          <input name="name" required defaultValue={product?.name} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Slug</label>
          <input name="slug" required defaultValue={product?.slug} placeholder="organic-apples" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea name="description" required defaultValue={product?.description} rows={3} className={`${inputClass} resize-none`} />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select name="categoryId" required defaultValue={product?.category?.id} className={inputClass}>
            <option value="">Select a category</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Unit Type</label>
          <select name="unit" required defaultValue={product?.unit ?? "EACH"} className={inputClass}>
            {["KG", "LB", "PACK", "EACH", "LITER"].map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Price ($)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
            <input name="price" type="number" step="0.01" min="0.01" required defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""} className={`${inputClass} pl-8`} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Initial Stock</label>
          <input name="stock" type="number" min="0" required defaultValue={product?.stock ?? 0} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Low Stock Warning Level</label>
          <input name="lowStockThreshold" type="number" min="0" required defaultValue={product?.lowStockThreshold ?? 10} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Image URL (Optional)</label>
          <input name="imageUrl" type="url" defaultValue={product?.images[0]?.url ?? ""} placeholder="https://..." className={inputClass} />
        </div>
        <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-md hover:shadow-lg" style={{ background: "linear-gradient(135deg, #4CAF50, #1B5E20)" }}>
            {saving ? "Saving…" : product ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </form>
    </Card>
  );
}

/* ─────────────────────────── Orders Tab ─────────────────────────── */

function OrdersTab({ orders, onRefresh }: { orders: AdminOrder[]; onRefresh: () => void }) {
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "ALL">("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filterStatus === "ALL" ? orders : orders.filter((o) => o.status === filterStatus)),
    [orders, filterStatus]
  );

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    await fetch(`/api/admin/orders/${orderId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setUpdatingId(null);
    onRefresh();
  };

  const statuses: (OrderStatus | "ALL")[] = ["ALL", "PENDING_PAYMENT", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex overflow-x-auto custom-scrollbar pb-2 gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-[12px] font-bold tracking-wider uppercase transition-all duration-300 shadow-sm ${
              filterStatus === s
                ? "bg-[#4CAF50]/10 text-[#1B5E20] border border-[#4CAF50]/30 shadow-[0_4px_10px_rgba(76,175,80,0.1)]"
                : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200"
            }`}
          >
            {s === "ALL" ? "All Orders" : STATUS_LABELS[s as OrderStatus]}
          </button>
        ))}
      </div>

      <Card delay={0.1} className="!p-0 border-slate-200 shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Order ID", "Customer Details", "Items Summary", "Total Value", "Date Placed", "Current Status", "Update"].map((h) => (
                  <th key={h} className="py-4 px-5 text-[11px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center"><div className="flex flex-col items-center justify-center opacity-50"><IconOrders /><p className="mt-3 text-sm font-medium text-slate-500">No orders match this filter.</p></div></td></tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-slate-50">
                    <td className="py-4 px-5 font-mono text-[13px] text-slate-500">
                      <span className="opacity-50">#</span>{order.id.slice(0, 8)}
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-bold text-[14px] text-slate-900">{order.user.name}</p>
                      <p className="text-[12px] text-slate-500 font-medium mt-0.5">{order.user.email}</p>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-[12px] text-slate-600 max-w-[200px]">
                        {order.items.slice(0, 2).map((item, i) => (
                          <div key={i} className="truncate"><span className="font-bold text-slate-800">{item.quantity}×</span> {item.productName}</div>
                        ))}
                        {order.items.length > 2 && <div className="text-[11px] font-bold text-[#4CAF50] mt-1">+{order.items.length - 2} MORE ITEMS</div>}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-black text-[15px] text-[#1B5E20] bg-green-50 px-2.5 py-1 rounded-md border border-green-200 shadow-sm">
                        {formatCurrency(order.totalCents)}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-[12px] font-semibold text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-5"><StatusBadge status={order.status} /></td>
                    <td className="py-4 px-5">
                      <select
                        className="rounded-lg px-3 py-2 text-[12px] font-bold uppercase tracking-wider cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/50 transition-all bg-white border border-slate-300 text-slate-700 hover:border-slate-400 shadow-sm"
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      >
                        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────── Analytics Tab ─────────────────────────── */

function AnalyticsTab({ products }: { products: AdminProduct[] }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics").then((r) => r.json()).then(setAnalytics).catch(() => {});
  }, []);

  const totalProducts = products.filter((p) => p.isActive).length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard delay={0.0} label="Today's Orders" value={String(analytics?.dailyOrders ?? "–")} sub="Successful conversions" />
        <StatCard delay={0.1} label="Today's Revenue" value={analytics ? formatCurrency(analytics.dailyRevenueCents) : "–"} sub="Gross volume" />
        <StatCard delay={0.2} label="Active Products" value={String(totalProducts)} sub="Live in catalog" />
        <StatCard delay={0.3} label="Total Inventory" value={String(totalStock)} sub="Units on hand" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {analytics?.topProducts && analytics.topProducts.length > 0 && (
          <Card delay={0.4} className="flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <IconChart /> Top Performers Today
              </h2>
            </div>
            <div className="space-y-5 flex-1">
              {analytics.topProducts.map((item, i) => {
                const maxQty = analytics.topProducts[0]._sum.quantity;
                const pct = Math.round((item._sum.quantity / maxQty) * 100);
                const colors = [
                  "linear-gradient(90deg, #4CAF50, #1B5E20)",
                  "linear-gradient(90deg, #3B82F6, #1E3A8A)",
                  "linear-gradient(90deg, #A78BFA, #5B21B6)",
                  "linear-gradient(90deg, #F59E0B, #9A3412)"
                ];
                return (
                  <div key={item.productId} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-black text-slate-500 group-hover:bg-slate-200 transition-colors shadow-sm">
                          {i + 1}
                        </span>
                        <span className="text-[14px] font-bold text-slate-900">{item.productName}</span>
                      </div>
                      <div className="flex flex-col items-end leading-tight">
                        <span className="text-[14px] font-black text-[#1B5E20]">{formatCurrency(item._sum.lineTotalCents)}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">{item._sum.quantity} units</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full relative overflow-hidden"
                        style={{ width: `${pct}%`, background: colors[i % colors.length], transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card delay={0.5} className="!p-0 flex flex-col h-full max-h-[500px]">
          <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <IconBox /> Inventory Valuation
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-10 shadow-sm border-b border-slate-100">
                <tr>
                  {["Product", "Value"].map((h) => (
                    <th key={h} className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.filter((p) => p.isActive).sort((a, b) => b.stock * b.priceCents - a.stock * a.priceCents).map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-[13px] text-slate-800 truncate max-w-[180px]">{product.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{product.stock} units × {formatCurrency(product.priceCents)}</p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-black text-[14px] text-[#1B5E20]">{formatCurrency(product.stock * product.priceCents)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────────────── Main AdminDashboard ─────────────────────────── */

export function AdminDashboard() {
  const [tab, setTab] = useState<"live" | "products" | "orders" | "analytics">("live");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const loadedRef = useRef(false);

  const loadData = useCallback(async () => {
    const [ordersRes, productsRes, catsRes] = await Promise.all([
      fetch("/api/admin/orders"),
      fetch("/api/admin/products"),
      fetch("/api/categories"),
    ]);
    if (ordersRes.ok) { const d = await ordersRes.json(); setOrders(d.orders); }
    if (productsRes.ok) { const d = await productsRes.json(); setProducts(d.products); }
    if (catsRes.ok) { const d = await catsRes.json(); setCategories(d.categories ?? []); }
  }, []);

  useEffect(() => {
    if (!loadedRef.current) { loadedRef.current = true; void loadData(); }

    const stream = new EventSource("/api/admin/realtime");
    stream.onmessage = (e) => {
      const payload = JSON.parse(e.data) as LiveEvent;
      if (payload.type === "connected") setConnected(true);
      if (payload.type === "heartbeat") return;
      setEvents((prev) => [payload, ...prev].slice(0, 50));

      if (payload.type === "stock.updated") {
        setProducts((prev) => prev.map((p) => p.id === payload.productId ? { ...p, stock: payload.stock } : p));
      }
      if (payload.type === "order.status.updated") {
        setOrders((prev) => prev.map((o) => o.id === payload.orderId ? { ...o, status: payload.status } : o));
      }
      if (payload.type === "order.created") {
        void loadData(); // Reload to get full order data
      }
    };
    stream.onerror = () => setConnected(false);
    return () => stream.close();
  }, [loadData]);

  const tabs = [
    { key: "live" as const, label: "Live Command", icon: <IconDashboard /> },
    { key: "products" as const, label: "Catalog", icon: <IconBox /> },
    { key: "orders" as const, label: "Fulfillment", icon: <IconOrders /> },
    { key: "analytics" as const, label: "Insights", icon: <IconChart /> },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Tab Navigation (Premium Pill Container) */}
      <div className="inline-flex overflow-x-auto custom-scrollbar p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        {tabs.map((t) => (
          <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} icon={t.icon} label={t.label} />
        ))}
      </div>

      {/* Tab Content with wrapper for absolute positioning context if needed */}
      <div className="relative min-h-[500px]">
        {tab === "live" && <LiveDashboard orders={orders} products={products} events={events} connected={connected} />}
        {tab === "products" && <ProductsTab products={products} categories={categories} onRefresh={loadData} />}
        {tab === "orders" && <OrdersTab orders={orders} onRefresh={loadData} />}
        {tab === "analytics" && <AnalyticsTab products={products} />}
      </div>
    </div>
  );
}
