import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";
import { parseJsonBody, normalizeError, jsonResponse } from "@/lib/http";
import { orderStatusSchema } from "@/lib/validators";
import { publishRealtimeEvent } from "@/lib/realtime";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const body = await parseJsonBody<unknown>(request);
    const parsed = orderStatusSchema.parse(body);
    const order = await prisma.order.update({
      where: { id },
      data: { status: parsed.status },
    });
    publishRealtimeEvent({
      type: "order.status.updated",
      orderId: order.id,
      status: order.status,
      updatedAt: order.updatedAt.toISOString(),
    });
    return jsonResponse({ order });
  } catch (error) {
    return normalizeError(error);
  }
}

