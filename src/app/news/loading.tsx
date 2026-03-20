// News page skeleton — shown instantly on navigation
export default function NewsLoading() {
  return (
    <main className="p-6 space-y-4">
      <div className="skeleton h-7 w-16 rounded-[var(--radius-md)] mb-2" />
      <div className="skeleton h-7 w-24 rounded-[var(--radius-md)]" />
      <div className="skeleton h-4 w-44 rounded-[var(--radius-md)]" />
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--glass-border)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-sm)]">
            <div className="skeleton w-full h-40" style={{ borderRadius: 0 }} />
            <div className="p-4 space-y-2">
              <div className="skeleton h-4 w-full rounded-[var(--radius-md)]" />
              <div className="skeleton h-4 w-4/5 rounded-[var(--radius-md)]" />
              <div className="skeleton h-3 w-full rounded-[var(--radius-md)]" />
              <div className="flex items-center justify-between mt-2">
                <div className="skeleton h-5 w-16 rounded-[var(--radius-md)]" />
                <div className="skeleton h-3 w-10 rounded-[var(--radius-md)]" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
