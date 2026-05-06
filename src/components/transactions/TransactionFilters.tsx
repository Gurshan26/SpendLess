'use client'

import type { Category } from '@/lib/types'
import type { SortKey } from '@/hooks/useTransactions'

interface TransactionFiltersProps {
  query: string
  setQuery: (value: string) => void
  category: Category | 'all'
  setCategory: (value: Category | 'all') => void
  minAmount: number
  setMinAmount: (value: number) => void
  maxAmount: number
  setMaxAmount: (value: number) => void
  fromDate: string
  toDate: string
  setFromDate: (value: string) => void
  setToDate: (value: string) => void
  anomalyOnly: boolean
  setAnomalyOnly: (value: boolean) => void
  sortBy: SortKey
  setSortBy: (value: SortKey) => void
  sortDirection: 'asc' | 'desc'
  setSortDirection: (value: 'asc' | 'desc') => void
}

const CATEGORIES: Array<Category | 'all'> = [
  'all',
  'Groceries',
  'Dining & Restaurants',
  'Transport',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Healthcare',
  'Travel',
  'Subscriptions',
  'Income',
  'Transfers',
  'Fees & Charges',
  'Education',
  'Personal Care',
  'Other',
]

export default function TransactionFilters({
  query,
  setQuery,
  category,
  setCategory,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  anomalyOnly,
  setAnomalyOnly,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
}: TransactionFiltersProps) {
  return (
    <div className="card grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
      <label className="space-y-1 text-sm">
        <span>Search</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Merchant or description"
          aria-label="Search transactions"
          className="w-full rounded-lg border border-[var(--border)] px-2 py-1.5"
        />
      </label>

      <label className="space-y-1 text-sm">
        <span>Category</span>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as Category | 'all')}
          aria-label="Filter category"
          className="w-full rounded-lg border border-[var(--border)] px-2 py-1.5"
        >
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item === 'all' ? 'All categories' : item}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span>Amount range</span>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            value={minAmount || ''}
            onChange={(event) => setMinAmount(Number(event.target.value) || 0)}
            placeholder="Min"
            aria-label="Minimum amount"
            className="w-full rounded-lg border border-[var(--border)] px-2 py-1.5"
          />
          <input
            type="number"
            min={0}
            value={maxAmount || ''}
            onChange={(event) => setMaxAmount(Number(event.target.value) || 0)}
            placeholder="Max"
            aria-label="Maximum amount"
            className="w-full rounded-lg border border-[var(--border)] px-2 py-1.5"
          />
        </div>
      </label>

      <div className="space-y-1 text-sm">
        <span>Date range</span>
        <div className="flex gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            aria-label="From date"
            className="w-full rounded-lg border border-[var(--border)] px-2 py-1.5"
          />
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            aria-label="To date"
            className="w-full rounded-lg border border-[var(--border)] px-2 py-1.5"
          />
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={anomalyOnly}
          onChange={(event) => setAnomalyOnly(event.target.checked)}
          data-testid="filter-anomalies"
          aria-label="Only show anomalies"
        />
        Only show flagged transactions
      </label>

      <label className="space-y-1 text-sm">
        <span>Sort by</span>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortKey)}
          aria-label="Sort transactions"
          className="w-full rounded-lg border border-[var(--border)] px-2 py-1.5"
        >
          <option value="date">Date</option>
          <option value="amount">Amount</option>
          <option value="merchant">Merchant</option>
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span>Direction</span>
        <select
          value={sortDirection}
          onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')}
          aria-label="Sort direction"
          className="w-full rounded-lg border border-[var(--border)] px-2 py-1.5"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </label>
    </div>
  )
}
