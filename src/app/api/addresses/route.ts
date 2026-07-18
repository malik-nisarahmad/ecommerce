export const dynamic = "force-dynamic";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { parseJsonBody, normalizeError, jsonResponse } from "@/lib/http";

const addressSchema = z.object({
  label: z.string().trim().min(1).max(60),
  recipient: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(25),
  line1: z.string().trim().min(2).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(20),
  countryCode: z.string().trim().length(2),
  isDefault: z.boolean().optional(),
});

export async function GET(): Promise<Response> {
  try {
    const user = await requireSessionUser();
    const addresses = await prisma.address.findMany({
      where: { userId: user.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return jsonResponse({ addresses });
  } catch (error) {
    return normalizeError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireSessionUser();
    const body = await parseJsonBody<unknown>(request);
    const parsed = addressSchema.parse(body);

    if (parsed.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: user.userId,
        ...parsed,
      },
    });

    return jsonResponse({ address }, 201);
  } catch (error) {
    return normalizeError(error);
  }
}


