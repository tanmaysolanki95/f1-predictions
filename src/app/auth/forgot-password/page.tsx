"use client";

import { useState } from "react";
import { resetPassword } from "../actions";
import Link from "next/link";
import Button from "@/components/Button";
import Card from "@/components/Card";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await resetPassword(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      setSuccess(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1117] racing-stripe-bg px-4">
      <Card className="w-full max-w-md">
        <div className="border-t-2 border-[var(--f1-red)]" />
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-titillium)' }}>Reset password</h2>
          <p className="text-sm text-white/60">Enter your email and we'll send you a reset link</p>

          {success && (
            <div className="mb-4 p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-300 text-sm">
              Check your email for a reset link
            </div>
          )}

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
            <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            Remembered your password?{" "}
            <Link href="/auth/login" className="text-[var(--f1-red)] hover:underline" style={{ fontFamily: 'var(--font-titillium)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
