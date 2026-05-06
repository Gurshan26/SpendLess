import Button from '@/components/shared/Button'
import type { Anomaly, Transaction } from '@/lib/types'

interface TransactionDetailProps {
  transaction: Transaction | null
  anomalies: Anomaly[]
  onRecategorise: (transaction: Transaction) => Promise<string>
  recategoriseLoading: boolean
  recategoriseResult: string | null
}

export default function TransactionDetail({
  transaction,
  anomalies,
  onRecategorise,
  recategoriseLoading,
  recategoriseResult,
}: TransactionDetailProps) {
  if (!transaction) {
    return (
      <div className="card p-4 text-sm text-[var(--ink-2)]">
        Click a transaction to see details and category checks.
      </div>
    )
  }

  return (
    <aside className="card space-y-3 p-4" data-testid="transaction-detail">
      <div>
        <h3 className="text-lg font-semibold">{transaction.merchant}</h3>
        <p className="text-sm text-[var(--ink-2)]">{transaction.description}</p>
      </div>

      <div className="grid gap-2 text-sm">
        <p>
          Date: <span className="mono">{transaction.date.toLocaleDateString()}</span>
        </p>
        <p>
          Category: <strong>{transaction.category}</strong>
        </p>
        <p>
          Amount: <span className="money">${transaction.amount.toFixed(2)}</span>
        </p>
        <p>
          Anomaly flags: {anomalies.length > 0 ? anomalies.map((anomaly) => anomaly.type).join(', ') : 'None'}
        </p>
      </div>

      <Button
        variant="secondary"
        onClick={() => void onRecategorise(transaction)}
        loading={recategoriseLoading}
      >
        Is this category right?
      </Button>

      {recategoriseResult ? (
        <p className="rounded-lg bg-[var(--info-bg)] p-2 text-sm text-[var(--info)]">
          Suggested category: <strong>{recategoriseResult}</strong>
        </p>
      ) : null}
    </aside>
  )
}
