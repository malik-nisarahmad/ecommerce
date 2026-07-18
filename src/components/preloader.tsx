"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    // Lock scroll immediately on mount
    document.body.style.overflow = "hidden";

    // Premium Counter Animation logic
    let current = 0;
    const increment = () => {
      // Jump by random increments for a realistic loading feel
      current += Math.floor(Math.random() * 15) + 5;
      if (current >= 100) {
        current = 100;
        setCounter(100);
        // Wait briefly at 100% before firing the exit animation
        setTimeout(() => setIsLoading(false), 800);
      } else {
        setCounter(current);
        setTimeout(increment, Math.random() * 80 + 30);
      }
    };
    
    // Start counting shortly after mount
    const initialDelay = setTimeout(increment, 300);

    return () => {
      clearTimeout(initialDelay);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      document.body.style.overflow = "";
    }
  }, [isLoading]);

  // Framer motion variants for the main curtain
  const slideUp = {
    initial: { top: 0 },
    exit: { 
      top: "-100vh", 
      transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.2 } 
    }
  };

  const backgroundWord = "FRESHLANE";

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="preloader"
          variants={slideUp}
          initial="initial"
          exit="exit"
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#07170D] text-[#FAFAF5] overflow-hidden"
        >
          {/* Background SVG Noise Texture */}
          <div 
            className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035] mix-blend-overlay"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
          />

          {/* Huge Staggered Background Typography Reveal */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.06]">
            <h1 className="text-[20vw] md:text-[25vw] font-black tracking-tighter leading-none flex">
              {backgroundWord.split("").map((letter, i) => (
                <div key={i} className="overflow-hidden">
                  <motion.span
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: i * 0.05 }}
                    className="inline-block"
                  >
                    {letter}
                  </motion.span>
                </div>
              ))}
            </h1>
          </div>

          {/* Central Counter & Progress */}
          <div className="relative z-10 flex flex-col items-center">
            
            {/* The Counter */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex items-baseline gap-2 mb-8"
            >
              <span className="text-7xl md:text-[9rem] font-serif font-black tracking-tighter text-[#10B981] tabular-nums">
                {counter}
              </span>
              <span className="text-2xl md:text-4xl font-bold text-white/40 mb-2 md:mb-6">%</span>
            </motion.div>

            {/* Progress Bar Line */}
            <div className="w-64 md:w-96 h-[2px] bg-white/10 rounded-full overflow-hidden relative">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#10B981] to-[#BBF7D0]"
                initial={{ width: "0%" }}
                animate={{ width: `${counter}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="mt-6 text-[10px] font-mono tracking-[0.3em] uppercase text-[#10B981]/70"
            >
              Curating Local Harvest...
            </motion.p>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
