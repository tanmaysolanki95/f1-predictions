"use client";

import { useState } from "react";
import { signup } from "../actions";
import Link from "next/link";
import Button from "@/components/Button";
import Card from "@/components/Card";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signup(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1117] racing-stripe-bg px-4">
      <Card className="w-full max-w-md">
        <div className="border-t-2 border-[var(--f1-red)]" />
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-titillium)' }}>Create account</h2>
          <p className="text-sm text-white/50 mb-2">Join your friends on F1 Predictions</p>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-white/70 mb-1" style={{ fontFamily: 'var(--font-titillium)' }}>
                Display name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                className="w-full rounded-md bg-[var(--surface)] border border-[var(--glass-border)] px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)]"
                placeholder="Your name"
              />
            </div>
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
                placeholder="Min 6 characters"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading} className="w-full">
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[var(--f1-red)] hover:underline" style={{ fontFamily: 'var(--font-titillium)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
