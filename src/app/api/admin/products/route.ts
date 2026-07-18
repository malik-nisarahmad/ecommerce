export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";
import { parseJsonBody, normalizeError, jsonResponse } from "@/lib/http";
import { productSchema } from "@/lib/validators";

export async function GET(): Promise<Response> {
  try {
    await requireAdminUser();
    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return jsonResponse({ products });
  } catch (error) {
    return normalizeError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await requireAdminUser();
    const body = await parseJsonBody<unknown>(request);
    const parsed = productSchema.parse(body);
    const product = await prisma.product.create({
      data: {
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description,
        categoryId: parsed.categoryId,
        priceCents: parsed.priceCents,
        unit: parsed.unit,
        stock: parsed.stock,
        lowStockThreshold: parsed.lowStockThreshold,
        images:
          parsed.imageUrl && parsed.imageAlt
            ? {
                create: {
                  url: parsed.imageUrl,
                  alt: parsed.imageAlt,
                  sortOrder: 0,
                },
              }
            : undefined,
      },
      include: { images: true },
    });
    return jsonResponse({ product }, 201);
  } catch (error) {
    return normalizeError(error);
  }
}


