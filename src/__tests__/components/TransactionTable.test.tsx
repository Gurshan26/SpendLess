import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TransactionTable from '@/components/transactions/TransactionTable'
import type { Anomaly, Transaction } from '@/lib/types'

const rows: Transaction[] = [
  {
    id: 't1',
    date: new Date('2026-04-15'),
    description: 'WOOLWORTHS 101',
    merchant: 'WOOLWORTHS',
    amount: 85,
    type: 'debit',
    category: 'Groceries',
  },
  {
    id: 't2',
    date: new Date('2026-04-14'),
    description: 'NETFLIX',
    merchant: 'NETFLIX',
    amount: 19.99,
    type: 'debit',
    category: 'Subscriptions',
  },
]

const anomalies = new Map<string, Anomaly[]>([
  [
    't2',
    [
      {
        id: 'a1',
        transactionIds: ['t2'],
        type: 'new_merchant',
        severity: 'info',
        headline: 'new merchant',
        explanation: 'info',
        suggestion: 'check',
        relatedTransactions: [rows[1]],
        dismissed: false,
        detectedAt: new Date(),
      },
    ],
  ],
])

describe('TransactionTable', () => {
  it('renders table rows', () => {
    render(
      <TransactionTable
        transactions={rows}
        anomalyMap={anomalies}
        onRecategorise={async () => 'Other'}
        onExportCSV={() => {}}
      />,
    )

    expect(screen.getByText('WOOLWORTHS')).toBeInTheDocument()
    expect(screen.getByText('NETFLIX')).toBeInTheDocument()
  })

  it('filters anomaly only', () => {
    render(
      <TransactionTable
        transactions={rows}
        anomalyMap={anomalies}
        onRecategorise={async () => 'Other'}
        onExportCSV={() => {}}
      />,
    )

    fireEvent.click(screen.getByTestId('filter-anomalies'))
    expect(screen.queryByText('WOOLWORTHS')).not.toBeInTheDocument()
    expect(screen.getByText('NETFLIX')).toBeInTheDocument()
  })

  it('calls export callback', () => {
    const onExport = vi.fn()
    render(
      <TransactionTable
        transactions={rows}
        anomalyMap={anomalies}
        onRecategorise={async () => 'Other'}
        onExportCSV={onExport}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /export filtered csv/i }))
    expect(onExport).toHaveBeenCalled()
  })
})
