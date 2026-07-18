import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { CatalogClient } from "@/components/catalog-client";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      take: 12,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return (
    <div style={{ background: "#FAFAF5" }} className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-5 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold" style={{ color: "#1A1A1A" }}>
            All Products
          </h1>
          <p className="mt-2 text-base" style={{ color: "#6B7280" }}>
            Browse our entire catalog of fresh groceries, pantry staples, and more.
          </p>
        </div>
        <CatalogClient initialProducts={products} categories={categories} />
      </main>
    </div>
  );
}
