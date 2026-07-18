import { SiteHeader } from "@/components/site-header";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cancelOrderAndRestoreCart } from "@/lib/checkout-service";

export const dynamic = "force-dynamic";

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const user = await getSessionUser();

  let restored = false;
  if (orderId && user) {
    try {
      await cancelOrderAndRestoreCart({
        prismaClient: prisma,
        orderId,
        userId: user.userId,
      });
      restored = true;
    } catch (e) {
      console.error("Error cancelling order:", e);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-200">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        
        <h1 className="mb-2 text-3xl font-extrabold text-slate-900">Payment Cancelled</h1>
        
        <p className="mb-8 text-base text-slate-600 max-w-md leading-relaxed">
          {restored 
            ? "Your checkout was cancelled. Don't worry, your items have been successfully restored to your shopping cart and stock has been released."
            : "You cancelled the checkout process. No charges were made. If you had items in your cart, they remain saved."}
        </p>

        <div className="flex gap-4">
          <Link
            href="/cart"
            className="rounded-xl bg-[#1B5E20] px-6 py-3 text-sm font-bold text-white hover:bg-[#134416] transition-colors shadow-md hover:shadow-lg"
          >
            Return to Cart
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
