// Leaderboard skeleton — shown instantly on navigation
export default function LeaderboardLoading() {
  return (
    <main className="p-6">
      <div className="skeleton h-7 w-16 rounded-[var(--radius-md)] mb-4" />
      <div className="skeleton h-9 w-40 rounded-[var(--radius-md)] mb-4" />
      <div className="bg-[var(--card)] border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
        <div className="px-4 py-3 border-b border-[var(--glass-border)]">
          <div className="skeleton h-2 w-10 rounded-full mb-2" />
          <div className="skeleton h-4 w-40 rounded-[var(--radius-md)]" />
        </div>
        <div className="p-4">
          {/* Table header */}
          <div className="grid grid-cols-4 gap-4 mb-3">
            {["w-10", "w-16", "w-14", "w-14"].map((w, i) => (
              <div key={i} className={`skeleton h-3 ${w} rounded-[var(--radius-md)]`} />
            ))}
          </div>
          {/* Table rows */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 py-3 border-t border-[var(--border)]">
              <div className="skeleton h-4 w-6 rounded-[var(--radius-md)]" />
              <div className="skeleton h-4 rounded-[var(--radius-md)]" style={{ width: `${60 + (i % 4) * 10}%` }} />
              <div className="skeleton h-4 w-10 rounded-[var(--radius-md)]" />
              <div className="skeleton h-4 w-6 rounded-[var(--radius-md)]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
