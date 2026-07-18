"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleForgot = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request reset");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <h1 className="mb-4 text-2xl font-semibold">Reset Password</h1>
        {success ? (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
            <h2 className="text-lg font-semibold mb-2">Check your email</h2>
            <p className="text-sm mb-4">If an account exists for {email}, we sent a password reset link.</p>
            <Link href="/login" className="text-sm font-medium underline">
              Return to Login
            </Link>
          </div>
        ) : (
          <form
            className="space-y-4 rounded border border-zinc-200 bg-white p-4 shadow-sm"
            onSubmit={handleForgot}
          >
            <p className="text-sm text-zinc-600">Enter your email address and we will send you a link to reset your password.</p>
            <input
              className="w-full rounded border border-zinc-300 px-3 py-2"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-emerald-800 transition-colors"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <div className="text-center mt-4">
              <Link href="/login" className="text-sm text-zinc-600 hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
