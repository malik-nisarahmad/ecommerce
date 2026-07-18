import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { parseJsonBody, normalizeError, jsonResponse } from "@/lib/http";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export async function GET(): Promise<Response> {
  try {
    const user = await requireSessionUser();
    const profile = await prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        paymentMethods: {
          select: {
            id: true,
            provider: true,
            brand: true,
            last4: true,
            expiryMonth: true,
            expiryYear: true,
          },
        },
      },
    });
    return jsonResponse({ profile });
  } catch (error) {
    return normalizeError(error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const user = await requireSessionUser();
    const body = await parseJsonBody<unknown>(request);
    const parsed = profileSchema.parse(body);
    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: { name: parsed.name },
      select: { id: true, email: true, name: true, role: true },
    });
    return jsonResponse({ profile: updated });
  } catch (error) {
    return normalizeError(error);
  }
}

