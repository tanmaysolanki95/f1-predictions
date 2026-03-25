"use client";

import Card from "@/components/Card";
import type { EventSession } from "@/types/database";

interface Props {
  sessions: Pick<EventSession, "session_type" | "date" | "time">[];
}

const SESSION_META: Record<
  EventSession["session_type"],
  { badge: string; name: string; tint: "red" | "blue" | "none" }
> = {
  fp1: { badge: "FP1", name: "Practice 1", tint: "none" },
  fp2: { badge: "FP2", name: "Practice 2", tint: "none" },
  fp3: { badge: "FP3", name: "Practice 3", tint: "none" },
  sprint_qualifying: { badge: "SQ", name: "Sprint Qualifying", tint: "none" },
  sprint_race: { badge: "SR", name: "Sprint Race", tint: "none" },
  qualifying: { badge: "QUALI", name: "Qualifying", tint: "blue" },
  race: { badge: "RACE", name: "Grand Prix", tint: "red" },
};

export default function SessionSchedule({ sessions }: Props) {
  if (sessions.length === 0) return null;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const sorted = [...sessions].sort((a, b) => {
    return (
      new Date(`${a.date}T${a.time}`).getTime() -
      new Date(`${b.date}T${b.time}`).getTime()
    );
  });

  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  });

  const dayFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    timeZone: tz,
  });

  const dateNumFormatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    timeZone: tz,
  });

  // Track last rendered day to group sessions
  let lastDayKey = "";

  return (
    <Card title="Weekend Schedule">
      <div>
        {sorted.map((session, i) => {
          const dt = new Date(`${session.date}T${session.time}`);
          const dayKey = dt.toLocaleDateString(undefined, {
            timeZone: tz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          const isNewDay = dayKey !== lastDayKey;
          lastDayKey = dayKey;

          const meta = SESSION_META[session.session_type] ?? {
            badge: session.session_type.toUpperCase(),
            name: session.session_type,
            tint: "none" as const,
          };

          const rowBg =
            meta.tint === "red"
              ? "bg-[var(--f1-red)]/5"
              : meta.tint === "blue"
              ? "bg-blue-500/5"
              : "";

          const badgeCls =
            meta.tint === "red"
              ? "bg-[var(--f1-red)]/20 text-[var(--f1-red)] border border-[var(--f1-red)]/30"
              : meta.tint === "blue"
              ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
              : "bg-[var(--f1-red)]/15 text-[var(--f1-red)] border border-[var(--f1-red)]/20";

          return (
            <div
              key={session.session_type}
              className={`flex items-center gap-3 px-1 py-3 ${
                i > 0 ? "border-t border-[var(--glass-border)]" : ""
              } ${rowBg}`}
            >
              {/* Day column — 52px, only populated on first session of each day */}
              <div className="w-[52px] flex-none text-center">
                {isNewDay && (
                  <>
                    <p className="text-[0.6rem] text-[var(--muted)] uppercase tracking-widest leading-none">
                      {dayFormatter.format(dt)}
                    </p>
                    <p
                      className={`text-lg font-extrabold leading-none mt-0.5 ${
                        meta.tint === "red" ? "text-[var(--f1-red)]" : "text-white"
                      }`}
                      style={{ fontFamily: "var(--font-titillium)" }}
                    >
                      {dateNumFormatter.format(dt)}
                    </p>
                  </>
                )}
              </div>

              {/* Session badge */}
              <span
                className={`text-[0.6rem] font-bold tracking-widest px-1.5 py-0.5 rounded flex-none ${badgeCls}`}
                style={{ fontFamily: "var(--font-titillium)" }}
              >
                {meta.badge}
              </span>

              {/* Full session name */}
              <span className="flex-1 text-sm text-[var(--text)]">{meta.name}</span>

              {/* Local time */}
              <span
                className={`text-sm font-mono flex-none ${
                  meta.tint === "red"
                    ? "text-[var(--f1-red)] font-bold"
                    : "text-[var(--muted)]"
                }`}
              >
                {timeFormatter.format(dt)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
