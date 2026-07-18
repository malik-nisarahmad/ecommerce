create extension if not exists "pgcrypto";

create table if not exists "users" (
  "id" uuid primary key default gen_random_uuid(),
  "email" text not null unique,
  "passwordHash" text not null,
  "name" text not null,
  "role" text not null default 'CUSTOMER' check ("role" in ('CUSTOMER', 'ADMIN')),
  "isVerified" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "categories" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "slug" text not null unique,
  "parentId" uuid null references "categories" ("id") on delete set null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "products" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "slug" text not null unique,
  "description" text not null,
  "nutritionInfo" jsonb null,
  "categoryId" uuid not null references "categories" ("id") on delete restrict,
  "priceCents" integer not null,
  "unit" text not null check ("unit" in ('KG', 'LB', 'PACK', 'EACH', 'LITER')),
  "stock" integer not null,
  "lowStockThreshold" integer not null default 5,
  "popularityScore" integer not null default 0,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "products_categoryId_idx" on "products" ("categoryId");
create index if not exists "products_isActive_createdAt_idx" on "products" ("isActive", "createdAt" desc);

create table if not exists "product_images" (
  "id" uuid primary key default gen_random_uuid(),
  "productId" uuid not null references "products" ("id") on delete cascade,
  "url" text not null,
  "alt" text not null,
  "sortOrder" integer not null default 0
);

create index if not exists "product_images_productId_sortOrder_idx" on "product_images" ("productId", "sortOrder");

create table if not exists "addresses" (
  "id" uuid primary key default gen_random_uuid(),
  "userId" uuid not null references "users" ("id") on delete cascade,
  "label" text not null,
  "recipient" text not null,
  "phone" text not null,
  "line1" text not null,
  "line2" text null,
  "city" text not null,
  "state" text not null,
  "postalCode" text not null,
  "countryCode" text not null,
  "isDefault" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "addresses_userId_idx" on "addresses" ("userId");

create table if not exists "saved_payment_methods" (
  "id" uuid primary key default gen_random_uuid(),
  "userId" uuid not null references "users" ("id") on delete cascade,
  "provider" text not null,
  "reference" text not null,
  "brand" text null,
  "last4" text null,
  "expiryMonth" integer null,
  "expiryYear" integer null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("provider", "reference")
);

create index if not exists "saved_payment_methods_userId_idx" on "saved_payment_methods" ("userId");

create table if not exists "carts" (
  "id" uuid primary key default gen_random_uuid(),
  "userId" uuid not null unique references "users" ("id") on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "cart_items" (
  "id" uuid primary key default gen_random_uuid(),
  "cartId" uuid not null references "carts" ("id") on delete cascade,
  "productId" uuid not null references "products" ("id") on delete restrict,
  "quantity" integer not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("cartId", "productId")
);

create index if not exists "cart_items_cartId_idx" on "cart_items" ("cartId");

create table if not exists "orders" (
  "id" uuid primary key default gen_random_uuid(),
  "userId" uuid not null references "users" ("id") on delete restrict,
  "status" text not null default 'PENDING_PAYMENT' check ("status" in ('PENDING_PAYMENT', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')),
  "paymentStatus" text not null default 'PENDING' check ("paymentStatus" in ('PENDING', 'SUCCEEDED', 'FAILED')),
  "subtotalCents" integer not null,
  "taxCents" integer not null,
  "deliveryFeeCents" integer not null,
  "totalCents" integer not null,
  "addressSnapshot" jsonb not null,
  "deliverySlotStart" timestamptz null,
  "deliverySlotEnd" timestamptz null,
  "stripeSessionId" text null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "orders_userId_createdAt_idx" on "orders" ("userId", "createdAt" desc);
create index if not exists "orders_status_createdAt_idx" on "orders" ("status", "createdAt" desc);

create table if not exists "order_items" (
  "id" uuid primary key default gen_random_uuid(),
  "orderId" uuid not null references "orders" ("id") on delete cascade,
  "productId" uuid not null references "products" ("id") on delete restrict,
  "productName" text not null,
  "productImageUrl" text null,
  "unit" text not null check ("unit" in ('KG', 'LB', 'PACK', 'EACH', 'LITER')),
  "quantity" integer not null,
  "unitPriceCents" integer not null,
  "lineTotalCents" integer not null
);

create index if not exists "order_items_orderId_idx" on "order_items" ("orderId");



create table if not exists "processed_webhook_events" (
  "id" uuid primary key default gen_random_uuid(),
  "provider" text not null,
  "eventId" text not null unique,
  "orderId" uuid null references "orders" ("id") on delete set null,
  "receivedAt" timestamptz not null default now(),
  "processedAt" timestamptz not null default now(),
  "payloadHash" text not null
);

create index if not exists "processed_webhook_events_provider_idx" on "processed_webhook_events" ("provider");

create table if not exists "password_reset_tokens" (
  "id" uuid primary key default gen_random_uuid(),
  "userId" uuid not null references "users" ("id") on delete cascade,
  "tokenHash" text not null unique,
  "expiresAt" timestamptz not null,
  "usedAt" timestamptz null,
  "createdAt" timestamptz not null default now()
);

create index if not exists "password_reset_tokens_userId_idx" on "password_reset_tokens" ("userId");

create table if not exists "login_verification_codes" (
  "id" uuid primary key default gen_random_uuid(),
  "userId" uuid not null references "users" ("id") on delete cascade,
  "code" text not null,
  "expiresAt" timestamptz not null,
  "usedAt" timestamptz null,
  "createdAt" timestamptz not null default now()
);

create index if not exists "login_verification_codes_userId_idx" on "login_verification_codes" ("userId");
