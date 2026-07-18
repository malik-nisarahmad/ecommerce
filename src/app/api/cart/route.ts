import { prisma } from "@/lib/db";
import { getOrCreateCart } from "@/lib/cart";
import { requireSessionUser } from "@/lib/auth";
import { normalizeError, parseJsonBody, jsonResponse, jsonError } from "@/lib/http";
import { upsertCartItemSchema } from "@/lib/validators";
import { calculateTotals } from "@/lib/pricing";

export async function GET(): Promise<Response> {
  try {
    const user = await requireSessionUser();
    const cart = await getOrCreateCart(user.userId);

    const subtotalCents = cart.items.reduce(
      (sum: number, item: { quantity: number; product: { priceCents: number } }) =>
        sum + item.quantity * item.product.priceCents,
      0,
    );
    const totals = calculateTotals(subtotalCents);

    return jsonResponse({
      cart,
      totals,
    });
  } catch (error) {
    return normalizeError(error);
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const user = await requireSessionUser();
    const body = await parseJsonBody<unknown>(request);
    const parsed = upsertCartItemSchema.parse(body);
    const cart = await getOrCreateCart(user.userId);

    if (parsed.quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId: parsed.productId },
      });
      return jsonResponse({ ok: true });
    }

    const product = await prisma.product.findUnique({
      where: { id: parsed.productId },
      select: { id: true, stock: true, isActive: true },
    });
    if (!product || !product.isActive) {
      return jsonError("Product not found", 404);
    }
    if (product.stock < parsed.quantity) {
      return jsonError("Requested quantity exceeds available stock", 409);
    }

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: parsed.productId } },
      update: { quantity: parsed.quantity },
      create: { cartId: cart.id, productId: parsed.productId, quantity: parsed.quantity },
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    return normalizeError(error);
  }
}

