import React from "react";

type DataTableProps = {
  headers: string[]
  rows: Array<Array<React.ReactNode>>
  className?: string
}

export default function DataTable({ headers, rows, className = '' }: DataTableProps) {
  const manyColumns = headers.length > 4;
  return (
    <div className={`relative w-full overflow-x-auto ${className} rounded-[var(--radius-lg)] border border-[var(--glass-border)]`}>
      {manyColumns && (
        <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(96,165,250,.15), rgba(96,165,250,0))' }} />
      )}
      <table className="min-w-full divide-y divide-[var(--border)]">
        <thead className="bg-[var(--surface-elevated)]">
          <tr>
            {headers.map((h, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/80 tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 ? 'bg-[rgba(255,255,255,0.02)]' : ''}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-2 text-sm text-white/90 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {manyColumns && (
        <div className="md:hidden text-xs text-white/60 p-2">scroll →</div>
      )}
    </div>
  )
}
