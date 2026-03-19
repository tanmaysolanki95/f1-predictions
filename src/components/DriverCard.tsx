"use client";

import type { Driver } from "@/types/database";
import { teamColorHex } from "@/lib/teamColors";
import { getTeamLogoUrl } from "@/lib/teamLogos";

export default function DriverCard({
  driver,
  className = "",
  selected = false,
  compact = false,
  onClick,
}: {
  driver: Driver;
  className?: string;
  selected?: boolean;
  compact?: boolean;
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
        "driver-card animate-fade-in flex items-center border border-[var(--border)] overflow-hidden",
        "rounded-[var(--radius-lg)]",
        compact ? "gap-2 pr-3 min-h-[52px]" : "gap-3 pr-4 min-h-[80px]",
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
      <div className={`relative flex-none flex items-center justify-center ${compact ? "w-12 h-12" : "w-20 h-20"}`}>
        {driver.headshot_url ? (
          <img
            src={driver.headshot_url}
            alt={`${driver.first_name} ${driver.last_name}`}
            className={`rounded-full object-cover ${compact ? "w-9 h-9" : "w-16 h-16"}`}
            style={{ border: `2px solid ${color}` }}
          />
        ) : (
          <div
            className={`rounded-full flex items-center justify-center font-bold text-white/90 ${compact ? "w-9 h-9 text-xs" : "w-16 h-16 text-lg"}`}
            style={{ backgroundColor: `${color}20`, border: `2px solid ${color}` }}
          >
            {driver.code}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 py-1">
        {!compact && (
          <span
            className="text-2xl font-black text-white/20 select-none leading-none"
            style={{ fontFamily: "var(--font-titillium)" }}
          >
            {driver.number}
          </span>
        )}
        <p className={`leading-tight truncate ${compact ? "text-xs" : "text-sm"}`}>
          {compact ? (
            <span className="text-white font-semibold">{driver.code}</span>
          ) : (
            <>
              <span className="text-white/80 font-normal">{driver.first_name}</span>{" "}
              <span className="text-white font-bold uppercase">{driver.last_name}</span>
            </>
          )}
          {compact && <span className="text-white/50 ml-1">{driver.last_name}</span>}
        </p>
        {!compact && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {(() => {
              const logoUrl = driver.team ? getTeamLogoUrl(driver.team) : null;
              return logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="w-4 h-4 rounded-full bg-white object-contain flex-none"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null;
            })()}
            <span
              className="w-2 h-2 rounded-full inline-block flex-none"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-[var(--muted)] truncate">
              {driver.team ?? "Unknown"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
