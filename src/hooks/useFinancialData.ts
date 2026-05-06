'use client'

import { useMemo, useState } from 'react'
import { buildFinancialSummary } from '@/lib/financial-summary'
import { detectColumnMapping, parseCSV, type ParseError } from '@/lib/csv-parser'
import { SAMPLE_TRANSACTIONS } from '@/lib/sample-data'
import type { CSVColumnMapping, FinancialSummary, Transaction } from '@/lib/types'

interface LoadCSVSuccess {
  ok: true
  warnings: string[]
  rowsProcessed: number
  rowsSkipped: number
}

interface LoadCSVFailure {
  ok: false
  error: ParseError
}

export function useFinancialData() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [lastError, setLastError] = useState<ParseError | null>(null)
  const [lastMappingGuess, setLastMappingGuess] = useState<Partial<CSVColumnMapping> | null>(null)

  const hasData = transactions.length > 0

  const loadTransactions = (nextTransactions: Transaction[]) => {
    const sorted = [...nextTransactions].sort((a, b) => a.date.getTime() - b.date.getTime())
    setTransactions(sorted)
    setSummary(buildFinancialSummary(sorted))
    setLastError(null)
  }

  const loadSampleData = () => {
    loadTransactions(SAMPLE_TRANSACTIONS)
    setWarnings([])
  }

  const guessMapping = (headers: string[]) => {
    const mapping = detectColumnMapping(headers)
    setLastMappingGuess(mapping)
    return mapping
  }

  const loadCSVText = (csvText: string, manualMapping?: CSVColumnMapping): LoadCSVSuccess | LoadCSVFailure => {
    const result = parseCSV(csvText, manualMapping)
    if ('type' in result) {
      setLastError(result)
      return { ok: false, error: result }
    }

    loadTransactions(result.transactions)
    setWarnings(result.warnings)
    setLastError(null)

    return {
      ok: true,
      warnings: result.warnings,
      rowsProcessed: result.rowsProcessed,
      rowsSkipped: result.rowsSkipped,
    }
  }

  const reset = () => {
    setTransactions([])
    setSummary(null)
    setWarnings([])
    setLastError(null)
    setLastMappingGuess(null)
  }

  return {
    transactions,
    summary,
    hasData,
    warnings,
    lastError,
    lastMappingGuess,
    loadSampleData,
    loadCSVText,
    guessMapping,
    loadTransactions,
    reset,
  }
}

export type FinancialDataStore = ReturnType<typeof useFinancialData>

export function usePeerComparison(summary: FinancialSummary | null) {
  return useMemo(() => summary?.categoryBreakdown ?? [], [summary])
}
