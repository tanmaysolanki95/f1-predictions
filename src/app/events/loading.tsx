// Events page skeleton — shown instantly on navigation
export default function EventsLoading() {
  return (
    <main className="p-6">
      <div className="skeleton h-7 w-16 rounded-[var(--radius-md)] mb-4" />
      <div className="bg-[var(--card)] border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
        <div className="px-4 py-3 border-b border-[var(--glass-border)]">
          <div className="skeleton h-2 w-10 rounded-full mb-2" />
          <div className="skeleton h-4 w-28 rounded-[var(--radius-md)]" />
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="skeleton h-3 w-16 rounded-[var(--radius-md)]" />
                  <div className="skeleton h-6 w-8 rounded-full" />
                </div>
                <div className="skeleton h-5 w-3/4 rounded-[var(--radius-md)]" />
                <div className="skeleton h-4 w-1/2 rounded-[var(--radius-md)]" />
                <div className="skeleton h-3 w-1/3 rounded-[var(--radius-md)]" />
              </div>
              <div className="px-4 pb-3 flex gap-2">
                <div className="skeleton h-6 w-20 rounded-full" />
                <div className="skeleton h-6 w-24 rounded-[var(--radius-md)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
