export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { parseJsonBody, normalizeError, jsonResponse, jsonError } from "@/lib/http";
import { checkoutSchema } from "@/lib/validators";
import { placeOrderFromCart } from "@/lib/checkout-service";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { applyRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import Stripe from "stripe";

const stripe = new Stripe(env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2024-06-20" as any,
});

export async function POST(request: Request): Promise<Response> {
  const rate = applyRateLimit(`checkout:${request.headers.get("x-forwarded-for") ?? "local"}`);
  if (!rate.ok) {
    return jsonError("Too many checkout attempts", 429, { retryAfterMs: rate.retryAfterMs });
  }

  try {
    const user = await requireSessionUser();
    const body = await parseJsonBody<unknown>(request);
    const parsed = checkoutSchema.parse(body);

    // 1. Fetch current cart to validate stock before changing database state
    const cart = await prisma.cart.findUnique({
      where: { userId: user.userId },
    });

    if (!cart || cart.items.length === 0) {
      return jsonError("Your cart is empty", 400);
    }

    // Precise stock validation before ordering
    for (const item of cart.items) {
      const product = item.product;
      if (!product || !product.isActive) {
        return jsonError(`Sorry, "${product?.name || "Product"}" is no longer available.`, 400);
      }
      if (product.stock < item.quantity) {
        if (product.stock === 0) {
          return jsonError(`Sorry, "${product.name}" has just sold out! Please remove it from your cart to proceed.`, 400);
        }
        return jsonError(`Sorry, "${product.name}" only has ${product.stock} units left in stock, but you have ${item.quantity} in your cart. Please reduce the quantity.`, 400);
      }
    }

    // 2. Place Order (starts as PENDING_PAYMENT, reserves stock, clears cart)
    const result = await placeOrderFromCart({
      prismaClient: prisma,
      userId: user.userId,
      addressId: parsed.addressId,
      deliverySlotStart: parsed.deliverySlotStart ? new Date(parsed.deliverySlotStart) : undefined,
      deliverySlotEnd: parsed.deliverySlotEnd ? new Date(parsed.deliverySlotEnd) : undefined,
    });

    const userInfo = await prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { email: true, name: true },
    });

    // 3. Handle Mock / Simulated Payments (Credit Card sandbox or PayPal sandbox)
    const isMockPayment = parsed.paymentMethod === "STRIPE_CARD_MOCK" || parsed.paymentMethod === "PAYPAL_MOCK" || !env.STRIPE_SECRET_KEY;

    if (isMockPayment) {
      // Mark the order as paid and confirmed
      await prisma.order.update({
        where: { id: result.orderId },
        data: {
          status: "CONFIRMED",
          paymentStatus: "SUCCEEDED",
        },
      });

      // Send mock confirmation email (runs gracefully in email.ts)
      await sendOrderConfirmationEmail({
        to: userInfo.email,
        customerName: userInfo.name,
        orderId: result.orderId,
        totalCents: result.totalCents,
      }).catch((err) => {
        console.error("Email failed but checkout succeeded:", err);
      });

      return jsonResponse({
        ok: true,
        orderId: result.orderId,
        checkoutUrl: `/checkout/success?orderId=${result.orderId}&mock=true`,
      });
    }

    // 4. Handle Real Stripe Checkout Session (if env key present)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userInfo.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `FreshLane Order ${result.orderId.slice(0, 8)}`,
              description: "Farm-fresh groceries delivery",
            },
            unit_amount: result.totalCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: result.orderId,
      },
      success_url: `${env.APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${result.orderId}`,
      cancel_url: `${env.APP_URL}/checkout/cancel?orderId=${result.orderId}`,
    });

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: result.orderId },
      data: {
        stripeSessionId: session.id,
      },
    });

    return jsonResponse({
      ok: true,
      orderId: result.orderId,
      checkoutUrl: session.url,
    });
  } catch (error) {
    return normalizeError(error);
  }
}

