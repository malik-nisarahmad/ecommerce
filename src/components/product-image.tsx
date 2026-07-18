"use client";

import { useState } from "react";

const FALLBACK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" fill="none">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f4f1ea" />
      <stop offset="100%" stop-color="#e4efe6" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" rx="36" fill="url(#g)" />
  <circle cx="610" cy="140" r="92" fill="#c9e3d3" opacity="0.6" />
  <circle cx="190" cy="430" r="130" fill="#d9e8d6" opacity="0.8" />
  <path d="M235 360h330c24 0 43 19 43 43v60c0 24-19 43-43 43H235c-24 0-43-19-43-43v-60c0-24 19-43 43-43Z" fill="#ffffff" stroke="#b9ccb8" stroke-width="10"/>
  <path d="M285 336c0-62 50-112 112-112s112 50 112 112" stroke="#8fb095" stroke-width="18" stroke-linecap="round"/>
  <path d="M330 355c18 18 42 28 67 28s49-10 67-28" stroke="#9aa68f" stroke-width="16" stroke-linecap="round"/>
  <text x="400" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#6a7a63">FreshLane</text>
</svg>`;

const FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(FALLBACK_SVG)}`;

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

export function ProductImage({ src, alt, className }: ProductImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src?.trim() || FALLBACK_IMAGE);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Shimmer skeleton placeholder */}
      {!loaded && (
        <div
          className="absolute inset-0 animate-shimmer"
          style={{ borderRadius: "inherit" }}
        />
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`${className ?? ""} transition-all duration-500 ${
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (currentSrc !== FALLBACK_IMAGE) {
            setCurrentSrc(FALLBACK_IMAGE);
          }
        }}
      />
    </div>
  );
}
