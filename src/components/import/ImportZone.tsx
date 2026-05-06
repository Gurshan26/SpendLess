'use client'

import Papa from 'papaparse'
import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/shared/Button'
import Tooltip from '@/components/shared/Tooltip'
import ColumnMapper from './ColumnMapper'
import ImportProgress from './ImportProgress'
import type { ParseError } from '@/lib/csv-parser'
import type { CSVColumnMapping } from '@/lib/types'

type LoadResult =
  | { ok: true; warnings: string[]; rowsProcessed: number; rowsSkipped: number }
  | { ok: false; error: ParseError }

interface ImportZoneProps {
  onLoadSample: () => void
  onParseCSV: (csvText: string, mapping?: CSVColumnMapping) => LoadResult
  onAIAssistMapping: (
    headers: string[],
    rows: Record<string, string>[],
  ) => Promise<Partial<CSVColumnMapping> | null>
  aiEnabled: boolean
  sampleTransactionCount: number
}

interface CsvPreview {
  headers: string[]
  rows: Record<string, string>[]
}

function parsePreview(csvText: string): CsvPreview {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    preview: 10,
  })

  const headers = parsed.meta.fields ?? []
  const rows = parsed.data.filter((row) => Object.values(row).some((value) => String(value).trim() !== ''))
  return { headers, rows }
}

function redactAmounts(rows: Record<string, string>[], amountColumn: string | undefined): Record<string, string>[] {
  return rows.map((row) => {
    const copy = { ...row }
    for (const key of Object.keys(copy)) {
      if (
        key === amountColumn ||
        /amount|debit|credit|value|sum/i.test(key)
      ) {
        copy[key] = 'REDACTED'
      }
    }
    return copy
  })
}

export default function ImportZone({
  onLoadSample,
  onParseCSV,
  onAIAssistMapping,
  aiEnabled,
  sampleTransactionCount,
}: ImportZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState<CsvPreview | null>(null)
  const [mappingGuess, setMappingGuess] = useState<Partial<CSVColumnMapping> | null>(null)
  const [showMapper, setShowMapper] = useState(false)
  const [showAIAssist, setShowAIAssist] = useState(false)

  useEffect(() => {
    if (!showMapper) return
    const id = window.setTimeout(() => setShowAIAssist(true), 3000)
    return () => window.clearTimeout(id)
  }, [showMapper])

  const onFile = async (file: File) => {
    setBusy(true)
    setError(null)
    setWarnings([])
    setShowAIAssist(false)

    try {
      const text = await file.text()
      setCsvText(text)
      const nextPreview = parsePreview(text)
      setPreview(nextPreview)

      const firstPass = onParseCSV(text)
      if (firstPass.ok) {
        setWarnings(firstPass.warnings)
        setShowMapper(false)
        setBusy(false)
        return
      }

      setError(firstPass.error.message)
      setShowMapper(firstPass.error.suggestManualMapping)
      setMappingGuess(inferGuess(nextPreview.headers))
    } catch {
      setError('That file could not be read. Try exporting your CSV again.')
    } finally {
      setBusy(false)
    }
  }

  const aiAssistDisabledReason = useMemo(() => {
    if (aiEnabled) return null
    return 'AI assist needs a Gemini API key — see .env.example'
  }, [aiEnabled])

  const handleAIAssist = async () => {
    if (!preview) return
    setBusy(true)
    setError(null)
    try {
      const maskedRows = redactAmounts(preview.rows, mappingGuess?.amountColumn)
      const suggested = await onAIAssistMapping(preview.headers, maskedRows)
      if (!suggested) {
        setError('AI could not confidently map those columns. Manual mapping is still available below.')
        return
      }

      setMappingGuess(suggested)
    } catch {
      setError('AI assist could not run right now. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  const handleApplyManualMapping = (mapping: CSVColumnMapping) => {
    if (!csvText) return
    const result = onParseCSV(csvText, mapping)
    if (result.ok) {
      setWarnings(result.warnings)
      setShowMapper(false)
      setError(null)
      return
    }

    setError(result.error.message)
  }

  return (
    <section className="space-y-4" data-testid="import-zone">
      <div className="space-y-2">
        <h1 className="hero-serif text-5xl leading-tight text-[var(--ink)] sm:text-6xl">
          SpendLens
        </h1>
        <p className="max-w-2xl text-lg text-[var(--ink-2)]">
          Drop your bank CSV here, or explore with our sample data first.
        </p>
      </div>

      <div className="soft-card border-dashed p-6">
        <div
          className={`rounded-2xl border-2 border-dashed p-6 transition-colors ${
            dragging ? 'border-[var(--accent)] bg-[var(--accent-light)]/50' : 'border-[var(--border-2)] bg-white'
          }`}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            const file = event.dataTransfer.files?.[0]
            if (file) {
              void onFile(file)
            }
          }}
        >
          <p className="text-base font-medium">Drag and drop your CSV</p>
          <p className="mt-1 text-sm text-[var(--ink-3)]">
            Works with Chase, BoA, Wells Fargo, Monzo, ANZ, CommBank, Mint exports and more.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center rounded-xl border border-[var(--border-2)] bg-white px-4 py-2 text-sm">
              Browse files
              <input
                aria-label="Upload CSV file"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    void onFile(file)
                  }
                }}
              />
            </label>

            <Button
              variant="primary"
              onClick={onLoadSample}
              data-testid="sample-data-btn"
              aria-label="Explore sample data"
            >
              Explore sample data ({sampleTransactionCount} transactions)
            </Button>
          </div>

          <p className="mt-4 text-xs text-[var(--ink-3)]">
            Everything is processed in your browser. Nothing is sent to our servers, unless you use optional AI tools.
          </p>
        </div>
      </div>

      <div className="card space-y-3 p-4" data-testid="csv-format-guide">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">CSV quick format guide</p>
            <p className="text-sm text-[var(--ink-2)]">
              Minimum columns needed: date, description/merchant, amount.
            </p>
          </div>
          <a
            href="/spendlens-template.csv"
            download
            className="rounded-xl border border-[var(--border-2)] bg-white px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--surface-2)]"
            aria-label="Download CSV template"
          >
            Download template CSV
          </a>
        </div>

        <div className="grid gap-3 text-sm text-[var(--ink-2)] md:grid-cols-2">
          <div className="rounded-lg bg-[var(--surface-2)] p-3">
            <p className="font-medium text-[var(--ink)]">Accepted formats</p>
            <p className="mt-1">Header examples: Date, Description, Amount, Category, Type.</p>
            <p className="mt-1">Amount can be `-89.50`, `89.50`, `$89.50`, or `1,234.56`.</p>
            <p className="mt-1">If your bank splits amounts, `Debit` + `Credit` columns also work.</p>
          </div>

          <div className="rounded-lg bg-[var(--surface-2)] p-3">
            <p className="font-medium text-[var(--ink)]">Conventions</p>
            <p className="mt-1">Debits can be negative or positive. SpendLens auto-detects both.</p>
            <p className="mt-1">Credits like salary are fine. They are treated as incoming cash.</p>
            <p className="mt-1">Mixed date styles are supported: `YYYY-MM-DD`, `MM/DD/YYYY`, `DD/MM/YYYY`.</p>
          </div>
        </div>
      </div>

      {busy ? <ImportProgress label="Crunching your transactions…" /> : null}

      {warnings.length > 0 ? (
        <div className="card p-4 text-sm text-[var(--warning)]">
          {warnings.length} row{warnings.length > 1 ? 's' : ''} skipped while parsing.
        </div>
      ) : null}

      {error ? (
        <div className="card space-y-2 border-[var(--critical)]/30 bg-[var(--critical-bg)] p-4 text-sm text-[var(--critical)]">
          <p>{error}</p>
          {showMapper ? (
            <p className="text-[var(--ink-2)]">
              Auto-detection missed something. Choose the columns below and you’re back on track.
            </p>
          ) : null}
        </div>
      ) : null}

      {showMapper && preview ? (
        <>
          <ColumnMapper
            headers={preview.headers}
            initialMapping={mappingGuess}
            onApply={handleApplyManualMapping}
          />

          {showAIAssist ? (
            <div className="flex items-center gap-3">
              {aiAssistDisabledReason ? (
                <Tooltip label={aiAssistDisabledReason}>
                  <span>
                    <Button variant="secondary" disabled aria-label="Let AI figure out columns">
                      Let AI figure it out
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <Button variant="secondary" onClick={handleAIAssist} loading={busy}>
                  Let AI figure it out
                </Button>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

function inferGuess(headers: string[]): Partial<CSVColumnMapping> {
  const lower = headers.map((header) => ({ raw: header, clean: header.toLowerCase().trim() }))

  const find = (patterns: string[]): string | undefined =>
    lower.find((item) => patterns.some((pattern) => item.clean.includes(pattern)))?.raw

  return {
    dateColumn: find(['date', 'posted']),
    descriptionColumn: find(['description', 'merchant', 'name']),
    amountColumn: find(['amount', 'debit', 'credit']),
    categoryColumn: find(['category', 'type']),
  }
}
