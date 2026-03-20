// Profile page skeleton — shown instantly on navigation
export default function ProfileLoading() {
  return (
    <main className="p-6 space-y-4">
      <div className="skeleton h-7 w-16 rounded-[var(--radius-md)] mb-2" />

      {/* Profile header card */}
      <div className="bg-[var(--card)] border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] p-6 space-y-3">
        <div className="skeleton h-7 w-40 rounded-[var(--radius-md)]" />
        <div className="flex gap-6">
          <div className="skeleton h-5 w-24 rounded-[var(--radius-md)]" />
          <div className="skeleton h-5 w-28 rounded-[var(--radius-md)]" />
        </div>
      </div>

      {/* Season tabs */}
      <div className="flex gap-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="skeleton h-9 w-28 rounded-[var(--radius-md)]" />
        ))}
      </div>

      {/* Events table card */}
      <div className="bg-[var(--card)] border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
        <div className="px-4 py-3 border-b border-[var(--glass-border)]">
          <div className="skeleton h-2 w-10 rounded-full mb-2" />
          <div className="skeleton h-4 w-40 rounded-[var(--radius-md)]" />
        </div>
        <div className="p-4">
          {/* Header */}
          <div className="grid grid-cols-5 gap-3 mb-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-3 rounded-[var(--radius-md)]" style={{ width: `${40 + (i % 3) * 15}%` }} />
            ))}
          </div>
          {/* Rows */}
          {[...Array(7)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-3 py-3 border-t border-[var(--border)]">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="skeleton h-4 rounded-[var(--radius-md)]" style={{ width: `${55 + ((i + j) % 3) * 12}%` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
