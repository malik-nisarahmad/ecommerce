import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/db";
import { env } from "@/lib/env";

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  role: Role;
};

const SESSION_COOKIE_NAME = "freshlane_session";
const encoder = new TextEncoder();

export async function createSessionCookie(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(encoder.encode(env.JWT_SECRET));

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, encoder.encode(env.JWT_SECRET));
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }

    // Dynamically import prisma to read the actual role from the DB
    // so admin role changes take effect without needing a new JWT
    const { prisma } = await import("@/lib/db");
    const dbUser = await prisma.user.findUnique({ where: { id: payload.sub } });

    const role = dbUser?.role ?? payload.role;
    if (role !== "CUSTOMER" && role !== "ADMIN") {
      return null;
    }

    return {
      userId: payload.sub,
      email: dbUser?.email ?? (payload.email as string),
      name: dbUser?.name ?? (payload.name as string),
      role,
    };
  } catch {
    return null;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdminUser(): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
