"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { formatCurrency } from "@/lib/pricing";

// Register GSAP ScrollTrigger
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

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  products: Product[];
  categories: Category[];
};

export function HomeHorizontalScroll({ products, categories }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  
  // Custom Cursor Refs
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorCircleRef = useRef<HTMLDivElement>(null);
  const [cursorVisible, setCursorVisible] = useState(false);
  
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Slice first 5 products for showcase
  const showcaseProducts = useMemo(() => products.slice(0, 5), [products]);

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

  useEffect(() => {
    if (!containerRef.current || !trackRef.current) return;

    // Pinning duration size based on the width of the track
    const maxScroll = trackRef.current.scrollWidth - window.innerWidth;

    // 1. Horizontal scroll pinning master timeline
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        scrub: 1.2,
        start: "top top",
        end: () => `+=${maxScroll}`,
        invalidateOnRefresh: true,
      }
    });

    // Translate track horizontally
    scrollTl.to(trackRef.current, {
      x: -maxScroll,
      ease: "none",
    }, 0);

    // 2. Parallax drifts in Panel 1
    scrollTl.to(".parallax-title-1", {
      x: -120,
      ease: "none",
    }, 0);

    scrollTl.to(".parallax-desc-1", {
      x: -60,
      ease: "none",
    }, 0);

    // 3. Department Images Parallax (Panel 2)
    const deptImages = gsap.utils.toArray(".dept-bg-image");
    deptImages.forEach((img: any) => {
      gsap.fromTo(img, 
        { xPercent: -15 },
        {
          xPercent: 15,
          ease: "none",
          scrollTrigger: {
            trigger: img,
            containerAnimation: scrollTl,
            start: "left right",
            end: "right left",
            scrub: true,
          }
        }
      );
    });

    // 4. Product Card Scale-In & Rotate animations (Panel 3)
    const cardsElements = gsap.utils.toArray(".product-card-slide");
    cardsElements.forEach((card: any, index: number) => {
      gsap.fromTo(card,
        { scale: 0.85, opacity: 0.1, rotateY: -15, transformOrigin: "center center" },
        {
          scale: 1,
          opacity: 1,
          rotateY: 0,
          ease: "power1.out",
          scrollTrigger: {
            trigger: card,
            containerAnimation: scrollTl,
            start: "left right-=100", // Start animating as it approaches the right edge
            end: "center center+=100", // Full focus by center stage
            scrub: true,
          }
        }
      );
    });

    ScrollTrigger.refresh();

    // 5. Mouse Move Handler for custom trailing cursor
    const handleMouseMove = (e: MouseEvent) => {
      setCursorVisible(true);
      if (cursorDotRef.current && cursorCircleRef.current) {
        gsap.to(cursorDotRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.08,
          ease: "power1.out",
        });
        gsap.to(cursorCircleRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.28,
          ease: "power2.out",
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.trigger === containerRef.current) {
          trigger.kill();
        }
      });
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-[#060C08] overflow-hidden">
      
      {/* 13G Style Trailing Custom Cursor Elements */}
      <div 
        ref={cursorDotRef} 
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-[#10b981] rounded-full pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 hidden md:block mix-blend-difference transition-opacity duration-300"
        style={{ opacity: cursorVisible ? 1 : 0 }}
      />
      <div 
        ref={cursorCircleRef} 
        className="fixed top-0 left-0 w-9 h-9 border border-[#10b981]/60 rounded-full pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 hidden md:block transition-[width,height,opacity] duration-300 ease-out" 
        style={{ opacity: cursorVisible ? 1 : 0 }}
      />

      {/* SVG Fractal Noise Grain Overlay */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none z-20 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Horizontal Panels Track Container */}
      <div ref={trackRef} className="flex h-full w-max relative z-10 items-center">
        
        {/* PANEL 1: The Fresh Story (100vw) */}
        <section className="horizontal-panel w-screen h-full flex-shrink-0 flex items-center justify-between px-12 md:px-28 relative border-r border-white/5">
          <div className="max-w-2xl pointer-events-auto">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981] bg-[#10B981]/10 px-4 py-1.5 rounded-none border border-[#10B981]/25 select-none">
              Welcome to FreshLane
            </span>
            <h1 className="parallax-title-1 text-6xl md:text-9xl font-serif text-white tracking-tight leading-[0.9] mt-8 select-none">
              SOURCED DAILY,<br />
              <span className="text-[#10B981] italic">DIRECT TO YOU.</span>
            </h1>
            <p className="parallax-desc-1 text-xs md:text-sm font-semibold text-slate-400 mt-8 max-w-sm leading-relaxed">
              We connect local micro-farms directly with your dining table. Experience organic groceries harvested and delivered in under 24 hours.
            </p>
            <div className="mt-10">
              <a
                href="#departments"
                onClick={(e) => {
                  e.preventDefault();
                  // horizontal offset slide to 100vw scroll progress
                  const scrollProgressLength = trackRef.current ? (trackRef.current.scrollWidth - window.innerWidth) / 3 : window.innerHeight;
                  gsap.to(window, { scrollTo: scrollProgressLength, duration: 1.2 });
                }}
                className="group px-7 py-4 border border-white/20 hover:border-[#10b981] text-white hover:text-[#10b981] text-xs font-black uppercase tracking-widest transition-[color,border-color] duration-300 outline-none focus-visible:border-[#10b981]"
              >
                Explore Departments <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>

          {/* Right column: Parallax Floating Asset */}
          <div className="hidden lg:block w-[360px] h-[440px] relative overflow-hidden border border-white/10 p-4 mr-12 bg-black/10 select-none">
            <div className="absolute top-4 left-4 text-[9px] font-mono text-[#10b981] font-bold">SPECIMEN // 01</div>
            <img
              src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80"
              alt="Organic Apple Specimen"
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 ease-out"
            />
          </div>
        </section>

        {/* PANEL 2: Full-Height Category Slides (100vw) */}
        <section id="departments" className="horizontal-panel w-screen h-full flex-shrink-0 flex flex-col justify-center px-12 md:px-28 relative border-r border-white/5">
          <div className="max-w-lg mb-10">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981] bg-[#10B981]/10 px-4 py-1.5 rounded-none border border-[#10B981]/25 select-none">
              Harvest Departments
            </span>
            <h2 className="text-4xl md:text-6xl font-serif text-white mt-4 tracking-tight">
              Freshness by Department
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 w-full max-w-6xl pointer-events-auto border border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-black/20">
            {[
              { id: "01", name: "FRUITS & VEGETABLES", desc: "Crisp leafy greens, vine-ripened berries, and seasonal root crops.", slug: "fruits-vegetables", bg: "https://images.unsplash.com/photo-1610348725531-843dff163e2c?w=600&q=80" },
              { id: "02", name: "FRESH DAIRY & EGGS", desc: "Pasture-raised eggs, organic whole milk, butter, and artisan cheeses.", slug: "dairy-bakery", bg: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80" },
              { id: "03", name: "PANTRY & STAPLES", desc: "Fresh cold brew, organic grains, local honeys, and baking supplies.", slug: "beverages", bg: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80" }
            ].map((col) => (
              <Link
                key={col.id}
                href={`/products?category=${col.slug}`}
                className="group relative p-8 md:p-12 overflow-hidden flex flex-col justify-between h-[340px] md:h-[400px] outline-none focus-visible:ring-1 focus-visible:ring-[#10b981]"
              >
                <div 
                  className="dept-bg-image absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{ backgroundImage: `url(${col.bg})`, width: "120%", left: "-10%" }}
                />
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/45 transition-colors duration-500" />

                <div className="relative z-10">
                  <span className="text-xs font-mono text-[#10b981] font-bold">
                    {col.id}
                  </span>
                  <h3 className="text-xl md:text-2xl font-serif text-white mt-4 tracking-tight leading-tight">
                    {col.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-300 mt-3 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-w-[240px]">
                    {col.desc}
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#10b981]">
                  Explore Section <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* PANEL 3: The Horizontal Product Slide-Deck (150vw width area) */}
        <section className="horizontal-panel h-full flex-shrink-0 flex items-center px-12 md:px-28 relative border-r border-white/5 w-max">
          <div className="flex gap-16 items-center h-full pointer-events-auto">
            
            {/* Title panel */}
            <div className="max-w-xs flex-shrink-0">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#10B981] bg-[#10B981]/10 px-3.5 py-1.5 border border-[#10B981]/25 select-none">
                Fresh Showcase
              </span>
              <h2 className="text-4xl md:text-5xl font-serif text-white mt-6 leading-tight tracking-tight">
                Hand-selected Favorites
              </h2>
              <p className="text-xs font-medium text-slate-400 mt-4 leading-relaxed">
                Harvested at peak ripeness and delivered directly from local family farms.
              </p>
              {message && (
                <div className="mt-6 px-3.5 py-2.5 rounded-none bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-xs font-bold animate-fade-in text-center leading-none">
                  {message}
                </div>
              )}
            </div>

            {/* Slider cards list */}
            <div className="flex gap-8 overflow-visible items-center">
              {showcaseProducts.map((product) => (
                <div
                  key={product.id}
                  className="product-card-slide w-[300px] h-[420px] bg-black/40 border border-white/10 flex flex-col justify-between p-6 flex-shrink-0 group hover:border-[#10b981]/50 transition-all duration-300 rounded-none relative"
                >
                  <div className="relative w-full h-[200px] overflow-hidden border border-white/5 bg-black/10">
                    <img
                      src={product.images[0]?.url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80"}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 select-none"
                    />
                  </div>
                  
                  <div>
                    <span className="text-[9px] font-mono text-[#10b981] font-bold block mt-3">
                      {product.category?.name?.toUpperCase() || "FRESH"}
                    </span>
                    <h3 className="text-base font-serif text-white mt-1 truncate">
                      {product.name}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1 line-clamp-2 h-[30px] leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 leading-none uppercase font-semibold">Price</p>
                      <p className="text-base font-black text-[#10b981] mt-1">
                        {formatCurrency(product.priceCents)}
                        <span className="text-[9px] text-slate-400 font-bold ml-1">/ {product.unit.toLowerCase()}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addingId === product.id}
                      className="px-4.5 py-2 border border-white/20 hover:border-[#10b981] hover:text-[#10b981] text-white text-[10px] font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-50 cursor-pointer outline-none focus-visible:border-[#10b981]"
                    >
                      {addingId === product.id ? "Adding…" : "Add"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* PANEL 4: Sourcing Promise & Final Call-To-Action (100vw) */}
        <section className="horizontal-panel w-screen h-full flex-shrink-0 flex items-center justify-between px-12 md:px-28 relative">
          <div className="max-w-2xl pointer-events-auto">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#10B981] bg-[#10B981]/10 px-4 py-1.5 rounded-none border border-[#10B981]/25 select-none">
              Our Organic Values
            </span>
            <h2 className="text-5xl md:text-8xl font-serif text-white tracking-tight leading-[0.95] mt-8">
              Harvested with care,<br />
              <span className="text-[#10B981] italic">delivered in zero-waste.</span>
            </h2>
            <p className="text-xs md:text-sm font-semibold text-slate-400 mt-8 max-w-md leading-relaxed">
              We use 100% reusable packaging and partner with carbon-neutral delivery networks. Our promise is simple: healthy foods for you, a healthy planet for all of us.
            </p>
            <div className="mt-10">
              <Link
                href="/products"
                className="px-8 py-4 border border-white/20 hover:border-[#10b981] text-white hover:text-[#10b981] text-xs font-black uppercase tracking-widest transition-[color,border-color] duration-300 outline-none focus-visible:border-[#10b981]"
              >
                Shop Full Catalog <span className="inline-block transition-transform hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          {/* Right column: Parallax Floating Asset Specimen 02 */}
          <div className="hidden lg:block w-[360px] h-[440px] relative overflow-hidden border border-white/10 p-4 mr-12 bg-black/10 select-none">
            <div className="absolute top-4 left-4 text-[9px] font-mono text-[#10b981] font-bold">SPECIMEN // 02</div>
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80"
              alt="Pantry Staples Specimen"
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 ease-out"
            />
          </div>
        </section>

      </div>
    </div>
  );
}
