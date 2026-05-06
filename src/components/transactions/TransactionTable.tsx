'use client'

import { useMemo, useState } from 'react'
import Button from '@/components/shared/Button'
import TransactionFilters from './TransactionFilters'
import TransactionRow from './TransactionRow'
import TransactionDetail from './TransactionDetail'
import type { Anomaly, Category, Transaction } from '@/lib/types'
import type { SortKey } from '@/hooks/useTransactions'

interface TransactionTableProps {
  transactions: Transaction[]
  anomalyMap: Map<string, Anomaly[]>
  onRecategorise: (transaction: Transaction) => Promise<string>
  onExportCSV: (rows: Transaction[]) => void
}

export default function TransactionTable({
  transactions,
  anomalyMap,
  onRecategorise,
  onExportCSV,
}: TransactionTableProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [minAmount, setMinAmount] = useState(0)
  const [maxAmount, setMaxAmount] = useState(0)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [anomalyOnly, setAnomalyOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [recategoriseLoading, setRecategoriseLoading] = useState(false)
  const [recategoriseResult, setRecategoriseResult] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = [...transactions]
    const q = query.trim().toLowerCase()

    if (q) {
      result = result.filter(
        (txn) =>
          txn.merchant.toLowerCase().includes(q) ||
          txn.description.toLowerCase().includes(q) ||
          txn.category.toLowerCase().includes(q),
      )
    }

    if (category !== 'all') result = result.filter((txn) => txn.category === category)
    if (minAmount > 0) result = result.filter((txn) => txn.amount >= minAmount)
    if (maxAmount > 0) result = result.filter((txn) => txn.amount <= maxAmount)

    if (fromDate) {
      const from = new Date(fromDate)
      result = result.filter((txn) => txn.date >= from)
    }

    if (toDate) {
      const to = new Date(toDate)
      to.setHours(23, 59, 59, 999)
      result = result.filter((txn) => txn.date <= to)
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
    fromDate,
    maxAmount,
    minAmount,
    query,
    sortBy,
    sortDirection,
    toDate,
    transactions,
  ])

  const selectedAnomalies = selectedTransaction ? anomalyMap.get(selectedTransaction.id) ?? [] : []

  const runRecategorise = async (transaction: Transaction): Promise<string> => {
    setRecategoriseLoading(true)
    setRecategoriseResult(null)
    try {
      const result = await onRecategorise(transaction)
      setRecategoriseResult(result)
      return result
    } finally {
      setRecategoriseLoading(false)
    }
  }

  return (
    <section data-testid="transaction-table" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Transaction Explorer</h2>
          <p className="section-subtitle">Search, filter, inspect, and export your transactions.</p>
        </div>
        <Button variant="secondary" onClick={() => onExportCSV(filtered)} aria-label="Export filtered CSV">
          Export filtered CSV
        </Button>
      </div>

      <TransactionFilters
        query={query}
        setQuery={setQuery}
        category={category}
        setCategory={setCategory}
        minAmount={minAmount}
        setMinAmount={setMinAmount}
        maxAmount={maxAmount}
        setMaxAmount={setMaxAmount}
        fromDate={fromDate}
        toDate={toDate}
        setFromDate={setFromDate}
        setToDate={setToDate}
        anomalyOnly={anomalyOnly}
        setAnomalyOnly={setAnomalyOnly}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
      />

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--ink-3)]">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Merchant</th>
                <th className="hidden px-3 py-2 lg:table-cell">Category</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="hidden px-3 py-2 text-center md:table-cell">Flag</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  hasAnomaly={anomalyMap.has(transaction.id)}
                  onClick={(txn) => {
                    setSelectedTransaction(txn)
                    setRecategoriseResult(null)
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>

        <TransactionDetail
          transaction={selectedTransaction}
          anomalies={selectedAnomalies}
          onRecategorise={runRecategorise}
          recategoriseLoading={recategoriseLoading}
          recategoriseResult={recategoriseResult}
        />
      </div>
    </section>
  )
}
