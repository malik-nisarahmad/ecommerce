export const dynamic = "force-dynamic";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { jsonError, jsonResponse, normalizeError } from "@/lib/http";

export async function POST(request: Request): Promise<Response> {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return jsonError("Stripe webhook secret is not configured", 500);
  }

  try {
    const stripe = getStripe();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return jsonError("Missing Stripe signature", 400);
    }

    const rawBody = await request.text();
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );

    const payloadHash = createHash("sha256").update(rawBody).digest("hex");

    const alreadyProcessed = await prisma.processedWebhookEvent.findUnique({
      where: { eventId: event.id },
      select: { id: true },
    });
    if (alreadyProcessed) {
      return jsonResponse({ ok: true, duplicate: true });
    }

    await prisma.$transaction(async (tx: typeof prisma) => {
      await tx.processedWebhookEvent.create({
        data: {
          provider: "stripe",
          eventId: event.id,
          payloadHash,
        },
      });

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        if (!orderId) {
          throw new Error("Missing orderId in Stripe metadata");
        }
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "SUCCEEDED",
            status: "CONFIRMED",
          },
        });
      }
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    return normalizeError(error);
  }
}


