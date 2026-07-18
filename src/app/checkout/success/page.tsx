import { SiteHeader } from "@/components/site-header";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; mock?: string }>;
}) {
  const { orderId, mock } = await searchParams;

  let order = null;
  if (orderId) {
    order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    
    // For mock payments, ensure status updates are committed
    if (mock === "true" && order && (order.status !== "CONFIRMED" || order.paymentStatus !== "SUCCEEDED")) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CONFIRMED",
          paymentStatus: "SUCCEEDED",
        },
      });
      // Fetch latest values
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }
  }

  const formatSlot = (startStr: any, endStr: any) => {
    if (!startStr) return "Tomorrow";
    const start = new Date(startStr);
    const end = new Date(endStr);
    return `${start.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-col items-center justify-center px-4 py-16 text-center animate-fade-in-up">
        
        {/* Success Checkmark Ring */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700 border border-green-200 shadow-sm animate-bounce-soft">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="mb-2 text-3xl font-extrabold text-slate-900">Payment Successful!</h1>
        <p className="mb-8 text-sm text-slate-500 max-w-sm font-medium">
          Thank you for your order! Your payment has been authorized and your delivery is being prepared.
        </p>

        {/* Order Details Bento Card */}
        {order && (
          <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 text-left shadow-sm mb-8 space-y-4 font-semibold text-xs text-slate-600">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Order Information</h3>
            <div className="flex justify-between">
              <span>Order Reference</span>
              <span className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Paid</span>
              <span className="text-[#1B5E20] font-bold text-sm">{formatCurrency(order.totalCents)}</span>
            </div>
            
            {order.addressSnapshot && (
              <div className="border-t border-slate-100 pt-3">
                <span className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Shipping Details</span>
                <p className="text-slate-800 font-bold">{(order.addressSnapshot as any).recipient}</p>
                <p className="text-slate-500 font-medium">
                  {(order.addressSnapshot as any).line1}, {(order.addressSnapshot as any).city}, {(order.addressSnapshot as any).state} {(order.addressSnapshot as any).postalCode}
                </p>
              </div>
            )}

            {order.deliverySlotStart && (
              <div className="border-t border-slate-100 pt-3">
                <span className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Scheduled Delivery Time</span>
                <p className="text-[#1B5E20] font-bold">
                  {formatSlot(order.deliverySlotStart, order.deliverySlotEnd)}
                </p>
              </div>
            )}
          </div>
        )}

        {mock === "true" && (
          <div className="w-full mb-8 rounded-2xl bg-amber-50 p-4 text-xs text-amber-800 border border-amber-200 text-left leading-relaxed font-semibold">
            ⚡ <strong>Sandbox Simulation Confirmation:</strong> The payment was authorized via our local mock payment selector. Stock was reserved, and the order has been successfully recorded in the catalog.
          </div>
        )}

        <div className="flex gap-4">
          <Link
            href="/account/orders"
            className="rounded-xl bg-[#1B5E20] px-6 py-3 text-sm font-bold text-white hover:bg-[#134416] transition-colors shadow-md hover:shadow-lg"
          >
            View Orders
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    </div>
  );
}
