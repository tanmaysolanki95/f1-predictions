// Event predictions skeleton — shown instantly on navigation
export default function PredictionsLoading() {
  return (
    <main className="p-6 space-y-4">
      <div className="skeleton h-7 w-16 rounded-[var(--radius-md)] mb-2" />

      {/* Hero card */}
      <div className="bg-[var(--card)] border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] p-6 space-y-3">
        <div className="skeleton h-6 w-40 rounded-[var(--radius-md)]" />
        <div className="skeleton h-8 w-2/3 rounded-[var(--radius-md)]" />
        <div className="skeleton h-4 w-1/3 rounded-[var(--radius-md)]" />
      </div>

      {/* Predictions table card */}
      <div className="bg-[var(--card)] border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
        <div className="px-4 py-3 border-b border-[var(--glass-border)]">
          <div className="skeleton h-2 w-10 rounded-full mb-2" />
          <div className="skeleton h-4 w-36 rounded-[var(--radius-md)]" />
        </div>
        <div className="p-4">
          {/* Header row */}
          <div className="grid grid-cols-6 gap-2 mb-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-3 rounded-[var(--radius-md)]" style={{ width: `${40 + (i % 3) * 20}%` }} />
            ))}
          </div>
          {/* Data rows */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 py-3 border-t border-[var(--border)]">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="skeleton h-4 rounded-[var(--radius-md)]" style={{ width: `${50 + ((i + j) % 3) * 15}%` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
