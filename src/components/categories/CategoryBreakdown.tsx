'use client'

import { useMemo, useState } from 'react'
import CategoryChart from './CategoryChart'
import CategoryDetail from './CategoryDetail'
import CategoryBarChart from '@/components/charts/CategoryBarChart'
import type { Category, CategorySummary, Transaction } from '@/lib/types'

interface CategoryBreakdownProps {
  categorySummary: CategorySummary[]
  transactions: Transaction[]
  peerBenchmarks: Record<Category, number>
}

export default function CategoryBreakdown({
  categorySummary,
  transactions,
  peerBenchmarks,
}: CategoryBreakdownProps) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(
    categorySummary[0]?.category ?? null,
  )

  const activeSummary = useMemo(
    () => categorySummary.find((item) => item.category === activeCategory) ?? null,
    [activeCategory, categorySummary],
  )

  return (
    <section data-testid="category-breakdown" className="space-y-4">
      <div>
        <h2 className="section-title">Category Breakdown</h2>
        <p className="section-subtitle">Where your money is going, and what changed from last month.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CategoryChart data={categorySummary} />
        <CategoryBarChart data={categorySummary} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <div className="card p-4">
          <p className="mb-3 text-sm text-[var(--ink-3)]">Top categories</p>
          <ul className="space-y-2">
            {categorySummary.map((item) => (
              <li key={item.category}>
                <button
                  onClick={() => setActiveCategory(item.category)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    activeCategory === item.category
                      ? 'border-[var(--accent)] bg-[var(--accent-light)]/60'
                      : 'border-[var(--border)] bg-white'
                  }`}
                  aria-label={`Show details for ${item.category}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{item.category}</span>
                    <span className="money">${item.totalAmount.toFixed(2)}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-3)]">
                    {item.percentage.toFixed(1)}% of spend · {item.transactionCount} transactions
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <CategoryDetail
          category={activeCategory}
          summary={activeSummary}
          transactions={transactions}
          peerPercent={activeCategory ? peerBenchmarks[activeCategory] : undefined}
        />
      </div>
    </section>
  )
}
