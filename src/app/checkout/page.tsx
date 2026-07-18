import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { CheckoutClient } from "@/app/checkout/checkout-client";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?redirect=/checkout");
  }

  // 1. Get user cart
  const cart = await prisma.cart.findUnique({
    where: { userId: user.userId },
  });

  if (!cart || !cart.items || cart.items.length === 0) {
    redirect("/cart");
  }

  // 2. Get user addresses
  const addresses = await prisma.address.findMany({
    where: { userId: user.userId },
  });

  // Calculate cart totals
  const subtotalCents = cart.items.reduce((sum: number, item: any) => {
    return sum + (item.product?.priceCents ?? 0) * item.quantity;
  }, 0);

  // Totals calculations matching calculateTotals helper
  const taxRate = 0.0825; // 8.25%
  const deliveryFeeCents = subtotalCents >= 5000 ? 0 : 500; // Free over $50
  const taxCents = Math.round(subtotalCents * taxRate);
  const totalCents = subtotalCents + taxCents + deliveryFeeCents;

  const totals = {
    subtotalCents,
    taxCents,
    deliveryFeeCents,
    totalCents,
  };

  const hasStripeConfigured = Boolean(env.STRIPE_SECRET_KEY);

  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      {/* Absolute Header so it overlays or sits cleanly at the top */}
      <div className="absolute top-0 left-0 w-full z-50 mix-blend-difference text-white">
        <SiteHeader />
      </div>

      <main className="w-full min-h-screen animate-fade-in-up">
        <CheckoutClient
          initialAddresses={addresses}
          cart={cart}
          totals={totals}
          stripeConfigured={hasStripeConfigured}
        />
      </main>
    </div>
  );
}
