"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "../actions";
import Link from "next/link";
import Button from "@/components/Button";
import Card from "@/components/Card";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const backTo = searchParams.get("back") || "/";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (redirectTo) {
      formData.set("redirectTo", redirectTo);
    }
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const signupParams = new URLSearchParams();
  if (redirectTo) signupParams.set("redirect", redirectTo);
  if (backTo !== "/") signupParams.set("back", backTo);
  const signupHref = signupParams.size
    ? `/auth/signup?${signupParams.toString()}`
    : "/auth/signup";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1117] racing-stripe-bg px-4">
      <Card className="w-full max-w-md">
        <div className="border-t-2 border-[var(--f1-red)]" />
        <div className="p-6 space-y-4">
          <Link
            href={backTo}
            className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/80 transition-colors"
            style={{ fontFamily: 'var(--font-titillium)' }}
          >
            &larr; Back
          </Link>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-titillium)' }}>Sign in</h2>
          <p className="text-sm text-white/60">F1 Predictions Tracker</p>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1" style={{ fontFamily: 'var(--font-titillium)' }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-md bg-[var(--surface)] border border-[var(--glass-border)] px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-1" style={{ fontFamily: 'var(--font-titillium)' }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full rounded-md bg-[var(--surface)] border border-[var(--glass-border)] px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)]"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="flex items-center justify-center mt-4">
            <Link href="/auth/forgot-password" className="text-sm text-[var(--muted)] hover:text-[var(--f1-red)]" style={{ fontFamily: 'var(--font-titillium)' }}>
              Forgot password?
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-white/40">
            Don&apos;t have an account?{" "}
            <Link href={signupHref} className="text-[var(--f1-red)] hover:underline" style={{ fontFamily: 'var(--font-titillium)' }}>
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
