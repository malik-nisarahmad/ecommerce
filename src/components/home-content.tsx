"use client";

import React, { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { FeaturedHarvestShowcase } from "@/components/featured-harvest-showcase";
import { FreshnessJourney } from "@/components/freshness-journey";
import { GsapHero } from "@/components/gsap-hero";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ─── SVG Icons ─── */
function TruckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function LeafSmallIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20a5 5 0 005-5V8h4z" />
      <path d="M17 8V2l-5 5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

import { CategoryShowcase } from "@/components/category-showcase";

/* ─── Infinite Marquee Trust Bar ─── */
function TrustBar() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    const ctx = gsap.context(() => {
      if (!marqueeRef.current) return;
      
      // Infinite horizontal scroll
      const tl = gsap.to(marqueeRef.current, {
        xPercent: -50,
        ease: "none",
        duration: 15,
        repeat: -1,
      });

      // Tie marquee speed to scroll velocity
      ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const velocity = Math.abs(self.getVelocity() / 100);
          gsap.to(tl, { timeScale: 1 + velocity, duration: 0.3, overwrite: true });
          gsap.to(tl, { timeScale: 1, duration: 1, delay: 0.3, overwrite: "auto" });
        }
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative z-50 w-full py-8 overflow-hidden shadow-2xl" style={{ background: "#051608", transform: "rotate(-2deg) scale(1.05)", marginTop: "-3rem", borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="flex whitespace-nowrap w-[200%]" ref={marqueeRef}>
        {[1, 2].map((_, idx) => (
          <div key={idx} className="flex items-center gap-10 md:gap-16 px-5 md:px-8">
            <span className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.8)", color: "transparent" }}>Free Delivery $50+</span>
            <span className="text-3xl md:text-5xl text-[#4CAF50]">✦</span>
            <span className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">Freshness Guarantee</span>
            <span className="text-3xl md:text-5xl text-[#4CAF50]">✦</span>
            <span className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.8)", color: "transparent" }}>Same-Day Delivery</span>
            <span className="text-3xl md:text-5xl text-[#4CAF50]">✦</span>
            <span className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">Farm Sourced Local</span>
            <span className="text-3xl md:text-5xl text-[#4CAF50]">✦</span>
          </div>
        ))}
      </div>
    </section>
  );
}
/* ─── Promotional Banner (With Parallax) ─── */
function PromoBanner() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]); // Subtle parallax movement

  return (
    <section className="section" ref={ref}>
      <div className="mx-auto max-w-7xl px-5">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative overflow-hidden min-h-[320px]" style={{ borderRadius: "var(--radius-xl)" }}>
            <motion.img
              src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&q=80"
              alt="Fresh organic produce"
              className="absolute inset-0 w-full h-[120%] object-cover"
              style={{ y }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,111,0,0.9) 0%, rgba(249,168,37,0.85) 100%)" }} />
            <div className="relative flex flex-col items-center justify-center text-center px-8 py-16 md:py-20">
              <div className="inline-flex items-center px-4 py-1.5 mb-5 text-sm font-bold rounded-full" style={{ background: "rgba(255,255,255,0.2)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.3)" }}>
                🌿 Limited Time Offer
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold leading-tight max-w-lg" style={{ color: "#FFFFFF" }}>
                Get 20% Off Your First Order
              </h2>
              <p className="mt-4 text-base md:text-lg max-w-md" style={{ color: "rgba(255,255,255,0.9)" }}>
                Use code <strong>FRESH20</strong> at checkout. Valid for new customers on orders over $30.
              </p>
              <Link
                href="#products"
                className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold rounded-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{ background: "#FFFFFF", color: "#FF6F00" }}
              >
                Start Shopping <ArrowRightIcon />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}



/* ─── Main Client Content ─── */
export default function HomeContent({ products, categories }: { products: any[]; categories: any[] }) {
  // Initialize Lenis and Sync with GSAP ScrollTrigger
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  return (
    <div style={{ background: "#FAFAF5" }} className="min-h-screen">
      <SiteHeader />
      <GsapHero />
      <div className="-mt-16">
        <TrustBar />
      </div>
      <CategoryShowcase />
      <FeaturedHarvestShowcase products={products} />
      <PromoBanner />
      <FreshnessJourney />
    </div>
  );
}