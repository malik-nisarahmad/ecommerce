import { prisma } from "@/lib/db";
import HomeContent from "@/components/home-content"; // Adjust path if needed

export const dynamic = "force-dynamic";

function isDatabaseUnavailableError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.toLowerCase().includes("database") ||
    error.message.includes("P1001")
  );
}

/* ─── Database Unavailable State ─── */
function DatabaseUnavailableState() {
  return (
    <div style={{ background: "#FAFAF5" }} className="min-h-screen">
      {/* You can optionally import the SiteHeader here if you want it during downtime */}
      <main className="mx-auto w-full max-w-6xl px-5 py-12">
        <section
          className="px-8 py-10"
          style={{
            background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
          }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#92400E" }}>
            Service Notice
          </p>
          <h1 className="mt-3 text-2xl font-bold" style={{ color: "#1A1A1A" }}>
            FreshLane is temporarily offline
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: "#78716C" }}>
            We couldn&apos;t connect to the database right now, so the catalog
            can&apos;t load. Once your database is reachable again, refresh
            this page to continue.
          </p>
          <div
            className="mt-6 px-4 py-3 text-sm"
            style={{
              background: "rgba(255,255,255,0.7)",
              borderRadius: "var(--radius-md)",
              color: "#78716C",
              border: "1px solid rgba(245, 158, 11, 0.15)",
            }}
          >
            Check that your database server is running and that{" "}
            <span className="font-semibold" style={{ color: "#1A1A1A" }}>DATABASE_URL</span> is correct.
          </div>
        </section>
      </main>
    </div>
  );
}

/* ─── Page Entry ─── */
export default async function Home() {
  let products;
  let categories;

  try {
    [products, categories] = await Promise.all([
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
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return <DatabaseUnavailableState />;
    }
    throw error;
  }

  return <HomeContent products={products} categories={categories} />;
}