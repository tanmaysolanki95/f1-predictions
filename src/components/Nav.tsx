"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u?.user_metadata?.display_name ?? u?.email ?? null);
      setUserId(u?.id ?? null);
    });
  }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  if (pathname.startsWith("/auth")) return null;

  return (
    <header className="relative bg-[var(--surface)] border-b border-[var(--glass-border)]">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(to right, var(--f1-red), transparent)" }} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-titillium)' }}>
              F1 Predictions
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {LINKS.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "border-b-2 border-[var(--f1-red)] text-white"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                    style={{ fontFamily: 'system-ui, var(--font-titillium)' }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden md:flex items-center gap-2 text-sm text-white/70 border-l border-[var(--glass-border)] pl-3 pr-3 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {user}
              </span>
            )}
            {user && (
              <button
                onClick={handleLogout}
                className="hidden md:block text-xs text-white/40 hover:text-white/70 transition-colors border-l border-[var(--glass-border)] ml-2 pl-3 py-1"
              >
                Sign out
              </button>
            )}
            {user && (
              <Link href="/auth/change-password" className="hidden md:block text-xs text-white/40 hover:text-white/70 transition-colors border-l border-[var(--glass-border)] ml-2 pl-3 py-1">
                Change password
              </Link>
            )}
            {userId && (
              <Link href={`/profile/${userId}`} className="hidden md:block text-xs text-white/40 hover:text-white/70 transition-colors border-l border-[var(--glass-border)] ml-2 pl-3 py-1">
                My Profile
              </Link>
            )}
            <button
              className="md:hidden p-2 rounded-md text-white/70 hover:bg-white/10 focus:outline-none"
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5h16v2H2V5zm0 4h16v2H2V9zm0 4h16v2H2v-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu with transitions */}
      <div className={`md:hidden border-t border-[var(--glass-border)] overflow-hidden transition-all duration-300 ${open ? "max-h-40" : "max-h-0"}`}>
        <div className="bg-[var(--surface)]">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-white/80 hover:bg-white/5"
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-white/40 hover:text-white/70"
            >
              Sign out
            </button>
          )}
          {user && (
            <Link href="/auth/change-password" onClick={() => setOpen(false)} className="block w-full px-4 py-2 text-sm text-white/40 hover:text-white/70">
              Change password
            </Link>
          )}
          {userId && (
            <Link href={`/profile/${userId}`} onClick={() => setOpen(false)} className="block w-full px-4 py-2 text-sm text-white/40 hover:text-white/70">
              My Profile
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
