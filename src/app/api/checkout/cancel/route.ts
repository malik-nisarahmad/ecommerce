import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { parseJsonBody, normalizeError, jsonResponse } from "@/lib/http";
import { cancelOrderAndRestoreCart } from "@/lib/checkout-service";
import { z } from "zod";

const cancelSchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireSessionUser();
    const body = await parseJsonBody<unknown>(request);
    const parsed = cancelSchema.parse(body);

    await cancelOrderAndRestoreCart({
      prismaClient: prisma,
      orderId: parsed.orderId,
      userId: user.userId,
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    return normalizeError(error);
  }
}
