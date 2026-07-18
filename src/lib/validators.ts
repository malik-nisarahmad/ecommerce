import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().trim(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number")
    .regex(/[^a-zA-Z0-9]/, "Password must include a special character"),
});

export const loginSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(1),
});

export const verifyLoginSchema = z.object({
  email: z.email().trim(),
  code: z.string().length(6),
});

export const catalogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(48).default(12),
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  inStockOnly: z.enum(["true", "false"]).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  sort: z
    .enum(["price_asc", "price_desc", "newest", "popularity_desc"])
    .default("newest"),
});

export const upsertCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(0).max(50),
});

export const checkoutSchema = z.object({
  addressId: z.string().uuid(),
  deliverySlotStart: z.string().datetime().optional(),
  deliverySlotEnd: z.string().datetime().optional(),
  paymentMethod: z.string().optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "CONFIRMED",
    "PACKED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ]),
});

export const forgotPasswordSchema = z.object({
  email: z.email().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password: signUpSchema.shape.password,
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().trim().min(4).max(2000),
  categoryId: z.string().uuid(),
  priceCents: z.number().int().positive(),
  unit: z.enum(["KG", "LB", "PACK", "EACH", "LITER"]),
  stock: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative().max(1000),
  imageUrl: z.url().optional(),
  imageAlt: z.string().trim().max(200).optional(),
});

export const bulkStockAdjustmentSchema = z.object({
  adjustments: z
    .array(
      z.object({
        productId: z.string().uuid(),
        delta: z.number().int().min(-10000).max(10000),
      }),
    )
    .min(1)
    .max(100),
});

