# FreshLane Grocers

Production-grade grocery e-commerce platform built with **Next.js 16 + TypeScript (strict)** and **Supabase/PostgreSQL**.

## Features

### Customer storefront
- Product catalog with pagination, category filter, keyword search, and sorting.
- Product detail pages with stock visibility.
- Persistent cart:
  - Logged-in users: database-backed cart
  - Guests: localStorage cart
- Checkout with address selection and stock-safe order placement.
- Authentication: signup, login, logout, password reset.
- Order history.

### Admin panel
- Role-based access control (`ADMIN` and `CUSTOMER`).
- Product and stock management APIs.
- Order status management.
- Real-time SSE dashboard showing:
  - Incoming orders
  - Live stock updates
  - Low inventory alerts

### Payments and email
- Stripe checkout session creation (test mode).
- Stripe webhook idempotency with unique event tracking.
- Order confirmation email support via SMTP.

### Security & quality
- Runtime validation with Zod.
- Password hashing with bcrypt.
- httpOnly secure session cookies.
- Security headers configured in Next config.
- Rate limiting on login/signup.
- Strict TypeScript, no `any`.
- Unit test for stock reservation logic.

## Concurrency approach

`src/lib/checkout-service.ts` uses a serializable transaction and atomic conditional stock decrement (`stock >= quantity`) per item. If any decrement fails, the transaction aborts and the order is rejected. This prevents overselling under concurrent checkouts.

## Database

Use a Supabase PostgreSQL connection URL:

`postgresql://postgres:[password]@[host]:5432/postgres?sslmode=require`

If you use the pooled Supabase connection, keep the same `postgresql://` format and follow the connection string from your Supabase project settings.

## Setup

1. Install:
   - `pnpm install`
2. Configure env:
   - copy `.env.example` to `.env`
3. Create the tables in Supabase using [`supabase/schema.sql`](G:/e-commerce/supabase/schema.sql)
4. Seed sample data with your own setup script or Supabase SQL editor
5. Start dev server:
   - `pnpm dev`

## Scripts

- `pnpm lint`
- `pnpm test`
- `pnpm build`

## Seed credentials

- Admin: `admin@freshlane.test` / `AdminPass123!`
- Customer: `customer@freshlane.test` / `CustomerPass123!`
