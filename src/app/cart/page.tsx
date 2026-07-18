import { SiteHeader } from "@/components/site-header";
import { CartClient } from "@/components/cart-client";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Your cart</h1>
        <CartClient />
      </main>
    </div>
  );
}

