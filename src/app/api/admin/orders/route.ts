export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";
import { normalizeError, jsonResponse } from "@/lib/http";

export async function GET(): Promise<Response> {
  try {
    await requireAdminUser();
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return jsonResponse({ orders });
  } catch (error) {
    return normalizeError(error);
  }
}


