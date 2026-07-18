import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";
import { parseJsonBody, normalizeError, jsonResponse } from "@/lib/http";
import { productSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const body = await parseJsonBody<unknown>(request);
    const parsed = productSchema.partial().parse(body);
    const { imageAlt, imageUrl, ...productFields } = parsed;
    const product = await prisma.product.update({
      where: { id },
      data: productFields,
    });
    if (imageUrl && imageAlt) {
      await prisma.productImage.upsert({
        where: {
          id: `${id}-primary-image`,
        },
        update: {
          url: imageUrl,
          alt: imageAlt,
          sortOrder: 0,
        },
        create: {
          id: `${id}-primary-image`,
          productId: id,
          url: imageUrl,
          alt: imageAlt,
          sortOrder: 0,
        },
      });
    }
    return jsonResponse({ product });
  } catch (error) {
    return normalizeError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    return jsonResponse({ ok: true });
  } catch (error) {
    return normalizeError(error);
  }
}
