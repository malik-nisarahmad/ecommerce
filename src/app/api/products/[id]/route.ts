export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { jsonError, jsonResponse, normalizeError } from "@/lib/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!product || !product.isActive) {
      return jsonError("Product not found", 404);
    }

    return jsonResponse({ product });
  } catch (error) {
    return normalizeError(error);
  }
}

