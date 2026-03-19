"use client";

import React, { useMemo, useState, useEffect } from 'react'
import { Driver } from '@/types/database'
import { teamColorHex } from '@/lib/teamColors'
import DriverPickerModal from '@/components/DriverPickerModal'

type Props = {
  drivers: Driver[]
  value?: string
  onChange: (id: string) => void
}


export default function DriverSelect({ drivers, value, onChange }: Props) {
  const selected = useMemo(() => drivers.find((d) => d.id === value), [drivers, value])
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const update = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768)
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const onTriggerClick = () => {
    if (isMobile) {
      setModalOpen(true)
    } else {
      setOpen((v) => !v)
    }
  }

  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium text-white mb-1" style={{ fontFamily: 'var(--font-titillium)' }}>Driver</label>
      <div className="relative">
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--glass-border)] px-3 py-2 text-sm text-white hover:bg-[var(--surface-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)] transition-colors"
          onClick={onTriggerClick}
        >
          <span className="flex items-center gap-2">
            {selected && (
              <span
                aria-label="team color"
                style={{ width: 10, height: 10, borderRadius: '999px', backgroundColor: teamColorHex(selected) }}
              />
            )}
            {selected ? (
              <span className="flex items-center gap-2">
                {selected.headshot_url ? (
                  <img
                    src={selected.headshot_url}
                    alt={selected.code}
                    width={24}
                    height={24}
                    style={{ borderRadius: 999, objectFit: 'cover' }}
                  />
                ) : (
                  <span
                    aria-label="headshot placeholder"
                    style={{ width: 24, height: 24, borderRadius: 999, backgroundColor: '#374151' }}
                  />
                )}
                <span>
                  {`${selected.code} ${selected.first_name} ${selected.last_name}`}
                </span>
              </span>
            ) : (
              <span>Select driver</span>
            )}
          </span>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M5.5 7h9a1 1 0 110 2h-9a1 1 0 110-2zm0 4h9a1 1 0 110 2h-9a1 1 0 110-2z" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-10 mt-1 w-full bg-[var(--surface)] border border-[var(--glass-border)] rounded-[var(--radius-md)] shadow-lg max-h-60 overflow-auto hidden md:block">
            {drivers.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-elevated)] cursor-pointer transition-colors"
                onClick={() => {
                  onChange(d.id)
                  setOpen(false)
                }}
              >
                <span
                  aria-label="team color"
                  style={{ width: 10, height: 10, borderRadius: '999px', backgroundColor: teamColorHex(d) }}
                />
                {d.headshot_url ? (
                  <img src={d.headshot_url} alt={d.code} width={24} height={24} style={{ borderRadius: 999, objectFit: 'cover' }} />
                ) : (
                  <span style={{ width: 24, height: 24, borderRadius: 999, backgroundColor: '#374151' }} />
                )}
                <span className="text-sm">{`${d.code} ${d.first_name} ${d.last_name}`}</span>
                <span className="text-xs text-[var(--muted)] ml-auto">{d.team ?? 'Unknown'}</span>
              </div>
            ))}
          </div>
        )}
        <DriverPickerModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          drivers={drivers}
          onSelect={(driverId: string) => {
            onChange(driverId)
            setModalOpen(false)
          }}
          selectedId={value}
          title="Select Driver"
        />
      </div>
    </div>
  )
}
