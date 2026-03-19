"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Driver } from "@/types/database";
import DriverCard from "@/components/DriverCard";

type DriverPickerModalProps = {
  open: boolean;
  onClose: () => void;
  drivers: Driver[];
  onSelect: (driverId: string) => void;
  selectedId?: string;
  title: string;
};

export default function DriverPickerModal({
  open,
  onClose,
  drivers,
  onSelect,
  selectedId,
  title,
}: DriverPickerModalProps) {
  const [query, setQuery] = useState("");

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return drivers;
    return drivers.filter((d) => {
      const hay = `${d.first_name} ${d.last_name} ${d.code} ${d.team ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [drivers, query]);

  if (!open) return null;

  return (
    <div
      aria-label={title}
      role="dialog"
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      />
      <div
        className="relative w-full h-full md:h-auto mx-0 md:mx-6 md:my-6 animate-slide-up"
        style={{ maxWidth: "none" }}
      >
        <div className="absolute inset-0 md:inset-auto md:mx-auto md:w-full md:max-w-2xl mx-4 my-6 bg-[var(--surface)] border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden md:overflow-visible">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)] bg-[var(--surface-elevated)]">
            <h3 style={{ fontFamily: "var(--font-titillium)" }} className="text-lg font-semibold text-white">
              {title}
            </h3>
            <button
              aria-label="Close"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>
          </header>
          <div className="p-4 pt-2 border-b border-[var(--glass-border)]">
            <input
              type="text"
              placeholder="Search drivers by name, code or team"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--glass-border)] rounded px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)]"
            />
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[60vh] md:max-h-[70vh]">
            {filtered.map((d) => (
              <DriverCard
                key={d.id}
                driver={d}
                onClick={() => onSelect(d.id)}
                selected={selectedId === d.id}
                className="w-full"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
