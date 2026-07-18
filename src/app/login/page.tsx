"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.unverified) {
          router.push(`/verify?email=${encodeURIComponent(email)}`);
          return;
        }
        throw new Error(data.error || "Failed to log in");
      }

      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <h1 className="mb-4 text-2xl font-semibold">Login</h1>
        <form
          className="space-y-3 rounded border border-zinc-200 bg-white p-4 shadow-sm"
          onSubmit={handleLogin}
        >
          <input
            className="w-full rounded border border-zinc-300 px-3 py-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="w-full rounded border border-zinc-300 px-3 py-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-emerald-800 transition-colors"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <div className="mt-4 flex items-center justify-between">
            <Link href="/signup" className="text-sm text-emerald-700 hover:underline">
              Need an account? Sign up
            </Link>
            <Link href="/forgot-password" className="text-sm text-zinc-600 hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
