import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "FreshLane Grocers — Farm-Fresh Groceries Delivered",
  description:
    "Shop farm-fresh fruits, vegetables, dairy, bakery items, and more. Same-day delivery with a freshness guarantee. Browse our curated selection of premium groceries.",
  keywords: [
    "grocery delivery",
    "fresh produce",
    "organic food",
    "online grocery",
    "same-day delivery",
    "farm fresh",
  ],
};

import { SiteFooter } from "@/components/site-footer";
import { Preloader } from "@/components/preloader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased overflow-x-hidden">
        <Preloader />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
