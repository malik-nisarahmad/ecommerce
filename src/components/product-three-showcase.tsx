"use client";

import dynamic from "next/dynamic";

type Product = {
  id: string;
  name: string;
  priceCents: number;
  unit: string;
  stock: number;
  description: string;
  images: Array<{ url: string; alt: string }>;
};

type Props = {
  products: Product[];
};

// Dynamically import the WebGL canvas component with SSR disabled
export const ProductThreeShowcase = dynamic(
  () => import("./product-three-canvas").then((mod) => mod.ProductThreeCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-[#FAFAF5] flex flex-col items-center justify-center text-slate-500">
        <svg className="animate-spin h-8 w-8 text-[#1B5E20] mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm font-semibold tracking-wide">Loading 3D Grocery Showcase…</p>
      </div>
    ),
  }
);
