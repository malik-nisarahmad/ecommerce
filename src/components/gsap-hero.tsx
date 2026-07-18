"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function GsapHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const floatersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    const ctx = gsap.context(() => {
      // Create a timeline that scrubs with scroll
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=150%", // How long the pin lasts
          scrub: 1,      // Smooth scrubbing
          pin: true,     // Pin the hero section while animating
        },
      });

      // 3D Parallax effect
      tl.to(
        bgRef.current,
        {
          scale: 1.5,
          rotationX: 15,
          y: "20%",
          transformOrigin: "center bottom",
          ease: "none",
        },
        0
      );

      tl.to(
        textRef.current,
        {
          y: "-150%",
          scale: 1.2,
          opacity: 0,
          z: 200, // CSS 3D translation
          ease: "none",
        },
        0
      );

      tl.to(
        subtitleRef.current,
        {
          y: "-100%",
          opacity: 0,
          ease: "none",
        },
        0
      );

      // Animate floating elements in various 3D directions
      if (floatersRef.current) {
        const floaters = floatersRef.current.children;
        gsap.to(floaters[0], { y: "-80vh", x: "10vw", rotation: 45, scale: 1.5, ease: "none", scrollTrigger: { trigger: containerRef.current, start: "top top", end: "+=150%", scrub: 1 } });
        gsap.to(floaters[1], { y: "-60vh", x: "-15vw", rotation: -45, scale: 2, ease: "none", scrollTrigger: { trigger: containerRef.current, start: "top top", end: "+=150%", scrub: 1 } });
        gsap.to(floaters[2], { y: "-100vh", x: "5vw", rotation: 90, scale: 0.8, ease: "none", scrollTrigger: { trigger: containerRef.current, start: "top top", end: "+=150%", scrub: 1 } });
      }

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden"
      style={{ perspective: "1000px", background: "#051608" }}
    >
      {/* Background Layer with Image */}
      <div
        ref={bgRef}
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=2000&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          willChange: "transform",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#FAFAF5]" />
      </div>

      {/* Floating Elements Layer */}
      <div ref={floatersRef} className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute bottom-10 left-[10%] w-24 h-24 rounded-full overflow-hidden shadow-2xl border-2 border-white/20">
          <img src="https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=200&q=80" alt="Cherry" className="w-full h-full object-cover" />
        </div>
        <div className="absolute bottom-20 right-[15%] w-32 h-32 rounded-full overflow-hidden shadow-2xl border-2 border-white/20">
          <img src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&q=80" alt="Apple" className="w-full h-full object-cover" />
        </div>
        <div className="absolute bottom-32 left-[40%] w-20 h-20 rounded-full overflow-hidden shadow-2xl border-2 border-white/20">
          <img src="https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=200&q=80" alt="Orange" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Foreground Content */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4" style={{ transformStyle: "preserve-3d" }}>
        <h1
          ref={textRef}
          className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter"
          style={{ color: "#FFFFFF", textShadow: "0 10px 30px rgba(0,0,0,0.5)", willChange: "transform, opacity" }}
        >
          PURE <br />
          <span style={{ color: "#E0F2E9" }}>NATURE</span>
        </h1>
        <p
          ref={subtitleRef}
          className="mt-8 text-lg md:text-2xl font-medium max-w-2xl text-white/90"
          style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
        >
          Immersive, farm-fresh produce delivered straight to your door.
          Experience the 3D difference in freshness.
        </p>
      </div>
    </section>
  );
}
