"use client";

import { useEffect, useState } from "react";

type RaceCountdownProps = {
  targetDate: string;
  targetTime: string | null;
  sessionLabel?: string;
};

export default function RaceCountdown({ targetDate, targetTime, sessionLabel }: RaceCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    let dateTime: Date;
    try {
      const timePart = targetTime ?? "00:00:00Z";
      const hasZone = timePart.includes("Z") || timePart.includes("+");
      const timeString = hasZone ? timePart : `${timePart}Z`;
      dateTime = new Date(`${targetDate}T${timeString}`);
      if (isNaN(dateTime.getTime())) {
        dateTime = new Date(`${targetDate}T00:00:00Z`);
      }
    } catch {
      dateTime = new Date();
    }

    const tick = () => {
      const diffSec = Math.floor((dateTime.getTime() - Date.now()) / 1000);
      setTimeLeft(Math.max(0, diffSec));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate, targetTime]);

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const showLightsOut = timeLeft <= 0;

  if (showLightsOut) {
    return (
      <div className="countdown animate-pulse-glow" aria-label="lights-out">
        <span className="countdown-value" style={{ fontFamily: 'var(--font-titillium)', fontWeight: 900 }}>
          LIGHTS OUT
        </span>
      </div>
    );
  }

  const Segment = ({ value, label }: { value: string | number; label: string; }) => (
    <div className="countdown-segment" aria-label={label}>
      <div className="countdown-value" style={{ fontFamily: 'var(--font-titillium)', fontWeight: 900 }}>
        {value}
      </div>
      <div className="countdown-label" style={{ fontFamily: 'var(--font-titillium)' }}>
        {label}
      </div>
    </div>
  );

  return (
    <div>
      {sessionLabel && (
        <p
          className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1"
          style={{ fontFamily: "var(--font-titillium)" }}
        >
          {sessionLabel}
        </p>
      )}
      <div className={`countdown ${days === 0 ? "animate-pulse-glow" : ""}`} aria-label="countdown">
        <Segment value={days} label="Days" />
        <span className="countdown-separator">:</span>
        <Segment value={String(hours).padStart(2, "0")} label="Hours" />
        <span className="countdown-separator">:</span>
        <Segment value={String(minutes).padStart(2, "0")} label="Minutes" />
        <span className="countdown-separator">:</span>
        <Segment value={String(seconds).padStart(2, "0")} label="Seconds" />
      </div>
    </div>
  );
}
