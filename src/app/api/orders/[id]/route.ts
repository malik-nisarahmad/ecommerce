export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { normalizeError, jsonError, jsonResponse } from "@/lib/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const order = await prisma.order.findFirst({
      where: { id, userId: user.userId },
      include: { items: true },
    });
    if (!order) {
      return jsonError("Order not found", 404);
    }
    return jsonResponse({ order });
  } catch (error) {
    return normalizeError(error);
  }
}

