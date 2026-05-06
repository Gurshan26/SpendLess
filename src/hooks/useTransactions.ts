'use client'

import { useMemo, useState } from 'react'
import { anomaliesByTransactionId } from '@/lib/financial-summary'
import type { Anomaly, Category, Transaction } from '@/lib/types'

export type SortKey = 'date' | 'amount' | 'merchant'

interface DateRange {
  from: string
  to: string
}

export function useTransactions(transactions: Transaction[], anomalies: Anomaly[]) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [minAmount, setMinAmount] = useState<number>(0)
  const [maxAmount, setMaxAmount] = useState<number>(0)
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' })
  const [anomalyOnly, setAnomalyOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const anomalyMap = useMemo(() => anomaliesByTransactionId(anomalies), [anomalies])

  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase()
    let result = [...transactions]

    if (q) {
      result = result.filter(
        (txn) =>
          txn.description.toLowerCase().includes(q) ||
          txn.merchant.toLowerCase().includes(q) ||
          txn.category.toLowerCase().includes(q),
      )
    }

    if (category !== 'all') {
      result = result.filter((txn) => txn.category === category)
    }

    if (minAmount > 0) {
      result = result.filter((txn) => txn.amount >= minAmount)
    }

    if (maxAmount > 0) {
      result = result.filter((txn) => txn.amount <= maxAmount)
    }

    if (dateRange.from) {
      const fromDate = new Date(dateRange.from)
      result = result.filter((txn) => txn.date >= fromDate)
    }

    if (dateRange.to) {
      const toDate = new Date(dateRange.to)
      toDate.setHours(23, 59, 59, 999)
      result = result.filter((txn) => txn.date <= toDate)
    }

    if (anomalyOnly) {
      result = result.filter((txn) => anomalyMap.has(txn.id))
    }

    result.sort((a, b) => {
      let compare = 0
      if (sortBy === 'date') compare = a.date.getTime() - b.date.getTime()
      if (sortBy === 'amount') compare = a.amount - b.amount
      if (sortBy === 'merchant') compare = a.merchant.localeCompare(b.merchant)
      return sortDirection === 'asc' ? compare : -compare
    })

    return result
  }, [
    anomalyMap,
    anomalyOnly,
    category,
    dateRange.from,
    dateRange.to,
    maxAmount,
    minAmount,
    query,
    sortBy,
    sortDirection,
    transactions,
  ])

  const exportCSV = (): string => {
    const lines = [
      'Date,Merchant,Description,Category,Type,Amount,Anomaly',
      ...filteredTransactions.map((txn) => {
        const date = txn.date.toISOString().slice(0, 10)
        const anomaly = anomalyMap.has(txn.id) ? 'Yes' : 'No'
        return [
          date,
          csvEscape(txn.merchant),
          csvEscape(txn.description),
          csvEscape(txn.category),
          txn.type,
          txn.amount.toFixed(2),
          anomaly,
        ].join(',')
      }),
    ]

    return lines.join('\n')
  }

  const resetFilters = () => {
    setQuery('')
    setCategory('all')
    setMinAmount(0)
    setMaxAmount(0)
    setDateRange({ from: '', to: '' })
    setAnomalyOnly(false)
    setSortBy('date')
    setSortDirection('desc')
  }

  return {
    query,
    setQuery,
    category,
    setCategory,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    dateRange,
    setDateRange,
    anomalyOnly,
    setAnomalyOnly,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    filteredTransactions,
    exportCSV,
    resetFilters,
  }
}

function csvEscape(value: string): string {
  const escaped = value.replace(/"/g, '""')
  return `"${escaped}"`
}
