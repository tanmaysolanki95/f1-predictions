"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/news", label: "News" },
];

export default function Nav({
  displayName,
  userId,
}: {
  displayName: string | null;
  userId: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

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
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-titillium)' }}>
              <svg viewBox="0 0 512 512" className="w-7 h-7 flex-none" aria-hidden="true">
                <defs>
                  <linearGradient id="nav-logo-bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#e10600"/>
                    <stop offset="100%" stopColor="#b30500"/>
                  </linearGradient>
                  <clipPath id="nav-logo-rr">
                    <rect width="512" height="512" rx="96"/>
                  </clipPath>
                </defs>
                <g clipPath="url(#nav-logo-rr)">
                  <rect width="512" height="512" fill="url(#nav-logo-bg)"/>
                  <g opacity="0.12">
                    <rect x="384" y="0" width="32" height="32" fill="#fff"/>
                    <rect x="448" y="0" width="32" height="32" fill="#fff"/>
                    <rect x="416" y="32" width="32" height="32" fill="#fff"/>
                    <rect x="480" y="32" width="32" height="32" fill="#fff"/>
                    <rect x="384" y="64" width="32" height="32" fill="#fff"/>
                    <rect x="448" y="64" width="32" height="32" fill="#fff"/>
                  </g>
                  <rect x="0" y="460" width="512" height="4" fill="#fff" opacity="0.25"/>
                  <text x="256" y="310" textAnchor="middle" fontFamily="Arial Black,Impact,sans-serif" fontWeight="900" fontSize="300" fill="#fff" letterSpacing="-15">P1</text>
                </g>
              </svg>
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
            {displayName && (
              <span className="hidden md:flex items-center gap-2 text-sm text-white/70 border-l border-[var(--glass-border)] pl-3 pr-3 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {displayName}
              </span>
            )}
            {displayName && (
              <button
                onClick={handleLogout}
                className="hidden md:block text-xs text-white/40 hover:text-white/70 transition-colors border-l border-[var(--glass-border)] ml-2 pl-3 py-1"
              >
                Sign out
              </button>
            )}
            {displayName && (
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
      <div className={`md:hidden border-t border-[var(--glass-border)] overflow-hidden transition-all duration-300 ${open ? "max-h-80" : "max-h-0"}`}>
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
          {displayName && (
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-white/40 hover:text-white/70"
            >
              Sign out
            </button>
          )}
          {displayName && (
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
