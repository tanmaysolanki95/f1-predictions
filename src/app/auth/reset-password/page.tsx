"use client";

import { useEffect, useState } from "react";
import { updatePassword } from "../actions";
import Card from "@/components/Card";
import Button from "@/components/Button";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (password && confirm && password !== confirm) {
      setError("Passwords do not match");
    } else {
      setError(null);
    }
  }, [password, confirm]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.set("password", password);
    const result = await updatePassword(formData);
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
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-titillium)' }}>Set new password</h2>
          <p className="text-sm text-white/60">Choose a strong password</p>

          {error && (
            <div className="mb-2 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1" style={{ fontFamily: 'var(--font-titillium)' }}>
                New password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md bg-[var(--surface)] border border-[var(--glass-border)] px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)]"
                placeholder="New password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1" style={{ fontFamily: 'var(--font-titillium)' }}>
                Confirm password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-md bg-[var(--surface)] border border-[var(--glass-border)] px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)]"
                placeholder="Confirm password"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading} className="w-full">
              {loading ? "Updating..." : "Set password"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
