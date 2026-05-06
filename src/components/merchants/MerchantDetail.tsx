import MoneyAmount from '@/components/shared/MoneyAmount'
import type { Transaction } from '@/lib/types'

interface MerchantDetailProps {
  merchant: string | null
  transactions: Transaction[]
}

export default function MerchantDetail({ merchant, transactions }: MerchantDetailProps) {
  if (!merchant) {
    return (
      <div className="card p-4 text-sm text-[var(--ink-2)]">
        Pick a merchant to see their transaction history.
      </div>
    )
  }

  const rows = transactions
    .filter((txn) => txn.merchant === merchant)
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold">{merchant}</h3>
      <p className="mb-3 text-sm text-[var(--ink-2)]">{rows.length} transactions</p>
      <ul className="space-y-2">
        {rows.slice(0, 10).map((txn) => (
          <li key={txn.id} className="grid grid-cols-12 text-sm">
            <span className="col-span-3 mono text-[var(--ink-3)]">{txn.date.toLocaleDateString()}</span>
            <span className="col-span-6 truncate">{txn.category}</span>
            <span className="col-span-3 text-right">
              <MoneyAmount amount={txn.amount} className="text-sm" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
