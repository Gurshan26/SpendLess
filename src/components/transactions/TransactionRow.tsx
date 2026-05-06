import MoneyAmount from '@/components/shared/MoneyAmount'
import type { Transaction } from '@/lib/types'

interface TransactionRowProps {
  transaction: Transaction
  hasAnomaly: boolean
  onClick: (transaction: Transaction) => void
}

export default function TransactionRow({ transaction, hasAnomaly, onClick }: TransactionRowProps) {
  return (
    <tr
      className="cursor-pointer border-b border-[var(--border)] hover:bg-[var(--surface-2)]"
      onClick={() => onClick(transaction)}
      aria-label={`Open transaction ${transaction.merchant}`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onClick(transaction)
      }}
    >
      <td className="px-3 py-2 text-sm mono text-[var(--ink-3)]">{transaction.date.toLocaleDateString()}</td>
      <td className="px-3 py-2 text-sm">{transaction.merchant}</td>
      <td className="hidden px-3 py-2 text-sm lg:table-cell">{transaction.category}</td>
      <td className="px-3 py-2 text-right text-sm">
        <MoneyAmount amount={transaction.amount} />
      </td>
      <td className="hidden px-3 py-2 text-center text-xs md:table-cell">
        {hasAnomaly ? <span className="rounded-full bg-[var(--warning-bg)] px-2 py-1 text-[var(--warning)]">Flagged</span> : '—'}
      </td>
    </tr>
  )
}
