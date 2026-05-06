'use client'

import React from 'react'
import type { CSVColumnMapping } from '@/lib/types'
import Button from '@/components/shared/Button'

interface ColumnMapperProps {
  headers: string[]
  initialMapping?: Partial<CSVColumnMapping> | null
  onApply: (mapping: CSVColumnMapping) => void
}

export default function ColumnMapper({ headers, initialMapping, onApply }: ColumnMapperProps) {
  const dateFallback = headers[0] ?? ''
  const descriptionFallback = headers[1] ?? headers[0] ?? ''
  const amountFallback = headers[2] ?? headers[0] ?? ''

  const [dateColumn, setDateColumn] = React.useState(initialMapping?.dateColumn ?? dateFallback)
  const [descriptionColumn, setDescriptionColumn] = React.useState(
    initialMapping?.descriptionColumn ?? descriptionFallback,
  )
  const [amountColumn, setAmountColumn] = React.useState(initialMapping?.amountColumn ?? amountFallback)
  const [categoryColumn, setCategoryColumn] = React.useState(initialMapping?.categoryColumn ?? '')

  const canApply = Boolean(dateColumn && descriptionColumn && amountColumn)

  return (
    <div className="card mt-4 space-y-4 p-4" data-testid="column-mapper">
      <p className="text-sm text-[var(--ink-2)]">
        Quick fix: map the columns once and we’ll handle the rest.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Date column</span>
          <select
            aria-label="Date column"
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            value={dateColumn}
            onChange={(event) => setDateColumn(event.target.value)}
          >
            {headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span>Description column</span>
          <select
            aria-label="Description column"
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            value={descriptionColumn}
            onChange={(event) => setDescriptionColumn(event.target.value)}
          >
            {headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span>Amount column</span>
          <select
            aria-label="Amount column"
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            value={amountColumn}
            onChange={(event) => setAmountColumn(event.target.value)}
          >
            {headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span>Category column (optional)</span>
          <select
            aria-label="Category column"
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            value={categoryColumn}
            onChange={(event) => setCategoryColumn(event.target.value)}
          >
            <option value="">Not in this file</option>
            {headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Button
        variant="secondary"
        disabled={!canApply}
        onClick={() =>
          onApply({
            dateColumn,
            descriptionColumn,
            amountColumn,
            categoryColumn: categoryColumn || undefined,
          })
        }
      >
        Apply mapping
      </Button>
    </div>
  )
}
