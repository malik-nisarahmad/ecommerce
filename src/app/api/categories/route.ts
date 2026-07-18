import { prisma } from "@/lib/db";
import { normalizeError, jsonResponse } from "@/lib/http";

export async function GET(): Promise<Response> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        children: {
          orderBy: { name: "asc" },
        },
      },
    });
    return jsonResponse({ categories });
  } catch (error) {
    return normalizeError(error);
  }
}

