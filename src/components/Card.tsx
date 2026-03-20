import React from "react";
import Link from "next/link";

type CardProps = {
  title?: React.ReactNode
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerHref?: string
}

export default function Card({ title, badge, children, className = '', headerHref }: CardProps) {
  const headerContent = (
    <div className="flex items-center justify-between">
      {title ? (
        <div>
          <div className="w-10 h-0.5 bg-[var(--f1-red)] rounded-full mb-2" />
          {typeof title === 'string' ? (
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          ) : (
            title
          )}
        </div>
      ) : (
        <span />
      )}
      {headerHref ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="text-[var(--muted)] group-hover:text-[var(--f1-red)] transition-colors flex-shrink-0"
        >
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        badge && <span className="text-xs text-white/90">{badge}</span>
      )}
    </div>
  );

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
        headerHref ? (
          <Link
            href={headerHref}
            className="group block px-4 py-3 border-b border-[var(--glass-border)] active:bg-white/5 transition-colors rounded-t-[var(--radius-lg)]"
          >
            {headerContent}
          </Link>
        ) : (
          <header className="px-4 py-3 border-b border-[var(--glass-border)]">
            {headerContent}
          </header>
        )
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}
