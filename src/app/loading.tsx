// Dashboard skeleton — shown instantly on navigation
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Hero event card */}
      <div className="bg-[var(--card)] border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] p-6 space-y-4">
        <div className="skeleton h-9 w-2/3 rounded-[var(--radius-md)]" />
        <div className="skeleton h-4 w-1/3 rounded-[var(--radius-md)]" />
        {/* Countdown placeholder */}
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-14 w-16 rounded-[var(--radius-md)]" />
          ))}
        </div>
        <div className="skeleton h-10 w-36 rounded-[var(--radius-md)]" />
      </div>

      {/* Season Progress + Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
            <div className="px-4 py-3 border-b border-[var(--glass-border)]">
              <div className="skeleton h-2 w-10 rounded-full mb-2" />
              <div className="skeleton h-4 w-32 rounded-[var(--radius-md)]" />
            </div>
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="skeleton h-4 rounded-[var(--radius-md)]" style={{ width: `${80 - j * 10}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* News card */}
      <div className="bg-[var(--card)] border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
        <div className="px-4 py-3 border-b border-[var(--glass-border)]">
          <div className="skeleton h-2 w-10 rounded-full mb-2" />
          <div className="skeleton h-4 w-20 rounded-[var(--radius-md)]" />
        </div>
        <div className="p-4 divide-y divide-[var(--border)]">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="skeleton h-4 rounded-[var(--radius-md)]" style={{ width: `${55 + (i % 3) * 10}%` }} />
              <div className="skeleton h-3 w-6 rounded-[var(--radius-md)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
