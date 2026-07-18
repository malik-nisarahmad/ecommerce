import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSessionCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, code } = result.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Find the code
    const verificationCode = await prisma.loginVerificationCode.findFirst({
      where: {
        userId: user.id,
        code,
        usedAt: null,
      },
    });

    if (!verificationCode) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    // Check expiration
    if (new Date(verificationCode.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    // Mark code as used
    await prisma.loginVerificationCode.update({
      where: { id: verificationCode.id },
      data: { usedAt: new Date().toISOString() },
    });

    // Mark user as verified
    if (!user.isVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    // Create session
    await createSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
