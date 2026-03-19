"use client";

import type { Driver } from "@/types/database";
import { teamColorHex } from "@/lib/teamColors";

export default function DriverCard({
  driver,
  className = "",
  selected = false,
  onClick,
}: {
  driver: Driver;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const color = teamColorHex(driver);
  const clickable = typeof onClick === "function";
  const selectedShadow = selected
    ? `0 0 0 2px ${color}, 0 0 16px ${color}40`
    : undefined;

  return (
    <div
      className={[
        "driver-card animate-fade-in flex items-center gap-3 border border-[var(--border)] overflow-hidden pr-4 min-h-[80px]",
        "rounded-[var(--radius-lg)]",
        clickable ? "cursor-pointer" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        borderLeft: `4px solid ${color}`,
        background: `linear-gradient(90deg, ${color}14 0%, transparent 60%)`,
        boxShadow: selectedShadow,
      }}
      onClick={onClick}
    >
      <div className="relative w-20 h-20 flex-none flex items-center justify-center">
        {driver.headshot_url ? (
          <img
            src={driver.headshot_url}
            alt={`${driver.first_name} ${driver.last_name}`}
            className="w-16 h-16 rounded-full object-cover"
            style={{ border: `2px solid ${color}` }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white/90"
            style={{ backgroundColor: `${color}20`, border: `2px solid ${color}` }}
          >
            {driver.code}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 py-2">
        <span
          className="text-2xl font-black text-white/20 select-none leading-none"
          style={{ fontFamily: "var(--font-titillium)" }}
        >
          {driver.number}
        </span>
        <p className="text-sm leading-tight truncate">
          <span className="text-white/80 font-normal">{driver.first_name}</span>{" "}
          <span className="text-white font-bold uppercase">{driver.last_name}</span>
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="w-2 h-2 rounded-full inline-block flex-none"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-[var(--muted)] truncate">
            {driver.team ?? "Unknown"}
          </span>
        </div>
      </div>
    </div>
  );
}
