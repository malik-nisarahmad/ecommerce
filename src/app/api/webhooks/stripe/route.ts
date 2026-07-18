import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendOrderConfirmationEmail } from "@/lib/email";
import Stripe from "stripe";

const stripe = new Stripe(env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2024-06-20" as any,
});

export async function POST(request: Request): Promise<Response> {
  const body = await request.text();
  const signature = (await headers()).get("Stripe-Signature");

  if (!signature) {
    return new Response("No signature found", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.error("No orderId found in session metadata");
      return new Response("Missing orderId", { status: 400 });
    }

    try {
      // Mark the order as paid
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "SUCCEEDED" },
      });

      // Fetch user separately since our db layer doesn't support include on update
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: order.userId },
        select: { email: true, name: true },
      });

      // Send confirmation email via Nodemailer
      await sendOrderConfirmationEmail({
        to: user.email,
        customerName: user.name,
        orderId: order.id,
        totalCents: order.totalCents,
      });

    } catch (error) {
      console.error("Error processing successful checkout:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  return new Response("Webhook processed successfully", { status: 200 });
}
