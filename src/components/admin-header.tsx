"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AdminHeader({ userName }: { userName: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(27, 94, 32, 0.08)",
          boxShadow: scrolled ? "0 4px 20px rgba(0, 0, 0, 0.05)" : "none",
        }}
      >
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-5 py-3.5">
          {/* Logo & Branding */}
          <Link href="/admin" className="group flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#1B5E20] to-[#4CAF50] shadow-[0_4px_10px_rgba(76,175,80,0.3)] transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_6px_15px_rgba(76,175,80,0.4)]">
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                <path
                  d="M14 2C14 2 24 6 24 16C24 22 19.5 26 14 26C8.5 26 4 22 4 16C4 6 14 2 14 2Z"
                  fill="url(#leaf-gradient)"
                />
                <path
                  d="M14 8V22M14 14C14 14 10 12 8 16M14 18C14 18 18 16 20 12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="leaf-gradient" x1="4" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#A7F3D0" />
                    <stop offset="1" stopColor="#34D399" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight leading-tight text-slate-900">
                Fresh<span style={{ color: "#4CAF50" }}>Lane</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B5E20]">
                Admin Panel
              </span>
            </div>
          </Link>

          {/* Admin Nav */}
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 hover:bg-[#4CAF50]/10 hover:text-[#1B5E20] text-slate-600"
            >
              Storefront ↗
            </Link>
            
            <div className="w-px h-6 mx-2 bg-slate-200" />
            
            <div className="flex items-center gap-3 pl-3 pr-1.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 shadow-sm">
              <span className="text-sm font-bold text-slate-800">
                {userName}
              </span>
              <button
                className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer transition-all duration-300 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white shadow-sm"
                title="Logout"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </header>
      {/* Spacer */}
      <div className="h-20" />
    </>
  );
}
