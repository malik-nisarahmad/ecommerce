"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "CUSTOMER";
};

function LeafLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-transform duration-500 group-hover:rotate-12"
    >
      <path
        d="M14 2C14 2 24 6 24 16C24 22 19.5 26 14 26C8.5 26 4 22 4 16C4 6 14 2 14 2Z"
        fill="url(#leaf-gradient-header)"
      />
      <path
        d="M14 8V22M14 14C14 14 10 12 8 16M14 18C14 18 18 16 20 12"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <defs>
        <linearGradient id="leaf-gradient-header" x1="4" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A7F3D0" />
          <stop offset="1" stopColor="#1B5E20" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function SiteHeader() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const pathname = usePathname();

  const loadCartCount = useCallback(async (isLogged: boolean) => {
    if (isLogged) {
      try {
        const cartRes = await fetch("/api/cart");
        if (cartRes.ok) {
          const cartData = await cartRes.json();
          const count = cartData.cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) ?? 0;
          setCartCount(count);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      const raw = localStorage.getItem("freshlane_guest_cart");
      if (raw) {
        try {
          const guestCart = JSON.parse(raw);
          const count = Object.values(guestCart).reduce((sum: number, qty: any) => sum + Number(qty), 0) ?? 0;
          setCartCount(count);
        } catch {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        setUser(null);
        void loadCartCount(false);
        return;
      }
      const payload: { user: SessionUser | null } = await response.json();
      setUser(payload.user);
      void loadCartCount(Boolean(payload.user));
    } catch (e) {
      setUser(null);
      void loadCartCount(false);
    }
  }, [loadCartCount]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    const handleCartUpdate = () => {
      void loadCartCount(Boolean(user));
    };
    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, [user, loadCartCount]);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const userInitials = useMemo(() => {
    if (!user?.name) return "";
    return user.name
      .split(" ")
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user]);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
  ];

  return (
    <>
      {/* Floating Centered Menu Dock */}
      <div className="fixed top-3 sm:top-4 left-0 right-0 z-50 w-full px-3 sm:px-6 flex justify-center pointer-events-none">
        <header
          className="w-full max-w-5xl rounded-full border px-4 sm:px-6 py-2.5 flex items-center justify-between pointer-events-auto backdrop-blur-2xl transition-[background-color,border-color,box-shadow] duration-500"
          style={{
            backgroundColor: scrolled
              ? "rgba(250, 250, 245, 0.88)"
              : "rgba(250, 250, 245, 0.65)",
            borderColor: scrolled
              ? "rgba(27, 94, 32, 0.12)"
              : "rgba(27, 94, 32, 0.06)",
            boxShadow: scrolled
              ? "0 10px 30px -10px rgba(27, 94, 32, 0.08), 0 1px 3px rgba(27, 94, 32, 0.02)"
              : "0 4px 20px -10px rgba(0, 0, 0, 0.02)",
          }}
        >
          {/* Logo */}
          <Link 
            href="/" 
            className="group flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20]/40 focus-visible:ring-offset-2 rounded-full p-0.5"
            aria-label="FreshLane Home"
          >
            <div className="p-1 rounded-full bg-green-50/80 group-hover:bg-green-100 transition-[background-color] duration-300">
              <LeafLogo />
            </div>
            <span className="text-lg font-black tracking-tight leading-none text-slate-900 pr-1">
              Fresh<span style={{ color: "#1B5E20" }}>Lane</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 relative">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`relative px-4 py-2 text-sm font-extrabold rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20]/40 transition-[color] duration-300 ${
                    isActive ? "text-[#1B5E20]" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {/* Sliding hover pill indicator */}
                  {hoveredIndex === index && (
                    <motion.span
                      layoutId="navHoverPill"
                      className="absolute inset-0 bg-slate-200/50 rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 350, damping: 26 }}
                    />
                  )}
                  {/* Active background fallback when not hovered */}
                  {isActive && hoveredIndex !== index && (
                    <span className="absolute inset-0 bg-[#1B5E20]/5 border border-[#1B5E20]/10 rounded-full -z-10 animate-fade-in" />
                  )}
                  {item.label}
                </Link>
              );
            })}

            {/* Cart Button with sliding indicators */}
            <Link
              href="/cart"
              onMouseEnter={() => setHoveredIndex(navItems.length)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`relative flex items-center gap-1.5 px-4.5 py-2 text-sm font-extrabold rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20]/40 transition-[color] duration-300 ${
                pathname === "/cart" ? "text-[#1B5E20]" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {hoveredIndex === navItems.length && (
                <motion.span
                  layoutId="navHoverPill"
                  className="absolute inset-0 bg-slate-200/50 rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 26 }}
                />
              )}
              {pathname === "/cart" && hoveredIndex !== navItems.length && (
                <span className="absolute inset-0 bg-[#1B5E20]/5 border border-[#1B5E20]/10 rounded-full -z-10" />
              )}
              
              <div className="relative flex items-center">
                <CartIcon />
                {cartCount > 0 && (
                  <span 
                    className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#1B5E20] text-[9px] font-black text-white shadow-sm border border-[#FAFAF5] font-variant-numeric: tabular-nums"
                  >
                    {cartCount}
                  </span>
                )}
              </div>
              Cart
            </Link>

            <div className="w-px h-4 mx-2 bg-slate-200" />

            {/* User Login/Dropdown Area */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  aria-expanded={showDropdown}
                  className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 bg-white border border-slate-200/60 rounded-full shadow-sm hover:shadow-md hover:border-slate-300 transition-[box-shadow,border-color] duration-300 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20]/40"
                >
                  <span className="text-xs font-extrabold text-slate-700 max-w-[90px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1B5E20] to-[#4CAF50] text-white flex items-center justify-center text-[10px] font-black shadow-inner">
                    {userInitials}
                  </div>
                </button>

                {/* Account dropdown */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-2 shadow-xl origin-top-right z-50"
                    >
                      <div className="px-3.5 py-2.5 border-b border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account</p>
                        <p className="text-sm font-extrabold text-slate-800 truncate mt-0.5">{user.name}</p>
                        <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">{user.email}</p>
                      </div>

                      <div className="py-1.5 space-y-0.5">
                        <Link
                          href="/account/orders"
                          className="flex w-full items-center px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-[background-color,color] duration-200 outline-none focus-visible:bg-slate-50"
                        >
                          📦 Order History
                        </Link>
                        {user.role === "ADMIN" && (
                          <Link
                            href="/admin"
                            className="flex w-full items-center px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-[background-color,color] duration-200 outline-none focus-visible:bg-slate-50"
                          >
                            ⚙️ Admin Panel
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1.5 mt-1">
                        <button
                          onClick={async () => {
                            await fetch("/api/auth/logout", { method: "POST" });
                            window.location.href = "/";
                          }}
                          className="flex w-full items-center px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-[background-color] duration-200 cursor-pointer text-left outline-none focus-visible:bg-red-50"
                        >
                          🚪 Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-4.5 py-2 text-sm font-extrabold rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20]/40 transition-[background-color,color] duration-300"
                >
                  <UserIcon />
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[#1B5E20] px-5 py-2 text-xs font-bold text-white hover:bg-[#134416] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B5E20] transition-[background-color,box-shadow] duration-300 shadow-sm hover:shadow-md"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Toggle Button */}
          <button
            className="md:hidden p-2 rounded-full cursor-pointer hover:bg-slate-100 transition-[background-color] duration-300 text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </header>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 md:hidden bg-black/30 backdrop-blur-sm"
            />

            {/* Sidebar drawer content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-72 p-6 flex flex-col justify-between z-50 bg-white/95 backdrop-blur-xl border-l border-slate-200/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <LeafLogo />
                    <span className="text-base font-black text-slate-900">
                      Fresh<span style={{ color: "#1B5E20" }}>Lane</span>
                    </span>
                  </div>
                  <button
                    className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-slate-600 transition-[background-color,color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20]"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <nav className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1">Navigation</span>
                  {[
                    { href: "/", label: "Home" },
                    { href: "/products", label: "Products" },
                    { href: "/cart", label: `Cart${cartCount > 0 ? ` (${cartCount})` : ""}` },
                  ].map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`px-4 py-3 text-sm font-bold rounded-xl transition-[background-color,color] duration-300 outline-none focus-visible:bg-slate-50 ${
                          isActive
                            ? "bg-[#1B5E20]/5 text-[#1B5E20] border border-[#1B5E20]/10 shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    );
                  })}

                  {user && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1">User Account</span>
                      <Link
                        href="/account/orders"
                        className={`px-4 py-3 text-sm font-bold rounded-xl transition-[background-color,color] duration-300 outline-none focus-visible:bg-slate-50 ${
                          pathname === "/account/orders"
                            ? "bg-[#1B5E20]/5 text-[#1B5E20]"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        Order History
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          className={`px-4 py-3 text-sm font-bold rounded-xl transition-[background-color,color] duration-300 outline-none focus-visible:bg-slate-50 ${
                            pathname === "/admin"
                              ? "bg-[#1B5E20]/5 text-[#1B5E20]"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                          onClick={() => setMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                    </div>
                  )}
                </nav>
              </div>

              {/* Profile Card Footer */}
              <div className="border-t border-slate-100 pt-4 mt-auto">
                {user ? (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1B5E20] to-[#4CAF50] text-white flex items-center justify-center text-xs font-black shadow-md shrink-0">
                        {userInitials}
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-xs font-extrabold text-slate-800 truncate leading-tight">{user.name}</p>
                        <p className="text-[10px] font-medium text-slate-500 truncate leading-none mt-1">{user.email}</p>
                      </div>
                    </div>
                    <button
                      className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors cursor-pointer text-center outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        window.location.href = "/";
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      className="w-full text-center py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 text-xs shadow-sm transition-[background-color,border-color] outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20]"
                      onClick={() => setMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="w-full text-center py-2.5 rounded-xl bg-[#1B5E20] text-white font-bold text-xs hover:bg-[#134416] transition-all shadow-md outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20]"
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-16 sm:h-20" />
    </>
  );
}
