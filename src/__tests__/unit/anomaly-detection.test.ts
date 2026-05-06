import { describe, expect, it } from 'vitest'
import { detectAnomalies } from '@/lib/anomaly-detection'
import type { Transaction } from '@/lib/types'

function makeTxn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `txn_${Math.random().toString(36).slice(2, 8)}`,
    date: new Date('2026-04-15T12:00:00'),
    description: 'TEST MERCHANT',
    merchant: 'Test Merchant',
    amount: 50,
    type: 'debit',
    category: 'Shopping',
    ...overrides,
  }
}

describe('detectAnomalies edge cases', () => {
  it('returns empty for empty input', () => {
    expect(detectAnomalies([])).toEqual([])
  })

  it('returns empty for single transaction', () => {
    expect(detectAnomalies([makeTxn({ amount: 1000 })])).toHaveLength(0)
  })

  it('handles identical transactions', () => {
    const txns = Array.from({ length: 10 }, (_, index) =>
      makeTxn({ id: `i${index}`, amount: 50, merchant: 'WOOLWORTHS' }),
    )
    expect(() => detectAnomalies(txns)).not.toThrow()
  })

  it('detects massive outlier', () => {
    const base = Array.from({ length: 10 }, (_, index) =>
      makeTxn({ id: `base_${index}`, amount: 30, category: 'Dining & Restaurants', merchant: 'Cafe' }),
    )
    const outlier = makeTxn({
      id: 'outlier',
      amount: 500,
      category: 'Dining & Restaurants',
      merchant: 'Fancy Restaurant',
    })
    const anomalies = detectAnomalies([...base, outlier])
    const found = anomalies.find((item) => item.transactionIds.includes('outlier'))
    expect(found).toBeDefined()
    expect(found?.severity === 'critical' || found?.severity === 'warning').toBe(true)
  })

  it('detects duplicate charges 2 days apart', () => {
    const txns = [
      makeTxn({ id: 'dup1', amount: 89.99, merchant: 'ADOBE', date: new Date('2026-04-10T10:00:00') }),
      makeTxn({ id: 'dup2', amount: 89.99, merchant: 'ADOBE', date: new Date('2026-04-12T10:00:00') }),
      ...Array.from({ length: 8 }, (_, index) =>
        makeTxn({ id: `other_${index}`, merchant: 'WOOLWORTHS', amount: 70 }),
      ),
    ]

    const anomalies = detectAnomalies(txns)
    const duplicates = anomalies.filter((item) => item.type === 'duplicate_charge')
    expect(duplicates.length).toBeGreaterThan(0)
    expect(duplicates[0].severity).toBe('critical')
  })

  it('does not flag duplicates outside window', () => {
    const txns = [
      makeTxn({ id: 'd1', amount: 19.99, merchant: 'NETFLIX', date: new Date('2026-03-01T09:00:00') }),
      makeTxn({ id: 'd2', amount: 19.99, merchant: 'NETFLIX', date: new Date('2026-04-01T09:00:00') }),
    ]

    const duplicates = detectAnomalies(txns).filter((item) => item.type === 'duplicate_charge')
    expect(duplicates).toHaveLength(0)
  })

  it('ignores credits', () => {
    const credit = makeTxn({ id: 'salary', amount: 3800, type: 'credit', merchant: 'PAYROLL', category: 'Income' })
    const debits = Array.from({ length: 10 }, (_, index) => makeTxn({ id: `d${index}`, amount: 60 }))
    const anomalies = detectAnomalies([credit, ...debits])
    expect(anomalies.some((item) => item.relatedTransactions.some((txn) => txn.id === 'salary'))).toBe(false)
  })

  it('handles NaN amounts without throwing', () => {
    const txns = [makeTxn({ id: 'bad', amount: Number.NaN }), ...Array.from({ length: 8 }, (_, index) => makeTxn({ id: `good_${index}`, amount: 45 }))]
    expect(() => detectAnomalies(txns)).not.toThrow()
  })

  it('all anomalies include required fields', () => {
    const base = Array.from({ length: 10 }, (_, index) => makeTxn({ id: `b_${index}`, amount: 25 }))
    const spike = makeTxn({ id: 'spike', amount: 400 })
    const anomalies = detectAnomalies([...base, spike])

    anomalies.forEach((anomaly) => {
      expect(anomaly.id).toBeTruthy()
      expect(anomaly.headline).toBeTruthy()
      expect(anomaly.explanation).toBeTruthy()
      expect(anomaly.suggestion).toBeTruthy()
      expect(['critical', 'warning', 'info']).toContain(anomaly.severity)
    })
  })
})

describe('detectAnomalies spending velocity', () => {
  it('flags heavy weeks', () => {
    const baseline = Array.from({ length: 5 }, (_, week) =>
      Array.from({ length: 7 }, (_, day) =>
        makeTxn({
          id: `w${week}d${day}`,
          amount: 45,
          date: new Date(2026, 0, week * 7 + day + 1),
        }),
      ),
    ).flat()

    const spikeWeek = Array.from({ length: 7 }, (_, day) =>
      makeTxn({
        id: `s${day}`,
        amount: 210,
        date: new Date(2026, 2, day + 1),
      }),
    )

    const anomalies = detectAnomalies([...baseline, ...spikeWeek])
    expect(anomalies.some((item) => item.type === 'spending_velocity')).toBe(true)
  })
})
