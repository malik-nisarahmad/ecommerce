import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { normalizeError, jsonResponse } from "@/lib/http";

export async function GET(): Promise<Response> {
  try {
    const user = await requireSessionUser();
    const orders = await prisma.order.findMany({
      where: { userId: user.userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return jsonResponse({ orders });
  } catch (error) {
    return normalizeError(error);
  }
}

