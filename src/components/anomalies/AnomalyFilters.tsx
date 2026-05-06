'use client'

import type { SeverityFilter } from '@/hooks/useAnomalies'

interface AnomalyFiltersProps {
  value: SeverityFilter
  onChange: (value: SeverityFilter) => void
}

const FILTERS: Array<{ key: SeverityFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warnings' },
  { key: 'info', label: 'Info' },
]

export default function AnomalyFilters({ value, onChange }: AnomalyFiltersProps) {
  return (
    <div className="inline-flex rounded-xl border border-[var(--border)] bg-white p-1" role="tablist" aria-label="Anomaly filters">
      {FILTERS.map((filter) => (
        <button
          key={filter.key}
          role="tab"
          aria-selected={value === filter.key}
          onClick={() => onChange(filter.key)}
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            value === filter.key ? 'bg-[var(--surface-3)] text-[var(--ink)]' : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
