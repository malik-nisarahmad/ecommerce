"use client";

import { useState, Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="p-4 rounded border border-red-200 bg-red-50 text-red-900 text-center">
        Invalid or missing reset token. Please request a new password reset link.
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
        <h2 className="text-lg font-semibold mb-2">Password Reset Successful!</h2>
        <p className="text-sm mb-4">Your password has been changed successfully. You are now logged in.</p>
        <Link href="/" className="inline-block rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 transition-colors">
          Continue to Home
        </Link>
      </div>
    );
  }

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form
      className="space-y-4 rounded border border-zinc-200 bg-white p-6 shadow-sm"
      onSubmit={handleReset}
    >
      <p className="text-sm text-zinc-600 mb-2">
        Please enter your new password below.
      </p>
      <input
        className="w-full rounded border border-zinc-300 px-3 py-2"
        type="password"
        placeholder="New Password (min 8 characters)"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        minLength={8}
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading || password.length < 8}
        className="w-full rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-emerald-800 transition-colors"
      >
        {loading ? "Saving..." : "Save New Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <h1 className="mb-4 text-2xl font-semibold">Choose New Password</h1>
        <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
          <ResetForm />
        </Suspense>
      </main>
    </div>
  );
}
