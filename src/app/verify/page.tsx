"use client";

import { useState, Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify");
      }

      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form
      className="space-y-4 rounded border border-zinc-200 bg-white p-6 shadow-sm text-center"
      onSubmit={handleVerify}
    >
      <p className="text-sm text-zinc-600 mb-2">
        We sent a 6-digit verification code to <strong>{email}</strong>.
      </p>
      <input
        className="w-full text-center tracking-widest text-xl rounded border border-zinc-300 px-3 py-2"
        type="text"
        placeholder="123456"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        required
        maxLength={6}
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-emerald-800 transition-colors"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>
    </form>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <h1 className="mb-4 text-2xl font-semibold">Verify Email</h1>
        <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
          <VerifyForm />
        </Suspense>
      </main>
    </div>
  );
}
