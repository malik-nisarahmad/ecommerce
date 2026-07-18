"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/pricing";
import Link from "next/link";

type CartProduct = {
  id: string;
  name: string;
  priceCents: number;
  unit: string;
  stock: number;
  images: Array<{ url: string; alt: string }>;
};

type CartRow = {
  id: string;
  quantity: number;
  product: CartProduct;
};

type CartPayload = {
  cart: {
    id: string;
    items: CartRow[];
  };
  totals: {
    subtotalCents: number;
    taxCents: number;
    deliveryFeeCents: number;
    totalCents: number;
  };
};

function readGuestCart(): Record<string, number> {
  const raw = localStorage.getItem("freshlane_guest_cart");
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function writeGuestCart(cart: Record<string, number>): void {
  localStorage.setItem("freshlane_guest_cart", JSON.stringify(cart));
}

export function CartClient() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [cart, setCart] = useState<CartPayload | null>(null);
  const [guestItems, setGuestItems] = useState<Array<{ id: string; name: string; quantity: number }>>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const meRes = await fetch("/api/auth/me", { cache: "no-store" });
    const mePayload: { user: { id: string } | null } = await meRes.json();
    const logged = Boolean(mePayload.user);
    setIsLoggedIn(logged);

    if (!logged) {
      const guestCart = readGuestCart();
      const ids = Object.keys(guestCart);
      if (ids.length === 0) {
        setGuestItems([]);
        setLoading(false);
        return;
      }
      const entries = await Promise.all(
        ids.map(async (id) => {
          const productRes = await fetch(`/api/products/${id}`);
          if (!productRes.ok) return null;
          const productPayload: { product: { id: string; name: string } } = await productRes.json();
          return {
            id: productPayload.product.id,
            name: productPayload.product.name,
            quantity: guestCart[id],
          };
        }),
      );
      setGuestItems(entries.filter((entry): entry is { id: string; name: string; quantity: number } => Boolean(entry)));
      setLoading(false);
      return;
    }

    const cartRes = await fetch("/api/cart");
    if (cartRes.ok) {
      const payload = (await cartRes.json()) as CartPayload;
      setCart(payload);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateQuantity = async (productId: string, quantity: number) => {
    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    window.dispatchEvent(new Event("cart-updated"));
    void loadData();
  };

  const updateGuestQuantity = (productId: string, quantity: number) => {
    const guestCart = readGuestCart();
    if (quantity <= 0) {
      delete guestCart[productId];
    } else {
      guestCart[productId] = quantity;
    }
    writeGuestCart(guestCart);
    window.dispatchEvent(new Event("cart-updated"));
    void loadData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <svg className="animate-spin h-8 w-8 text-[#1B5E20] mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm font-medium">Loading your shopping cart...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Guest Cart</h2>
        {guestItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500 font-medium">Your guest cart is empty.</p>
            <Link href="/" className="mt-4 inline-block rounded-xl bg-[#1B5E20] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#134416] transition-colors">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              {guestItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 last:pb-0">
                  <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateGuestQuantity(item.id, item.quantity - 1)} className="h-8 w-8 rounded-lg bg-slate-100 font-bold hover:bg-slate-200 cursor-pointer text-slate-700 transition-colors">-</button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateGuestQuantity(item.id, item.quantity + 1)} className="h-8 w-8 rounded-lg bg-slate-100 font-bold hover:bg-slate-200 cursor-pointer text-slate-700 transition-colors">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 shadow-sm leading-relaxed">
              <strong>Tip:</strong> Please <Link href="/login" className="underline font-bold text-amber-900">Log In</Link> or <Link href="/signup" className="underline font-bold text-amber-900">Sign Up</Link> to save your items, customize delivery details, and securely checkout.
            </div>
          </div>
        )}
      </div>
    );
  }

  const hasItems = cart && cart.cart.items.length > 0;

  return (
    <div className="grid gap-12 lg:grid-cols-12 animate-fade-in pb-24 mt-8">
      {/* Cart Items List - takes 7 columns */}
      <div className="lg:col-span-7 space-y-8">
        {hasItems ? (
          <div className="space-y-6">
            {cart.cart.items.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center gap-8 rounded-[2.5rem] bg-white p-6 md:p-8 shadow-sm border border-[#F0F0EA] transition-all hover:shadow-xl group">
                {/* Huge Image */}
                <div className="shrink-0 w-full sm:w-48 h-48 rounded-[1.5rem] overflow-hidden bg-[#FAFAF5]">
                  {item.product.images[0] ? (
                    <img src={item.product.images[0].url} alt={item.product.images[0].alt} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                  )}
                </div>
                
                {/* Details */}
                <div className="flex-grow w-full flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-3xl font-black text-[#1A1A1A] tracking-tighter mb-2">{item.product.name}</h3>
                      <p className="text-[#9CA3AF] font-bold tracking-widest uppercase text-xs">{formatCurrency(item.product.priceCents)} / {item.product.unit}</p>
                    </div>
                    <button onClick={() => updateQuantity(item.product.id, 0)} className="text-[#9CA3AF] hover:text-[#DC2626] hover:bg-red-50 rounded-full transition-colors p-3">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                  
                  {/* Huge Pill Dial */}
                  <div className="inline-flex items-center bg-[#FAFAF5] rounded-full p-2 border border-[#E8E8E0] self-start shadow-inner">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white hover:shadow-md transition-all text-[#1A1A1A] font-black text-2xl cursor-pointer">-</button>
                    <span className="w-16 text-center text-2xl font-black text-[#1A1A1A]">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white hover:shadow-md transition-all text-[#1A1A1A] font-black text-2xl cursor-pointer disabled:opacity-30">+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[3rem] bg-[#FAFAF5] border border-[#E8E8E0] p-16 text-center shadow-sm flex flex-col items-center justify-center min-h-[50vh]">
            <div className="text-[6rem] mb-8 grayscale opacity-50 filter drop-shadow-md">🛒</div>
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter mb-4">Your cart is empty</h2>
            <Link href="/" className="mt-8 inline-flex items-center gap-4 rounded-full bg-[#1A1A1A] px-10 py-5 text-lg font-bold text-white hover:bg-[#1B5E20] hover:scale-105 transition-all shadow-xl">
              Return to Store
            </Link>
          </div>
        )}
      </div>

      {/* Cart Summary Card - takes 5 columns */}
      {hasItems && cart ? (
        <div className="lg:col-span-5 relative">
          <div className="rounded-[3rem] bg-[#1B5E20] text-white p-8 md:p-10 shadow-2xl sticky top-32">
            <h3 className="mb-6 font-black tracking-tighter text-2xl md:text-3xl opacity-90 uppercase">Order Summary</h3>
            
            <div className="space-y-4 mb-8 text-base md:text-lg font-medium opacity-80">
              <div className="flex justify-between gap-4"><span>Subtotal</span><span>{formatCurrency(cart.totals.subtotalCents)}</span></div>
              <div className="flex justify-between gap-4"><span>Estimated Tax</span><span>{formatCurrency(cart.totals.taxCents)}</span></div>
              <div className="flex justify-between gap-4"><span>Delivery</span><span>{formatCurrency(cart.totals.deliveryFeeCents)}</span></div>
            </div>
            
            <div className="flex justify-between items-end gap-4 font-black mt-8 pt-8 border-t border-white/20 mb-10 tracking-tighter">
              <span className="text-3xl md:text-4xl">Total</span>
              <span className="text-4xl md:text-5xl text-[#BBF7D0]">{formatCurrency(cart.totals.totalCents)}</span>
            </div>

            <Link
              href="/checkout"
              className="w-full flex items-center justify-center rounded-full bg-white text-[#1B5E20] px-8 py-5 text-lg font-black uppercase tracking-widest hover:scale-105 transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] cursor-pointer"
            >
              Checkout
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
