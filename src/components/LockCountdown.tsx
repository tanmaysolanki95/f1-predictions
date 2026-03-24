"use client";

import { useEffect, useState } from "react";

type LockCountdownProps = {
  lockDate: string | null;
  lockTime: string | null;
};

export default function LockCountdown({ lockDate, lockTime }: LockCountdownProps) {
  // null = not yet mounted (avoids hydration flash)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!lockDate || !lockTime) return;

    let dateTime: Date;
    try {
      const hasZone = lockTime.includes("Z") || lockTime.includes("+");
      const timeString = hasZone ? lockTime : `${lockTime}Z`;
      dateTime = new Date(`${lockDate}T${timeString}`);
      if (isNaN(dateTime.getTime())) return;
    } catch {
      return;
    }

    const tick = () => {
      const diffSec = Math.floor((dateTime.getTime() - Date.now()) / 1000);
      setTimeLeft(Math.max(0, diffSec));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockDate, lockTime]);

  // Not mounted, no data, or already locked — show nothing
  if (timeLeft === null || timeLeft <= 0) return null;

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2 pt-2 mt-1 border-t border-[var(--glass-border)]">
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-amber-500 flex-shrink-0"
        aria-hidden="true"
      >
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
      </svg>
      <span
        className="text-xs text-[var(--muted)] uppercase tracking-wider"
        style={{ fontFamily: "var(--font-titillium)" }}
      >
        Predictions lock in
      </span>
      <span
        className="text-sm font-bold text-amber-500"
        style={{ fontFamily: "var(--font-titillium)" }}
      >
        {days > 0 ? `${days}d ` : ""}{timeStr}
      </span>
    </div>
  );
}
