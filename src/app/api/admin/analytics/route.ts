export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";
import { normalizeError, jsonResponse } from "@/lib/http";

export async function GET(): Promise<Response> {
  try {
    await requireAdminUser();
    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const [dailyOrders, dailyRevenue, topProducts] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
        _sum: { totalCents: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productId", "productName"],
        _sum: { quantity: true, lineTotalCents: true },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 5,
      }),
    ]);

    return jsonResponse({
      dailyOrders,
      dailyRevenueCents: dailyRevenue._sum.totalCents ?? 0,
      topProducts,
    });
  } catch (error) {
    return normalizeError(error);
  }
}


