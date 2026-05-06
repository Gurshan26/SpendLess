import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AnomalyFeed from '@/components/anomalies/AnomalyFeed'
import type { Anomaly } from '@/lib/types'

const anomaly: Anomaly = {
  id: 'a1',
  transactionIds: ['t1'],
  type: 'duplicate_charge',
  severity: 'critical',
  headline: 'Possible duplicate charge',
  explanation: 'Two identical charges found.',
  suggestion: 'Check the merchant receipt.',
  relatedTransactions: [
    {
      id: 't1',
      date: new Date('2026-04-12'),
      description: 'ADOBE',
      merchant: 'ADOBE',
      amount: 89.99,
      type: 'debit',
      category: 'Subscriptions',
    },
  ],
  dismissed: false,
  detectedAt: new Date(),
}

describe('AnomalyFeed', () => {
  it('renders anomaly cards', () => {
    render(
      <AnomalyFeed
        anomalies={[anomaly]}
        filter="all"
        onFilterChange={() => {}}
        onDismiss={() => {}}
        onUndismiss={() => {}}
        onAIExplain={async () => {}}
        canAIExplain
        aiBusy={false}
      />,
    )

    expect(screen.getByText(/Possible duplicate charge/i)).toBeInTheDocument()
  })

  it('renders empty state when list empty', () => {
    render(
      <AnomalyFeed
        anomalies={[]}
        filter="all"
        onFilterChange={() => {}}
        onDismiss={() => {}}
        onUndismiss={() => {}}
        onAIExplain={async () => {}}
        canAIExplain
        aiBusy={false}
      />,
    )

    expect(screen.getByText(/No weird transactions/i)).toBeInTheDocument()
  })

  it('shows filter controls', () => {
    const onFilterChange = vi.fn()
    render(
      <AnomalyFeed
        anomalies={[anomaly]}
        filter="all"
        onFilterChange={onFilterChange}
        onDismiss={() => {}}
        onUndismiss={() => {}}
        onAIExplain={async () => {}}
        canAIExplain
        aiBusy={false}
      />,
    )

    expect(screen.getByRole('tab', { name: /critical/i })).toBeInTheDocument()
  })
})
