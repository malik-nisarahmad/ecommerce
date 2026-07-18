import { prisma } from "@/lib/db";

export async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" },
              },
              category: true,
            },
          },
        },
      },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.cart.create({
    data: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" },
              },
              category: true,
            },
          },
        },
      },
    },
  });
}

