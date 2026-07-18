import { z } from "zod";

const isServer = typeof window === "undefined";

const envSchema = z.object({
  // Public variables (available on both client and server)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("https://your-project-url-missing-in-env.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("missing-anon-key"),

  // Server-only variables (we make them optional on the client so zod doesn't crash in the browser)
  SUPABASE_SERVICE_ROLE_KEY: isServer ? z.string().min(1).default("missing-service-role-key") : z.any().optional(),
  JWT_SECRET: isServer ? z.string().min(32).default("local-development-jwt-secret-at-least-32-chars") : z.any().optional(),
  APP_URL: isServer ? z.string().url().default("http://localhost:3000") : z.any().optional(),
  STRIPE_SECRET_KEY: z.any().optional(),
  STRIPE_WEBHOOK_SECRET: z.any().optional(),
  GMAIL_USER: z.any().optional(),
  GMAIL_APP_PASSWORD: z.any().optional(),
  RATE_LIMIT_MAX: z.any().optional(),
  RATE_LIMIT_WINDOW_MS: z.any().optional(),
});

// We must explicitly declare each process.env variable here instead of using ...process.env
// because Next.js statically replaces process.env.VAR_NAME during build time in the browser bundle!
const envVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  APP_URL: process.env.APP_URL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
};

export const env = envSchema.parse(envVars);
