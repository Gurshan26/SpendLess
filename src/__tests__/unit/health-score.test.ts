import { describe, expect, it } from 'vitest'
import { calculateHealthScore } from '@/lib/health-score'
import type { Anomaly, RecurringCharge, Transaction } from '@/lib/types'

function fakeTransaction(id: string): Transaction {
  return {
    id,
    date: new Date('2026-04-01'),
    description: 'Test',
    merchant: 'Test',
    amount: 10,
    type: 'debit',
    category: 'Other',
  }
}

function fakeAnomaly(id: string, severity: Anomaly['severity'], type: Anomaly['type']): Anomaly {
  const txn = fakeTransaction(`txn-${id}`)
  return {
    id,
    transactionIds: [txn.id],
    type,
    severity,
    headline: 'test',
    explanation: 'test',
    suggestion: 'test',
    relatedTransactions: [txn],
    dismissed: false,
    detectedAt: new Date(),
  }
}

function recurring(id: string, daysAgo: number): RecurringCharge {
  const now = new Date()
  return {
    id,
    merchantName: 'Sub',
    cleanName: 'SUB',
    frequency: 'monthly',
    amount: 19.99,
    firstSeen: new Date(now.getFullYear(), now.getMonth() - 3, 1),
    lastSeen: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
    occurrences: 4,
    totalSpent: 79.96,
    estimatedAnnualCost: 239.88,
    category: 'Subscriptions',
    increased: false,
    transactions: [fakeTransaction(`sub-${id}`)],
  }
}

describe('calculateHealthScore', () => {
  it('starts high with no problems', () => {
    const result = calculateHealthScore({ anomalies: [], spendVelocityRatio: 1, recurringCharges: [] })
    expect(result.score).toBe(100)
  })

  it('drops score for anomalies and velocity', () => {
    const anomalies = [
      fakeAnomaly('a1', 'critical', 'duplicate_charge'),
      fakeAnomaly('a2', 'warning', 'spending_velocity'),
      fakeAnomaly('a3', 'info', 'new_merchant'),
    ]

    const result = calculateHealthScore({ anomalies, spendVelocityRatio: 1.6, recurringCharges: [] })
    expect(result.score).toBeLessThan(100)
    expect(result.label).not.toBe('Looking good')
  })

  it('penalizes stale subscriptions', () => {
    const result = calculateHealthScore({
      anomalies: [],
      spendVelocityRatio: 1,
      recurringCharges: [recurring('1', 40), recurring('2', 50), recurring('3', 45)],
    })
    expect(result.score).toBe(95)
  })
})
