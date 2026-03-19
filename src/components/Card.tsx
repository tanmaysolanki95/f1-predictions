import React from "react";

type CardProps = {
  title?: string
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export default function Card({ title, badge, children, className = '' }: CardProps) {
  return (
    <section
      className={[
        "bg-[var(--card)] backdrop-blur-lg border border-[var(--glass-border)]",
        "rounded-[var(--radius-lg)]",
        "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
        "transition-shadow duration-200",
        className,
      ].filter(Boolean).join(" ")}
    >
      {(title || badge) && (
        <header className="px-4 py-3 border-b border-[var(--glass-border)]">
          <div className="flex items-center justify-between">
            {title ? (
              <div>
                <div className="w-10 h-0.5 bg-[var(--f1-red)] rounded-full mb-2" />
                <h3 className="text-sm font-semibold text-white">{title}</h3>
              </div>
            ) : (
              <span />
            )}
            {badge && <span className="text-xs text-white/90">{badge}</span>}
          </div>
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}
