import MoneyAmount from '@/components/shared/MoneyAmount'
import type { Category, CategorySummary, Transaction } from '@/lib/types'

interface CategoryDetailProps {
  category: Category | null
  summary: CategorySummary | null
  transactions: Transaction[]
  peerPercent?: number
}

export default function CategoryDetail({ category, summary, transactions, peerPercent }: CategoryDetailProps) {
  if (!category || !summary) {
    return (
      <div className="card p-4 text-sm text-[var(--ink-2)]">
        Click any category to see the full transaction list and trend details.
      </div>
    )
  }

  const top = [...transactions]
    .filter((txn) => txn.category === category && txn.type === 'debit')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 12)

  return (
    <div className="card space-y-4 p-4">
      <div>
        <h3 className="text-xl font-semibold">{category}</h3>
        <p className="text-sm text-[var(--ink-2)]">
          {summary.changePercent >= 0 ? 'Up' : 'Down'} {Math.abs(summary.changePercent).toFixed(1)}% month over month.
        </p>
        {typeof peerPercent === 'number' ? (
          <p className="text-sm text-[var(--ink-2)]">
            The average person at your spending level puts about {peerPercent}% here. You&apos;re at{' '}
            {summary.percentage.toFixed(1)}%.
          </p>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-[var(--ink-3)]">Largest transactions</p>
        <ul className="space-y-2">
          {top.map((txn) => (
            <li key={txn.id} className="grid grid-cols-12 gap-2 text-sm">
              <span className="col-span-3 mono text-[var(--ink-3)]">{txn.date.toLocaleDateString()}</span>
              <span className="col-span-6 truncate">{txn.merchant}</span>
              <span className="col-span-3 text-right">
                <MoneyAmount amount={txn.amount} className="text-sm" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
