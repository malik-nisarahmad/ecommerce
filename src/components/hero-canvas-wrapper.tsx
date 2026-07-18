"use client";

import dynamic from "next/dynamic";

// Dynamically import the WebGL Hero canvas component with SSR disabled
export const HeroCanvasWrapper = dynamic(
  () => import("./hero-canvas").then((mod) => mod.HeroCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center text-[#BBF7D0]">
        <svg className="animate-spin h-8 w-8 text-[#BBF7D0] mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-xs font-bold tracking-widest uppercase opacity-70">Initializing 3D Specimen…</p>
      </div>
    ),
  }
);
