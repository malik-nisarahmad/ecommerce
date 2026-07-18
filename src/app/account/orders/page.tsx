"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { formatCurrency } from "@/lib/pricing";

type Order = {
  id: string;
  status: string;
  totalCents: number;
  createdAt: string;
  items: Array<{ productName: string; quantity: number }>;
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/orders");
      if (!response.ok) {
        setError("Please login to view order history.");
        return;
      }
      const payload: { orders: Order[] } = await response.json();
      setOrders(payload.orders);
    };
    void load();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Order history</h1>
        {error ? <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {orders.length === 0 ? (
          <p className="rounded border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
            No orders yet.
          </p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded border border-zinc-200 bg-white p-4">
                <p className="font-semibold">
                  Order {order.id} • {formatCurrency(order.totalCents)}
                </p>
                <p className="text-sm text-zinc-600">
                  {order.status} • {new Date(order.createdAt).toLocaleString()}
                </p>
                <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700">
                  {order.items.map((item, index) => (
                    <li key={`${item.productName}-${index}`}>
                      {item.productName} x {item.quantity}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

