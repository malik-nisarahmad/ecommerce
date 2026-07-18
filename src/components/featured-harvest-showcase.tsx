"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatCurrency } from "@/lib/pricing";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Product = {
  id: string;
  name: string;
  priceCents: number;
  unit: string;
  stock: number;
  description: string;
  images: Array<{ url: string; alt: string }>;
  category?: { name: string } | null;
};

type Props = {
  products: Product[];
};

export function FeaturedHarvestShowcase({ products }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Slice first 3 products for featured showcase
  const featured = useMemo(() => products.slice(0, 3), [products]);

  // Add to cart helper
  const handleAddToCart = async (product: Product) => {
    setAddingId(product.id);
    setMessage(null);

    try {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const me: { user: { id: string } | null } = await meRes.json();

      if (me.user) {
        const result = await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });
        if (!result.ok) {
          setMessage("Could not add item.");
          setAddingId(null);
          return;
        }
      } else {
        const raw = localStorage.getItem("freshlane_guest_cart");
        const cart = raw ? JSON.parse(raw) : {};
        cart[product.id] = (cart[product.id] ?? 0) + 1;
        localStorage.setItem("freshlane_guest_cart", JSON.stringify(cart));
      }

      window.dispatchEvent(new Event("cart-updated"));
      setMessage(`${product.name} added!`);
      setTimeout(() => {
        setAddingId(null);
        setMessage(null);
      }, 1500);
    } catch (e) {
      setMessage("Failed to add.");
      setAddingId(null);
    }
  };

  // GSAP ScrollTrigger Entrance Animations
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Fade and slide header up
      gsap.fromTo(".scroll-title", 
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".scroll-title",
            start: "top bottom-=100",
            toggleActions: "play none none none",
          }
        }
      );

      // Stagger fade-in of grid cards
      gsap.fromTo(".animate-harvest-card",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top bottom-=80",
            toggleActions: "play none none none",
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Card Mouse Move Tilt & Glow handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, cardId: string) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    
    // Normalized coordinates relative to card center (-1 to 1)
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Light coordinates inside card for hover glow
    const lx = e.clientX - rect.left;
    const ly = e.clientY - rect.top;

    // Apply rotations (max tilt 10 degrees)
    card.style.setProperty("--rx", `${y * 8}deg`);
    card.style.setProperty("--ry", `${x * 8}deg`);
    card.style.setProperty("--lx", `${lx}px`);
    card.style.setProperty("--ly", `${ly}px`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  };

  return (
    <section ref={sectionRef} id="products" className="section relative overflow-hidden bg-background py-20 md:py-28">
      {/* Background radial glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)"
        }}
      />

      <div className="mx-auto max-w-7xl px-5 relative z-10">
        <div className="text-center mb-16 scroll-title">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10B981] bg-green-50/80 px-4 py-1.5 rounded-full border border-green-200/50">
            Fresh Picked
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-black text-slate-900 mt-5 leading-tight tracking-tight">
            Seasonal Harvest Favorites
          </h2>
          <p className="mt-4 text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
            Hand-selected organic produce sourced directly from local micro-farms, updated every morning.
          </p>
          {message && (
            <div className="mt-6 inline-block px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-bold animate-fade-in shadow-sm">
              {message}
            </div>
          )}
        </div>

        {/* 3D Interactive Grid */}
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-8">
          {featured.map((product) => (
            <div
              key={product.id}
              onMouseMove={(e) => handleMouseMove(e, product.id)}
              onMouseLeave={handleMouseLeave}
              className="animate-harvest-card relative bg-white border border-slate-200/60 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between h-[450px] overflow-hidden select-none outline-none focus-within:ring-2 focus-within:ring-[#10B981]"
              style={{
                transform: "perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Dynamic mouse-tracking background light glow */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle 120px at var(--lx, 0px) var(--ly, 0px), rgba(16, 185, 129, 0.08), transparent 70%)`
                }}
              />

              <div className="relative z-10 flex-1 flex flex-col justify-between">
                {/* Product Image Frame */}
                <div className="relative w-full h-[200px] overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                  <img
                    src={product.images[0]?.url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80"}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[9px] font-black uppercase tracking-wider text-white bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full">
                      {product.category?.name || "Organic"}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="text-xl font-serif font-black text-slate-900 group-hover:text-[#112E1A] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* Bottom detail action row */}
              <div className="relative z-10 mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Price</span>
                  <p className="text-xl font-black text-[#1B4332] mt-0.5">
                    {formatCurrency(product.priceCents)}
                    <span className="text-xs text-slate-400 font-bold ml-1">/ {product.unit.toLowerCase()}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={addingId === product.id}
                  className="px-5 py-2.5 bg-[#112E1A] hover:bg-[#10B981] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-[background-color,transform] duration-300 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#112E1A]"
                >
                  {addingId === product.id ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
