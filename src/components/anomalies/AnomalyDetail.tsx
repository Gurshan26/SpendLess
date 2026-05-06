import MoneyAmount from '@/components/shared/MoneyAmount'
import type { Anomaly } from '@/lib/types'

interface AnomalyDetailProps {
  anomaly: Anomaly
}

export default function AnomalyDetail({ anomaly }: AnomalyDetailProps) {
  return (
    <div data-testid="anomaly-detail" className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <p className="mb-2 text-xs uppercase tracking-wide text-[var(--ink-3)]">Related transactions</p>
      <ul className="space-y-2">
        {anomaly.relatedTransactions.map((txn) => (
          <li key={txn.id} className="grid grid-cols-12 gap-2 text-sm">
            <span className="col-span-3 mono text-[var(--ink-3)]">
              {txn.date.toLocaleDateString()}
            </span>
            <span className="col-span-6 truncate">{txn.merchant}</span>
            <span className="col-span-3 text-right">
              <MoneyAmount amount={txn.amount} className="text-sm" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
