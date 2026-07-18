export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { catalogQuerySchema } from "@/lib/validators";
import { normalizeError, jsonResponse } from "@/lib/http";

function buildSort(sort: "price_asc" | "price_desc" | "newest" | "popularity_desc") {
  switch (sort) {
    case "price_asc":
      return [{ priceCents: "asc" as const }];
    case "price_desc":
      return [{ priceCents: "desc" as const }];
    case "popularity_desc":
      return [{ popularityScore: "desc" as const }, { createdAt: "desc" as const }];
    default:
      return [{ createdAt: "desc" as const }];
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const parsed = catalogQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const where = {
      isActive: true,
      ...(parsed.search
        ? {
            OR: [
              { name: { contains: parsed.search, mode: "insensitive" as const } },
              { description: { contains: parsed.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(parsed.category ? { category: { slug: parsed.category } } : {}),
      ...(parsed.inStockOnly === "true" ? { stock: { gt: 0 } } : {}),
      ...(parsed.minPrice !== undefined || parsed.maxPrice !== undefined
        ? {
            priceCents: {
              ...(parsed.minPrice !== undefined ? { gte: parsed.minPrice } : {}),
              ...(parsed.maxPrice !== undefined ? { lte: parsed.maxPrice } : {}),
            },
          }
        : {}),
    };

    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: buildSort(parsed.sort),
        skip: (parsed.page - 1) * parsed.pageSize,
        take: parsed.pageSize,
        include: {
          category: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      }),
    ]);

    return jsonResponse({
      page: parsed.page,
      pageSize: parsed.pageSize,
      total,
      products,
    });
  } catch (error) {
    return normalizeError(error);
  }
}


