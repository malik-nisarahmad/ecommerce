import nodemailer from "nodemailer";
import { env } from "@/lib/env";
import { formatCurrency } from "@/lib/pricing";

const transporter = (env.GMAIL_USER && env.GMAIL_APP_PASSWORD)
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASSWORD,
      },
    })
  : null;

export async function sendOrderConfirmationEmail(input: {
  to: string;
  customerName: string;
  orderId: string;
  totalCents: number;
}): Promise<void> {
  if (!transporter) {
    console.log(`
=========================================
📧 MOCK EMAIL SENT: Order Confirmation
To: ${input.to}
Customer: ${input.customerName}
Order ID: ${input.orderId}
Total: ${formatCurrency(input.totalCents)}
=========================================
`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"FreshLane" <${env.GMAIL_USER}>`,
      to: input.to,
      subject: `FreshLane order ${input.orderId} confirmed`,
      text: `Hi ${input.customerName}, your order ${input.orderId} has been confirmed for ${formatCurrency(input.totalCents)}.`,
    });
  } catch (err) {
    console.error("Failed to send order confirmation email:", err);
  }
}

export async function sendLoginVerificationEmail(input: {
  to: string;
  code: string;
}): Promise<void> {
  if (!transporter) {
    console.log(`
=========================================
📧 MOCK EMAIL SENT: Login Verification Code
To: ${input.to}
Code: ${input.code}
Expires in: 15 minutes
=========================================
`);
    return;
  }

  await transporter.sendMail({
    from: `"FreshLane" <${env.GMAIL_USER}>`,
    to: input.to,
    subject: `Your FreshLane Login Verification Code`,
    text: `Your login verification code is: ${input.code}\n\nThis code will expire in 15 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Freshlane!</h2>
        <p>Please use the verification code below to verify your email address and activate your account:</p>
        <h1 style="letter-spacing: 4px; padding: 12px; background: #f4f4f5; border-radius: 8px; text-align: center;">${input.code}</h1>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  if (!transporter) {
    console.log(`
=========================================
📧 MOCK EMAIL SENT: Password Reset Link
To: ${input.to}
Link: ${input.resetUrl}
Expires in: 1 hour
=========================================
`);
    return;
  }

  await transporter.sendMail({
    from: `"FreshLane" <${env.GMAIL_USER}>`,
    to: input.to,
    subject: `Reset your FreshLane password`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${input.resetUrl}" style="background-color: #047857; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #52525b; font-size: 14px;">${input.resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
