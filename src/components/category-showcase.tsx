"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

/* ─── SVG Icons ─── */
function ArrowRightIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/* ─── Category Data ─── */
const CATEGORY_SHOWCASE = [
  { name: "Fresh Fruits", slug: "fruits", desc: "Hand-picked daily from local orchards.", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=1600&q=80", color: "#FDE68A" },
  { name: "Vegetables", slug: "vegetables", desc: "Crisp, organic, and locally grown.", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1600&q=80", color: "#BBF7D0" },
  { name: "Dairy & Eggs", slug: "dairy", desc: "Farm-fresh milk, cheese, and free-range eggs.", image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=1600&q=80", color: "#DBEAFE" },
  { name: "Bakery", slug: "bakery", desc: "Warm, artisan sourdough and pastries.", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&q=80", color: "#FED7AA" },
  { name: "Meat & Seafood", slug: "meat", desc: "Premium cuts and sustainable catches.", image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1600&q=80", color: "#FECACA" },
  { name: "Beverages", slug: "beverages", desc: "Cold-pressed juices and organic teas.", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=1600&q=80", color: "#E9D5FF" },
];

export function CategoryShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (!scrollWrapperRef.current || !containerRef.current) return;

      const images = gsap.utils.toArray(".category-img");

      // Calculate the total horizontal scroll distance
      const scrollDistance = scrollWrapperRef.current.scrollWidth - window.innerWidth;

      // The horizontal translation
      const tl = gsap.to(scrollWrapperRef.current, {
        x: -scrollDistance,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${scrollDistance}`, // The pinning distance matches horizontal distance
          scrub: 1, // Smooth scrub
          pin: true,
        },
      });

      // Inner Image Parallax (moves opposite to the scroll direction slightly)
      images.forEach((img: any) => {
        gsap.fromTo(img, 
          { x: "-10vw" }, 
          { 
            x: "10vw", 
            ease: "none", 
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: `+=${scrollDistance}`,
              scrub: 1,
            }
          }
        );
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative bg-[#FAFAF5]">
      <div className="h-screen w-full overflow-hidden flex flex-col justify-center">
        
        {/* Floating Background Text (Text removed as requested, element kept to preserve exact DOM structure) */}
        <div className="absolute top-10 left-10 opacity-5 pointer-events-none whitespace-nowrap">
          <h2 className="text-[18vw] font-black leading-none tracking-tighter"></h2>
        </div>

        <div ref={scrollWrapperRef} className="flex gap-12 md:gap-24 px-[5vw] md:px-[10vw] items-center h-[75vh]">
          
          {/* Header Card (Intro) */}
          <div className="flex-shrink-0 w-[85vw] md:w-[40vw] flex flex-col justify-center pr-10 pl-5">
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-[#1A1A1A] mb-8 leading-[0.9]">
              Curated <br/> <span className="text-[#4CAF50]">Aisles</span>
            </h2>
            <p className="text-xl md:text-2xl text-[#78716C] max-w-md font-medium leading-relaxed">
              Keep scrolling to explore our digital marketplace of farm-fresh produce, artisan bakes, and premium cuts.
            </p>
          </div>

          {/* Horizontal Category Cards */}
          {CATEGORY_SHOWCASE.map((cat, i) => (
            <Link 
              href={`/products?category=${cat.slug}`} 
              key={cat.slug}
              className="category-item flex-shrink-0 relative group block w-[85vw] md:w-[65vw] h-[65vh] overflow-hidden shadow-2xl"
              style={{ borderRadius: "var(--radius-2xl)" }}
            >
              {/* Image Container with Parallax inner image */}
              <div className="absolute inset-0 overflow-hidden bg-gray-900">
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="category-img absolute top-0 -left-[10vw] w-[calc(100%+20vw)] h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-700 ease-out" 
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-end text-white z-10 pointer-events-none">
                <p className="text-lg font-bold uppercase tracking-[0.4em] mb-4 text-[#4CAF50]">0{i + 1}</p>
                <h3 className="text-5xl md:text-[5rem] font-black mb-4 tracking-tighter group-hover:text-[#4CAF50] transition-colors duration-500">
                  {cat.name}
                </h3>
                <p className="text-xl md:text-3xl text-white/90 max-w-2xl mb-8 transform translate-y-8 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 ease-out">
                  {cat.desc}
                </p>
                
                <div className="flex items-center gap-4 opacity-0 transform -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700 delay-100 ease-out">
                  <span className="text-2xl font-bold uppercase tracking-widest border-b-2 border-white pb-1">Shop Now</span>
                  <ArrowRightIcon />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
