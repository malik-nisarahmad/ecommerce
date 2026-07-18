/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export type Role = "CUSTOMER" | "ADMIN";
export type Unit = "KG" | "LB" | "PACK" | "EACH" | "LITER";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED";

type AnyRecord = any;

type UserRow = AnyRecord & {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

type CategoryRow = AnyRecord & {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProductImageRow = AnyRecord & {
  id: string;
  productId: string;
  url: string;
  alt: string;
  sortOrder: number;
};

type ProductRow = AnyRecord & {
  id: string;
  name: string;
  slug: string;
  description: string;
  nutritionInfo: unknown | null;
  categoryId: string;
  priceCents: number;
  unit: Unit;
  stock: number;
  lowStockThreshold: number;
  popularityScore: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type AddressRow = AnyRecord & {
  id: string;
  userId: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

type CartRow = AnyRecord & {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type CartItemRow = AnyRecord & {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
};

type OrderRow = AnyRecord & {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  addressSnapshot: unknown;
  deliverySlotStart: string | null;
  deliverySlotEnd: string | null;
  stripeSessionId: string | null;
  createdAt: string;
  updatedAt: string;
};

type OrderItemRow = AnyRecord & {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  unit: Unit;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

type LoginVerificationCodeRow = AnyRecord & {
  id: string;
  userId: string;
  code: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

type PasswordResetTokenRow = AnyRecord & {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

type ProcessedWebhookEventRow = AnyRecord & {
  id: string;
  provider: string;
  eventId: string;
  orderId: string | null;
  receivedAt: string;
  processedAt: string;
  payloadHash: string;
};

type SupabaseClientType = ReturnType<typeof createClient>;

const globalForSupabase = globalThis as unknown as { supabase?: SupabaseClientType };

const client =
  globalForSupabase.supabase ??
  createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = client;
}

const TABLES = {
  users: "users",
  categories: "categories",
  products: "products",
  productImages: "product_images",
  addresses: "addresses",
  carts: "carts",
  cartItems: "cart_items",
  orders: "orders",
  orderItems: "order_items",
  passwordResetTokens: "password_reset_tokens",
  loginVerificationCodes: "login_verification_codes",
  processedWebhookEvents: "processed_webhook_events",
  savedPaymentMethods: "saved_payment_methods",
} as const;

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function hydrateUser(row: UserRow | null) {
  if (!row) return null;
  return {
    ...row,
    createdAt: toDate(row.createdAt) ?? new Date(),
    updatedAt: toDate(row.updatedAt) ?? new Date(),
  };
}

function hydrateCategory(row: CategoryRow) {
  return {
    ...row,
    parentId: row.parentId ?? null,
    createdAt: toDate(row.createdAt) ?? new Date(),
    updatedAt: toDate(row.updatedAt) ?? new Date(),
  };
}

function hydrateProductImage(row: ProductImageRow) {
  return { ...row };
}

function hydrateProduct(row: ProductRow, category?: AnyRecord, images: AnyRecord[] = []) {
  return {
    ...row,
    nutritionInfo: row.nutritionInfo ?? null,
    category: category ?? null,
    images,
    createdAt: toDate(row.createdAt) ?? new Date(),
    updatedAt: toDate(row.updatedAt) ?? new Date(),
  };
}

function hydrateAddress(row: AddressRow) {
  return {
    ...row,
    line2: row.line2 ?? null,
    createdAt: toDate(row.createdAt) ?? new Date(),
    updatedAt: toDate(row.updatedAt) ?? new Date(),
  };
}

function hydrateCart(row: CartRow, items: AnyRecord[] = []) {
  return {
    ...row,
    createdAt: toDate(row.createdAt) ?? new Date(),
    updatedAt: toDate(row.updatedAt) ?? new Date(),
    items,
  };
}

function hydrateOrder(row: OrderRow, items: AnyRecord[] = [], user?: AnyRecord) {
  return {
    ...row,
    addressSnapshot: row.addressSnapshot,
    deliverySlotStart: toDate(row.deliverySlotStart),
    deliverySlotEnd: toDate(row.deliverySlotEnd),
    stripeSessionId: row.stripeSessionId ?? null,
    createdAt: toDate(row.createdAt) ?? new Date(),
    updatedAt: toDate(row.updatedAt) ?? new Date(),
    items,
    user,
  };
}

function hydrateOrderItem(row: OrderItemRow) {
  return { ...row };
}

function hydrateLoginVerificationCode(row: LoginVerificationCodeRow) {
  return {
    ...row,
    expiresAt: toDate(row.expiresAt) ?? new Date(),
    usedAt: toDate(row.usedAt),
    createdAt: toDate(row.createdAt) ?? new Date(),
  };
}

function hydratePasswordResetToken(row: PasswordResetTokenRow) {
  return {
    ...row,
    expiresAt: toDate(row.expiresAt) ?? new Date(),
    usedAt: toDate(row.usedAt),
    createdAt: toDate(row.createdAt) ?? new Date(),
  };
}

function hydrateProcessedWebhookEvent(row: ProcessedWebhookEventRow) {
  return {
    ...row,
    orderId: row.orderId ?? null,
    receivedAt: toDate(row.receivedAt) ?? new Date(),
    processedAt: toDate(row.processedAt) ?? new Date(),
  };
}

async function fetchRows<T extends AnyRecord>(table: string): Promise<T[]> {
  const { data, error } = await client.from(table).select("*");
  if (error) throw error;
  return (data ?? []) as T[];
}

async function insertRow<T extends AnyRecord>(table: string, row: T): Promise<T> {
  const { data, error } = await (client.from(table) as any).insert(row).select("*").single();
  if (error) throw error;
  return data as T;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function matchesProduct(row: ProductRow, where: AnyRecord): boolean {
  if (where.isActive !== undefined && row.isActive !== where.isActive) return false;
  if (where.id && row.id !== where.id) return false;
  if (where.slug && row.slug !== where.slug) return false;
  if (where.stock?.gt !== undefined && !(row.stock > where.stock.gt)) return false;
  if (where.stock?.gte !== undefined && !(row.stock >= where.stock.gte)) return false;
  if (where.priceCents?.gte !== undefined && !(row.priceCents >= where.priceCents.gte)) return false;
  if (where.priceCents?.lte !== undefined && !(row.priceCents <= where.priceCents.lte)) return false;
  if (where.category?.slug) {
    // evaluated later when category map is attached
    return true;
  }
  if (where.OR?.length) {
    const term = normalizeSearch(where.OR[0].name?.contains ?? where.OR[0].description?.contains ?? "");
    const name = row.name.toLowerCase();
    const description = row.description.toLowerCase();
    if (!name.includes(term) && !description.includes(term)) return false;
  }
  return true;
}

async function buildProductResults(rows: ProductRow[]) {
  const categories = await fetchRows<CategoryRow>(TABLES.categories);
  const images = await fetchRows<ProductImageRow>(TABLES.productImages);
  const categoryMap = new Map(categories.map((category) => [category.id, hydrateCategory(category)]));
  const imagesByProductId = new Map<string, AnyRecord[]>();

  for (const image of images.sort((a, b) => a.sortOrder - b.sortOrder)) {
    const entry = imagesByProductId.get(image.productId) ?? [];
    entry.push(hydrateProductImage(image));
    imagesByProductId.set(image.productId, entry);
  }

  return rows.map((row) =>
    hydrateProduct(row, categoryMap.get(row.categoryId), imagesByProductId.get(row.id) ?? []),
  );
}

async function buildCategoryResults(rows: CategoryRow[]) {
  const allCategories = rows.map(hydrateCategory);
  const childrenByParent = new Map<string, AnyRecord[]>();
  for (const category of allCategories) {
    if (!category.parentId) continue;
    const list = childrenByParent.get(category.parentId) ?? [];
    list.push(category);
    childrenByParent.set(category.parentId, list);
  }

  return allCategories.map((category) => ({
    ...category,
    children: (childrenByParent.get(category.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

async function buildCartResult(row: CartRow | null) {
  if (!row) return null;
  const items = await fetchRows<CartItemRow>(TABLES.cartItems);
  const productRows = await fetchRows<ProductRow>(TABLES.products);
  const productResults = await buildProductResults(productRows);
  const productsById = new Map(productResults.map((product) => [product.id, product]));
  const cartItems = items
    .filter((item) => item.cartId === row.id)
    .map((item) => ({
      ...item,
      createdAt: toDate(item.createdAt) ?? new Date(),
      updatedAt: toDate(item.updatedAt) ?? new Date(),
      product: productsById.get(item.productId),
    }));

  return hydrateCart(row, cartItems);
}

async function buildOrderResults(rows: OrderRow[]) {
  const items = await fetchRows<OrderItemRow>(TABLES.orderItems);
  const users = await fetchRows<UserRow>(TABLES.users);
  const userMap = new Map(users.map((user) => [user.id, hydrateUser(user)]));

  return rows
    .map((row) => {
      const orderItems = items
        .filter((item) => item.orderId === row.id)
        .map((item) => ({
          ...hydrateOrderItem(item),
          createdAt: undefined,
          updatedAt: undefined,
        }));
      return hydrateOrder(row, orderItems, userMap.get(row.userId));
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function filterOrders(rows: OrderRow[], where: AnyRecord = {}) {
  return rows.filter((row) => {
    if (where.id && row.id !== where.id) return false;
    if (where.userId && row.userId !== where.userId) return false;
    if (where.status && row.status !== where.status) return false;
    if (where.status?.not && row.status === where.status.not) return false;
    if (where.createdAt?.gte && new Date(row.createdAt) < new Date(where.createdAt.gte)) return false;
    return true;
  });
}

function filterCategories(rows: CategoryRow[], where: AnyRecord = {}) {
  return rows.filter((row) => {
    if (where.id && row.id !== where.id) return false;
    if (where.slug && row.slug !== where.slug) return false;
    if (where.parentId !== undefined && row.parentId !== where.parentId) return false;
    return true;
  });
}

function filterUsers(rows: UserRow[], where: AnyRecord = {}) {
  return rows.filter((row) => {
    if (where.id && row.id !== where.id) return false;
    if (where.email && row.email !== where.email) return false;
    if (where.isVerified !== undefined && row.isVerified !== where.isVerified) return false;
    return true;
  });
}

function filterAddresses(rows: AddressRow[], where: AnyRecord = {}) {
  return rows.filter((row) => {
    if (where.id && row.id !== where.id) return false;
    if (where.userId && row.userId !== where.userId) return false;
    if (where.isDefault !== undefined && row.isDefault !== where.isDefault) return false;
    return true;
  });
}

function filterLoginVerificationCodes(rows: LoginVerificationCodeRow[], where: AnyRecord = {}) {
  return rows.filter((row) => {
    if (where.id && row.id !== where.id) return false;
    if (where.userId && row.userId !== where.userId) return false;
    if (where.code && row.code !== where.code) return false;
    if (where.usedAt === null && row.usedAt !== null) return false;
    if (where.usedAt?.not === null && row.usedAt === null) return false;
    if (where.expiresAt?.gt && new Date(row.expiresAt) <= new Date(where.expiresAt.gt)) return false;
    return true;
  });
}

function filterPasswordTokens(rows: PasswordResetTokenRow[], where: AnyRecord = {}) {
  return rows.filter((row) => {
    if (where.id && row.id !== where.id) return false;
    if (where.tokenHash && row.tokenHash !== where.tokenHash) return false;
    if (where.userId && row.userId !== where.userId) return false;
    return true;
  });
}

function filterWebhookEvents(rows: ProcessedWebhookEventRow[], where: AnyRecord = {}) {
  return rows.filter((row) => {
    if (where.eventId && row.eventId !== where.eventId) return false;
    if (where.provider && row.provider !== where.provider) return false;
    return true;
  });
}

export const prisma: any = {
  user: {
    async findUnique(args: AnyRecord) {
      const rows = await fetchRows<UserRow>(TABLES.users);
      return hydrateUser(filterUsers(rows, args?.where)[0] ?? null);
    },
    async findUniqueOrThrow(args: AnyRecord) {
      const user = await prisma.user.findUnique(args);
      if (!user) throw new Error("NOT_FOUND");
      return user;
    },
    async findFirst(args: AnyRecord) {
      return prisma.user.findUnique(args);
    },
    async create(args: AnyRecord) {
      const row: UserRow = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: "CUSTOMER",
        isVerified: false,
        ...args.data,
      };
      const inserted = await insertRow<UserRow>(TABLES.users, row);
      return args.select ? inserted : hydrateUser(inserted);
    },
    async update(args: AnyRecord) {
      const rows = await fetchRows<UserRow>(TABLES.users);
      const row = filterUsers(rows, args.where)[0];
      if (!row) throw new Error("NOT_FOUND");
      const updated = {
        ...row,
        ...args.data,
        updatedAt: new Date().toISOString(),
      };
      const { data, error } = await (client.from(TABLES.users) as any).update(updated).eq("id", row.id).select("*").single();
      if (error) throw error;
      return hydrateUser(data as UserRow);
    },
  },

  category: {
    async findMany(args: AnyRecord = {}) {
      const rows = await fetchRows<CategoryRow>(TABLES.categories);
      const filtered = filterCategories(rows, args.where);
      const ordered = filtered.sort((a, b) => {
        const aValue = args.orderBy?.name ? a.name : a.slug;
        const bValue = args.orderBy?.name ? b.name : b.slug;
        return String(aValue).localeCompare(String(bValue));
      });
      return buildCategoryResults(ordered);
    },
    async findUnique(args: AnyRecord) {
      const rows = await fetchRows<CategoryRow>(TABLES.categories);
      const results = await buildCategoryResults(filterCategories(rows, args.where));
      return results[0] ?? null;
    },
  },

  product: {
    async findMany(args: AnyRecord = {}) {
      const rows = await fetchRows<ProductRow>(TABLES.products);
      const categories = await fetchRows<CategoryRow>(TABLES.categories);
      const categoryMap = new Map(categories.map((category) => [category.id, hydrateCategory(category)]));
      const filtered = rows.filter((row) => {
        if (!matchesProduct(row, args.where ?? {})) return false;
        if (args.where?.category?.slug) {
          const category = categoryMap.get(row.categoryId);
          if (!category || category.slug !== args.where.category.slug) return false;
        }
        if (args.where?.OR?.length) {
          const term = normalizeSearch(args.where.OR[0].name?.contains ?? args.where.OR[0].description?.contains ?? "");
          if (
            !row.name.toLowerCase().includes(term) &&
            !row.description.toLowerCase().includes(term)
          ) {
            return false;
          }
        }
        return true;
      });

      const ordered = filtered.sort((a, b) => {
        const orderBy = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy ?? { createdAt: "desc" }];
        for (const order of orderBy) {
          const key = Object.keys(order)[0] as keyof ProductRow;
          const direction = order[key];
          const aValue = a[key] as unknown;
          const bValue = b[key] as unknown;
          if (aValue === bValue) continue;
          const comparison =
            typeof aValue === "number" && typeof bValue === "number"
              ? aValue - bValue
              : String(aValue).localeCompare(String(bValue));
          return direction === "asc" ? comparison : -comparison;
        }
        return 0;
      });

      const skipped = args.skip ? ordered.slice(args.skip) : ordered;
      const limited = args.take ? skipped.slice(0, args.take) : skipped;
      return buildProductResults(limited);
    },
    async findUnique(args: AnyRecord) {
      const rows = await fetchRows<ProductRow>(TABLES.products);
      const row = rows.find((product) => {
        if (args.where?.id && product.id === args.where.id) return true;
        if (args.where?.slug && product.slug === args.where.slug) return true;
        return false;
      });
      if (!row) return null;
      return (await buildProductResults([row]))[0] ?? null;
    },
    async findUniqueOrThrow(args: AnyRecord) {
      const product = await prisma.product.findUnique(args);
      if (!product) throw new Error("NOT_FOUND");
      return product;
    },
    async count(args: AnyRecord = {}) {
      const products = await prisma.product.findMany({ where: args.where });
      return products.length;
    },
    async create(args: AnyRecord) {
      const row: ProductRow = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        popularityScore: 0,
        isActive: true,
        lowStockThreshold: 5,
        nutritionInfo: null,
        ...args.data,
      };
      const inserted = await insertRow<ProductRow>(TABLES.products, row);
      if (args.data?.images?.create) {
        const imageData = args.data.images.create;
        await insertRow<ProductImageRow>(TABLES.productImages, {
          id: imageData.id ?? randomUUID(),
          productId: inserted.id,
          url: imageData.url,
          alt: imageData.alt,
          sortOrder: imageData.sortOrder ?? 0,
        });
      }
      return (await prisma.product.findUnique({ where: { id: inserted.id } })) ?? inserted;
    },
    async update(args: AnyRecord) {
      const rows = await fetchRows<ProductRow>(TABLES.products);
      const row = rows.find((product) => product.id === args.where.id);
      if (!row) throw new Error("NOT_FOUND");
      const updated: ProductRow = {
        ...row,
        ...args.data,
        updatedAt: new Date().toISOString(),
      };
      const { data, error } = await (client.from(TABLES.products) as any).update(updated).eq("id", row.id).select("*").single();
      if (error) throw error;
      return (await prisma.product.findUnique({ where: { id: (data as ProductRow).id } })) ?? data;
    },
    async updateMany(args: AnyRecord) {
      const rows = await fetchRows<ProductRow>(TABLES.products);
      let count = 0;
      for (const row of rows) {
        if (!matchesProduct(row, args.where ?? {})) continue;
        const next = { ...row };
        for (const [key, value] of Object.entries(args.data ?? {})) {
          if (value && typeof value === "object" && "increment" in value) {
            next[key as keyof ProductRow] = ((row[key as keyof ProductRow] as number) + (value as AnyRecord).increment) as never;
          } else if (value && typeof value === "object" && "decrement" in value) {
            next[key as keyof ProductRow] = ((row[key as keyof ProductRow] as number) - (value as AnyRecord).decrement) as never;
          } else {
            next[key as keyof ProductRow] = value as never;
          }
        }
        next.updatedAt = new Date().toISOString();
        const { error } = await (client.from(TABLES.products) as any).update(next).eq("id", row.id);
        if (error) throw error;
        count += 1;
      }
      return { count };
    },
  },

  productImage: {
    async upsert(args: AnyRecord) {
      const rows = await fetchRows<ProductImageRow>(TABLES.productImages);
      const existing = rows.find((row) => row.id === args.where.id);
      if (existing) {
        const updated = { ...existing, ...args.update };
        const { data, error } = await ((client.from(TABLES.productImages) as any)
          .update(updated)
          .eq("id", existing.id)
          .select("*")
          .single() as any);
        if (error) throw error;
        return hydrateProductImage(data as ProductImageRow);
      }
      const created = await insertRow<ProductImageRow>(TABLES.productImages, {
        id: args.create.id ?? randomUUID(),
        productId: args.create.productId,
        url: args.create.url,
        alt: args.create.alt,
        sortOrder: args.create.sortOrder ?? 0,
      });
      return hydrateProductImage(created);
    },
  },

  address: {
    async findMany(args: AnyRecord = {}) {
      const rows = await fetchRows<AddressRow>(TABLES.addresses);
      return filterAddresses(rows, args.where)
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.createdAt.localeCompare(a.createdAt))
        .map(hydrateAddress);
    },
    async create(args: AnyRecord) {
      const row: AddressRow = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: Boolean(args.data.isDefault ?? false),
        line2: args.data.line2 ?? null,
        ...args.data,
      };
      const inserted = await insertRow<AddressRow>(TABLES.addresses, row);
      return hydrateAddress(inserted);
    },
    async updateMany(args: AnyRecord) {
      const rows = await fetchRows<AddressRow>(TABLES.addresses);
      let count = 0;
      for (const row of filterAddresses(rows, args.where ?? {})) {
        const updated: AddressRow = {
          ...row,
          ...args.data,
          updatedAt: new Date().toISOString(),
        };
        const { error } = await (client.from(TABLES.addresses) as any).update(updated).eq("id", row.id);
        if (error) throw error;
        count += 1;
      }
      return { count };
    },
  },

  cart: {
    async findUnique(args: AnyRecord) {
      const rows = await fetchRows<CartRow>(TABLES.carts);
      const cart = rows.find((row) => row.userId === args.where.userId) ?? null;
      return buildCartResult(cart);
    },
    async create(args: AnyRecord) {
      const row: CartRow = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...args.data,
      };
      const inserted = await insertRow<CartRow>(TABLES.carts, row);
      return buildCartResult(inserted);
    },
  },

  cartItem: {
    async deleteMany(args: AnyRecord) {
      const rows = await fetchRows<CartItemRow>(TABLES.cartItems);
      let count = 0;
      for (const row of rows) {
        if (args.where.cartId && row.cartId !== args.where.cartId) continue;
        if (args.where.productId && row.productId !== args.where.productId) continue;
        const { error } = await client.from(TABLES.cartItems).delete().eq("id", row.id);
        if (error) throw error;
        count += 1;
      }
      return { count };
    },
    async upsert(args: AnyRecord) {
      const rows = await fetchRows<CartItemRow>(TABLES.cartItems);
      const existing = rows.find(
        (row) => row.cartId === args.where.cartId_productId.cartId && row.productId === args.where.cartId_productId.productId,
      );
      if (existing) {
        const updated: CartItemRow = {
          ...existing,
          ...args.update,
          updatedAt: new Date().toISOString(),
        };
        const { error } = await (client.from(TABLES.cartItems) as any).update(updated).eq("id", existing.id);
        if (error) throw error;
        return updated;
      }
      const created: CartItemRow = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cartId: args.create.cartId,
        productId: args.create.productId,
        quantity: args.create.quantity,
      };
      return insertRow<CartItemRow>(TABLES.cartItems, created);
    },
  },

  order: {
    async findMany(args: AnyRecord = {}) {
      const rows = await fetchRows<OrderRow>(TABLES.orders);
      const filtered = filterOrders(rows, args.where ?? {});
      const ordered = filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const results = await buildOrderResults(ordered);
      if (args.take) return results.slice(0, args.take);
      return results;
    },
    async findFirst(args: AnyRecord) {
      const results = await prisma.order.findMany(args);
      return results[0] ?? null;
    },
    async findUnique(args: AnyRecord) {
      const rows = await fetchRows<OrderRow>(TABLES.orders);
      const row = rows.find((order) => order.id === args.where.id) ?? null;
      if (!row) return null;
      return (await buildOrderResults([row]))[0] ?? null;
    },
    async create(args: AnyRecord) {
      const row: OrderRow = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stripeSessionId: null,
        ...args.data,
      };
      const items = args.data.items?.create ?? [];
      const inserted = await insertRow<OrderRow>(TABLES.orders, row);
      for (const item of items) {
        await insertRow<OrderItemRow>(TABLES.orderItems, {
          id: randomUUID(),
          orderId: inserted.id,
          ...item,
        });
      }
      return (await prisma.order.findUnique({ where: { id: inserted.id } })) ?? inserted;
    },
    async update(args: AnyRecord) {
      const rows = await fetchRows<OrderRow>(TABLES.orders);
      const row = rows.find((order) => order.id === args.where.id);
      if (!row) throw new Error("NOT_FOUND");
      const updated: OrderRow = {
        ...row,
        ...args.data,
        updatedAt: new Date().toISOString(),
      };
      const { error } = await (client.from(TABLES.orders) as any).update(updated).eq("id", row.id);
      if (error) throw error;
      return (await prisma.order.findUnique({ where: { id: row.id } })) ?? updated;
    },
    async count(args: AnyRecord = {}) {
      const rows = await fetchRows<OrderRow>(TABLES.orders);
      return filterOrders(rows, args.where ?? {}).length;
    },
    async aggregate(args: AnyRecord = {}) {
      const rows = await fetchRows<OrderRow>(TABLES.orders);
      const filtered = filterOrders(rows, args.where ?? {});
      const total = filtered.reduce((sum, row) => sum + Number(row.totalCents ?? 0), 0);
      return { _sum: { totalCents: total } };
    },
  },

  orderItem: {
    async groupBy(args: AnyRecord = {}) {
      const rows = await fetchRows<OrderItemRow>(TABLES.orderItems);
      const grouped = new Map<string, { productId: string; productName: string; quantity: number; lineTotalCents: number }>();
      for (const row of rows) {
        const key = `${row.productId}:${row.productName}`;
        const current = grouped.get(key) ?? {
          productId: row.productId,
          productName: row.productName,
          quantity: 0,
          lineTotalCents: 0,
        };
        current.quantity += Number(row.quantity ?? 0);
        current.lineTotalCents += Number(row.lineTotalCents ?? 0);
        grouped.set(key, current);
      }
      const results = [...grouped.values()].sort((a, b) => b.quantity - a.quantity);
      const take = args.take ?? results.length;
      return results.slice(0, take).map((row) => ({
        productId: row.productId,
        productName: row.productName,
        _sum: { quantity: row.quantity, lineTotalCents: row.lineTotalCents },
      }));
    },
  },

  loginVerificationCode: {
    async findFirst(args: AnyRecord) {
      const rows = await fetchRows<LoginVerificationCodeRow>(TABLES.loginVerificationCodes);
      const code = filterLoginVerificationCodes(rows, args.where)[0] ?? null;
      return code ? hydrateLoginVerificationCode(code) : null;
    },
    async create(args: AnyRecord) {
      const row: LoginVerificationCodeRow = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        usedAt: null,
        ...args.data,
      };
      const inserted = await insertRow<LoginVerificationCodeRow>(TABLES.loginVerificationCodes, row);
      return hydrateLoginVerificationCode(inserted);
    },
    async update(args: AnyRecord) {
      const rows = await fetchRows<LoginVerificationCodeRow>(TABLES.loginVerificationCodes);
      const row = rows.find((code) => code.id === args.where.id);
      if (!row) throw new Error("NOT_FOUND");
      const updated: LoginVerificationCodeRow = {
        ...row,
        ...args.data,
      };
      const { error } = await (client.from(TABLES.loginVerificationCodes) as any).update(updated).eq("id", row.id);
      if (error) throw error;
      return hydrateLoginVerificationCode(updated);
    },
  },

  passwordResetToken: {
    async findUnique(args: AnyRecord) {
      const rows = await fetchRows<PasswordResetTokenRow>(TABLES.passwordResetTokens);
      const token = filterPasswordTokens(rows, args.where)[0] ?? null;
      return token ? hydratePasswordResetToken(token) : null;
    },
    async create(args: AnyRecord) {
      const row: PasswordResetTokenRow = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        usedAt: null,
        ...args.data,
      };
      const inserted = await insertRow<PasswordResetTokenRow>(TABLES.passwordResetTokens, row);
      return hydratePasswordResetToken(inserted);
    },
    async update(args: AnyRecord) {
      const rows = await fetchRows<PasswordResetTokenRow>(TABLES.passwordResetTokens);
      const row = rows.find((token) => token.id === args.where.id);
      if (!row) throw new Error("NOT_FOUND");
      const updated: PasswordResetTokenRow = {
        ...row,
        ...args.data,
      };
      const { error } = await (client.from(TABLES.passwordResetTokens) as any).update(updated).eq("id", row.id);
      if (error) throw error;
      return hydratePasswordResetToken(updated);
    },
  },

  processedWebhookEvent: {
    async findUnique(args: AnyRecord) {
      const rows = await fetchRows<ProcessedWebhookEventRow>(TABLES.processedWebhookEvents);
      const event = filterWebhookEvents(rows, args.where)[0] ?? null;
      return event ? hydrateProcessedWebhookEvent(event) : null;
    },
    async create(args: AnyRecord) {
      const row: ProcessedWebhookEventRow = {
        id: randomUUID(),
        receivedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        ...args.data,
      };
      const inserted = await insertRow<ProcessedWebhookEventRow>(TABLES.processedWebhookEvents, row);
      return hydrateProcessedWebhookEvent(inserted);
    },
  },

  $transaction: async (input: unknown) => {
    if (Array.isArray(input)) {
      return Promise.all(input);
    }
    if (typeof input === "function") {
      return input(prisma);
    }
    throw new Error("UNSUPPORTED_TRANSACTION");
  },
} as const;
