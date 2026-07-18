import { calculateTotals } from "@/lib/pricing";
import { publishRealtimeEvent } from "@/lib/realtime";
import { prisma } from "@/lib/db";

type CartItemRow = {
  productId: string;
  quantity: number;
  productName: string;
  unitPriceCents: number;
  unit: "KG" | "LB" | "PACK" | "EACH" | "LITER";
  stock: number;
  lowStockThreshold: number;
  imageUrl: string | null;
};

export async function placeOrderFromCart(input: {
  prismaClient: typeof prisma;
  userId: string;
  addressId: string;
  deliverySlotStart?: Date;
  deliverySlotEnd?: Date;
}): Promise<{ orderId: string; totalCents: number }> {
  const { prismaClient } = input;

  return prismaClient.$transaction(async (tx: typeof prisma) => {
    const cart = await tx.cart.findUnique({
        where: { userId: input.userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { sortOrder: "asc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

    if (!cart || cart.items.length === 0) {
      throw new Error("CART_EMPTY");
    }

    const address = await tx.address.findMany({
      where: {
        id: input.addressId,
        userId: input.userId,
      },
    });

    if (!address[0]) {
      throw new Error("ADDRESS_NOT_FOUND");
    }

    const cartRows: CartItemRow[] = cart.items.map((item: CartItemRow & { product: { name: string; priceCents: number; unit: CartItemRow["unit"]; stock: number; lowStockThreshold: number; images: { url: string }[] } }) => ({
        productId: item.productId,
        quantity: item.quantity,
        productName: item.product.name,
        unitPriceCents: item.product.priceCents,
        unit: item.product.unit,
        stock: item.product.stock,
        lowStockThreshold: item.product.lowStockThreshold,
        imageUrl: item.product.images[0]?.url ?? null,
      }));

    await reserveStockAtomically(tx, cartRows);

    const subtotalCents = cartRows.reduce((total, row) => total + row.unitPriceCents * row.quantity, 0);
    const totals = calculateTotals(subtotalCents);

    const order = await tx.order.create({
      data: {
        userId: input.userId,
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        deliveryFeeCents: totals.deliveryFeeCents,
        totalCents: totals.totalCents,
        addressSnapshot: {
          label: address[0].label,
          recipient: address[0].recipient,
          phone: address[0].phone,
          line1: address[0].line1,
          line2: address[0].line2,
          city: address[0].city,
          state: address[0].state,
          postalCode: address[0].postalCode,
          countryCode: address[0].countryCode,
        },
        deliverySlotStart: input.deliverySlotStart,
        deliverySlotEnd: input.deliverySlotEnd,
        items: {
          create: cartRows.map((row) => ({
            productId: row.productId,
            productName: row.productName,
            productImageUrl: row.imageUrl,
            unit: row.unit,
            quantity: row.quantity,
            unitPriceCents: row.unitPriceCents,
            lineTotalCents: row.quantity * row.unitPriceCents,
          })),
        },
      },
    });

    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    publishRealtimeEvent({
      type: "order.created",
      orderId: order.id,
      totalCents: order.totalCents,
      itemCount: cart.items.length,
      createdAt: order.createdAt.toISOString(),
    });

    for (const row of cartRows) {
      const updated = await tx.product.findUniqueOrThrow({
        where: { id: row.productId },
      });
      publishRealtimeEvent({
        type: "stock.updated",
        productId: updated.id,
        stock: updated.stock,
        lowStockThreshold: updated.lowStockThreshold,
        updatedAt: updated.updatedAt.toISOString(),
      });
      if (updated.stock <= updated.lowStockThreshold) {
        publishRealtimeEvent({
          type: "stock.low",
          productId: updated.id,
          stock: updated.stock,
          lowStockThreshold: updated.lowStockThreshold,
          productName: updated.name,
          updatedAt: updated.updatedAt.toISOString(),
        });
      }
    }

    return { orderId: order.id, totalCents: order.totalCents };
  });
}

type StockTransactionClient = typeof prisma;

export async function reserveStockAtomically(
  tx: StockTransactionClient,
  rows: ReadonlyArray<CartItemRow>,
): Promise<void> {
  for (const row of rows) {
    const changed = await tx.product.updateMany({
      where: {
        id: row.productId,
        stock: {
          gte: row.quantity,
        },
      },
      data: {
        stock: {
          decrement: row.quantity,
        },
        popularityScore: {
          increment: row.quantity,
        },
      },
    });

    if (changed.count !== 1) {
      throw new Error("INSUFFICIENT_STOCK");
    }
  }
}

export async function cancelOrderAndRestoreCart(input: {
  prismaClient: typeof prisma;
  orderId: string;
  userId: string;
}): Promise<void> {
  const { prismaClient, orderId, userId } = input;

  await prismaClient.$transaction(async (tx: typeof prisma) => {
    // 1. Fetch order
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    // Verify ownership and status
    if (order.userId !== userId) {
      throw new Error("UNAUTHORIZED");
    }

    if (order.status !== "PENDING_PAYMENT") {
      // Order is already confirmed/cancelled, no need to revert
      return;
    }

    // 2. Revert Stock & popularityScore
    for (const item of order.items) {
      await tx.product.updateMany({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
          popularityScore: {
            decrement: item.quantity,
          },
        },
      });

      // Fetch updated product for realtime update
      const updated = await tx.product.findUnique({
        where: { id: item.productId },
      });
      if (updated) {
        publishRealtimeEvent({
          type: "stock.updated",
          productId: updated.id,
          stock: updated.stock,
          lowStockThreshold: updated.lowStockThreshold,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 3. Restore Cart Items
    let cart = await tx.cart.findUnique({
      where: { userId },
    });
    if (!cart) {
      cart = await tx.cart.create({
        data: { userId },
      });
    }

    for (const item of order.items) {
      // Hydrate cart items to find if item exists
      const existingItem = (cart as any).items?.find((ci: any) => ci.productId === item.productId);
      const newQty = existingItem ? existingItem.quantity + item.quantity : item.quantity;

      await tx.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: item.productId,
          },
        },
        create: {
          cartId: cart.id,
          productId: item.productId,
          quantity: newQty,
        },
        update: {
          quantity: newQty,
        },
      });
    }

    // 4. Mark Order as CANCELLED and paymentStatus as FAILED
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        paymentStatus: "FAILED",
      },
    });

    // Publish event
    publishRealtimeEvent({
      type: "order.status.updated",
      orderId: order.id,
      status: "CANCELLED",
      updatedAt: new Date().toISOString(),
    });
  });
}

export type { CartItemRow };
