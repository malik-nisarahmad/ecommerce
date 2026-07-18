import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { parseJsonBody, normalizeError, jsonResponse, jsonError } from "@/lib/http";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { z } from "zod";

const schema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireSessionUser();
    const body = await parseJsonBody<unknown>(request);
    const parsed = schema.parse(body);

    const order = await prisma.order.findFirst({
      where: { id: parsed.orderId, userId: user.userId },
      include: { items: true },
    });
    if (!order) {
      return jsonError("Order not found", 404);
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${env.APP_URL}/checkout/success?orderId=${order.id}`,
      cancel_url: `${env.APP_URL}/checkout/cancel?orderId=${order.id}`,
      customer_email: user.email,
      metadata: {
        orderId: order.id,
        userId: user.userId,
      },
      line_items: order.items.map((item: { quantity: number; unitPriceCents: number; productName: string }) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: item.unitPriceCents,
          product_data: {
            name: item.productName,
          },
        },
      })),
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: session.id,
      },
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    return normalizeError(error);
  }
}

