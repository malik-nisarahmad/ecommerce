export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";
import { parseJsonBody, normalizeError, jsonResponse } from "@/lib/http";
import { bulkStockAdjustmentSchema } from "@/lib/validators";
import { publishRealtimeEvent } from "@/lib/realtime";

export async function POST(request: Request): Promise<Response> {
  try {
    await requireAdminUser();
    const body = await parseJsonBody<unknown>(request);
    const parsed = bulkStockAdjustmentSchema.parse(body);

    const updated = await prisma.$transaction(
      parsed.adjustments.map((adjustment) =>
        prisma.product.update({
          where: { id: adjustment.productId },
          data: {
            stock: {
              increment: adjustment.delta,
            },
          },
          select: { id: true, stock: true, lowStockThreshold: true, name: true, updatedAt: true },
        }),
      ),
    );

    for (const product of updated) {
      publishRealtimeEvent({
        type: "stock.updated",
        productId: product.id,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        updatedAt: product.updatedAt.toISOString(),
      });
      if (product.stock <= product.lowStockThreshold) {
        publishRealtimeEvent({
          type: "stock.low",
          productId: product.id,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
          productName: product.name,
          updatedAt: product.updatedAt.toISOString(),
        });
      }
    }

    return jsonResponse({ updated });
  } catch (error) {
    return normalizeError(error);
  }
}


