'use client'

import { useState } from 'react'

interface TooltipProps {
  label: string
  children: React.ReactNode
}

export default function Tooltip({ label, children }: TooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span>{children}</span>
      {open ? (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-xs text-[var(--ink-2)] shadow-sm"
        >
          {label}
        </span>
      ) : null}
    </span>
  )
}
