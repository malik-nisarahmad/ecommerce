"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/pricing";
import { ProductImage } from "@/components/product-image";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  unit: string;
  stock: number;
  images: Array<{ url: string; alt: string }>;
  category: Category;
};

type Props = {
  initialProducts: Product[];
  categories: Category[];
};

function readGuestCart(): Record<string, number> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem("freshlane_guest_cart");
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function writeGuestCart(cart: Record<string, number>): void {
  localStorage.setItem("freshlane_guest_cart", JSON.stringify(cart));
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CartPlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function CatalogClient({ initialProducts, categories }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "12",
      sort,
    });
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    return params.toString();
  }, [category, page, search, sort]);

  const reload = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/catalog?${query}`);
    const payload: { products: Product[] } = await response.json();
    setProducts(payload.products);
    setLoading(false);
  }, [query]);

  const addToCart = useCallback(async (productId: string) => {
    setMessage(null);
    setAddingId(productId);
    const meRes = await fetch("/api/auth/me", { cache: "no-store" });
    const me = (await meRes.json()) as { user: { id: string } | null };

    if (me.user) {
      const result = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (!result.ok) {
        const errorPayload: { error?: string } = await result.json();
        setMessage(errorPayload.error ?? "Could not add item to cart.");
        setAddingId(null);
        return;
      }
      window.dispatchEvent(new Event("cart-updated"));
      setMessage("Item added to cart.");
      setTimeout(() => setAddingId(null), 800);
      return;
    }

    const cart = readGuestCart();
    cart[productId] = (cart[productId] ?? 0) + 1;
    writeGuestCart(cart);
    window.dispatchEvent(new Event("cart-updated"));
    setMessage("Item added to guest cart.");
    setTimeout(() => setAddingId(null), 800);
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Filter Bar ── */}
      <div
        className="p-4 md:p-5"
        style={{
          background: "#FFFFFF",
          borderRadius: "var(--radius-xl)",
          border: "1px solid #F0F0EA",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        {/* Search Input */}
        <div className="relative mb-4">
          <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }}>
            <SearchIcon />
          </div>
          <input
            className="input !pl-11"
            placeholder="Search for fresh groceries..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setPage(1);
                void reload();
              }
            }}
          />
        </div>

        {/* Category Pills + Sort */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="px-4 py-2 text-sm font-medium rounded-full cursor-pointer transition-all duration-200"
            style={{
              background: category === "" ? "#1B5E20" : "transparent",
              color: category === "" ? "#FFFFFF" : "#6B7280",
              border: category === "" ? "none" : "1.5px solid #E8E8E0",
            }}
            onClick={() => {
              setCategory("");
              setPage(1);
              void reload();
            }}
          >
            All
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              className="px-4 py-2 text-sm font-medium rounded-full cursor-pointer transition-all duration-200"
              style={{
                background: category === item.slug ? "#1B5E20" : "transparent",
                color: category === item.slug ? "#FFFFFF" : "#6B7280",
                border: category === item.slug ? "none" : "1.5px solid #E8E8E0",
              }}
              onClick={() => {
                setCategory(item.slug);
                setPage(1);
                void reload();
              }}
            >
              {item.name}
            </button>
          ))}

          {/* Sort Dropdown */}
          <div className="ml-auto flex items-center gap-2">
            <span style={{ color: "#9CA3AF" }}>
              <SortIcon />
            </span>
            <select
              className="px-3 py-2 text-sm rounded-lg cursor-pointer appearance-none pr-8"
              style={{
                background: "#FAFAF5",
                border: "1.5px solid #E8E8E0",
                color: "#374151",
                borderRadius: "var(--radius-md)",
              }}
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
                void reload();
              }}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="popularity_desc">Popularity</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Status Messages ── */}
      {message ? (
        <div
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium animate-fade-in-down"
          style={{
            background: "rgba(22, 163, 74, 0.08)",
            color: "#16A34A",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(22, 163, 74, 0.15)",
          }}
        >
          <CheckIcon />
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <div
            className="w-8 h-8 rounded-full border-3 animate-spin"
            style={{
              borderColor: "#E8E8E0",
              borderTopColor: "#1B5E20",
              borderWidth: "3px",
            }}
          />
        </div>
      ) : null}

      {/* ── Product Grid ── */}
      {products.length === 0 && !loading ? (
        <div
          className="text-center py-16"
          style={{
            background: "#FFFFFF",
            borderRadius: "var(--radius-xl)",
            border: "1px solid #F0F0EA",
          }}
        >
          <p className="text-lg font-medium" style={{ color: "#374151" }}>
            No products found
          </p>
          <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
            Try adjusting your filters or search terms
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <article
              key={product.id}
              className={`card overflow-hidden group animate-fade-in-up stagger-${Math.min(index + 1, 8)}`}
            >
              {/* Product Image */}
              <Link href={`/products/${product.id}`} className="block">
                <div className="relative h-48 w-full img-zoom" style={{ background: "#F5F5F0" }}>
                  <ProductImage
                    src={product.images[0]?.url}
                    alt={product.images[0]?.alt ?? product.name}
                    className="h-full w-full object-cover"
                  />
                  {/* Category Badge */}
                  <div
                    className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "var(--radius-full)",
                      color: "#1B5E20",
                    }}
                  >
                    {product.category.name}
                  </div>
                </div>
              </Link>

              {/* Product Details */}
              <div className="p-4">
                <Link href={`/products/${product.id}`} className="block group/link">
                  <h3
                    className="font-semibold text-base transition-colors duration-200 group-hover/link:text-[#1B5E20]"
                    style={{ color: "#1A1A1A" }}
                  >
                    {product.name}
                  </h3>
                </Link>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-lg font-bold" style={{ color: "#1B5E20" }}>
                    {formatCurrency(product.priceCents)}
                    <span className="text-xs font-normal ml-1" style={{ color: "#9CA3AF" }}>
                      / {product.unit.toLowerCase()}
                    </span>
                  </p>

                  {/* Stock Indicator */}
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: product.stock > 10 ? "#16A34A" : product.stock > 0 ? "#F59E0B" : "#DC2626",
                      }}
                    />
                    <span className="text-xs font-medium" style={{
                      color: product.stock > 10 ? "#16A34A" : product.stock > 0 ? "#F59E0B" : "#DC2626",
                    }}>
                      {product.stock > 10
                        ? "In stock"
                        : product.stock > 0
                          ? `${product.stock} left`
                          : "Out of stock"}
                    </span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  className="btn-cart mt-3"
                  onClick={() => void addToCart(product.id)}
                  disabled={product.stock <= 0}
                  style={
                    addingId === product.id
                      ? { background: "#16A34A" }
                      : undefined
                  }
                >
                  {addingId === product.id ? (
                    <>
                      <CheckIcon />
                      Added!
                    </>
                  ) : (
                    <>
                      <CartPlusIcon />
                      Add to cart
                    </>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      <div className="flex items-center justify-center gap-3 pt-4">
        <button
          className="px-5 py-2.5 text-sm font-medium rounded-full cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E8E8E0",
            color: "#374151",
          }}
          onClick={() => {
            const nextPage = Math.max(1, page - 1);
            setPage(nextPage);
            if (nextPage !== page) void reload();
          }}
          disabled={page <= 1}
        >
          ← Previous
        </button>
        <span
          className="px-4 py-2 text-sm font-semibold rounded-full"
          style={{ background: "#1B5E20", color: "#FFFFFF" }}
        >
          {page}
        </span>
        <button
          className="px-5 py-2.5 text-sm font-medium rounded-full cursor-pointer transition-all duration-200"
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E8E8E0",
            color: "#374151",
          }}
          onClick={() => {
            setPage(page + 1);
            void reload();
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
