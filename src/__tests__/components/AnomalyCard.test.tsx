import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AnomalyCard from '@/components/anomalies/AnomalyCard'
import type { Anomaly } from '@/lib/types'

const mockAnomaly: Anomaly = {
  id: 'test-anomaly-1',
  transactionIds: ['txn_1'],
  type: 'statistical_outlier',
  severity: 'critical',
  headline: '3x usual spend at restaurants',
  explanation: 'You spent $180 at Nobu, above your usual spend.',
  suggestion: 'Check if this was expected.',
  relatedTransactions: [
    {
      id: 'txn_1',
      date: new Date('2026-04-15'),
      description: 'NOBU RESTAURANT',
      merchant: 'Nobu Restaurant',
      amount: 180,
      type: 'debit',
      category: 'Dining & Restaurants',
    },
  ],
  dismissed: false,
  detectedAt: new Date(),
}

describe('AnomalyCard', () => {
  it('renders headline', () => {
    render(<AnomalyCard anomaly={mockAnomaly} onDismiss={() => {}} onAIExplain={async () => {}} />)
    expect(screen.getByText('3x usual spend at restaurants')).toBeInTheDocument()
  })

  it('shows critical badge', () => {
    render(<AnomalyCard anomaly={mockAnomaly} onDismiss={() => {}} onAIExplain={async () => {}} />)
    expect(screen.getByText(/critical/i)).toBeInTheDocument()
  })

  it('calls dismiss handler', async () => {
    const onDismiss = vi.fn()
    render(<AnomalyCard anomaly={mockAnomaly} onDismiss={onDismiss} onAIExplain={async () => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    await waitFor(() => expect(onDismiss).toHaveBeenCalledWith('test-anomaly-1'))
  })

  it('shows transactions on expand', () => {
    render(<AnomalyCard anomaly={mockAnomaly} onDismiss={() => {}} onAIExplain={async () => {}} />)
    fireEvent.click(screen.getByText(/view transactions/i))
    expect(screen.getByText(/Nobu Restaurant/i)).toBeInTheDocument()
  })

  it('returns null when dismissed', () => {
    const { container } = render(
      <AnomalyCard
        anomaly={{ ...mockAnomaly, dismissed: true }}
        onDismiss={() => {}}
        onAIExplain={async () => {}}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('has article role', () => {
    render(<AnomalyCard anomaly={mockAnomaly} onDismiss={() => {}} onAIExplain={async () => {}} />)
    expect(screen.getByRole('article')).toBeInTheDocument()
  })
})
