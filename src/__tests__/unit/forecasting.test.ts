import { describe, expect, it } from 'vitest'
import { projectEndOfMonthSpend } from '@/lib/forecasting'
import type { Transaction } from '@/lib/types'

function txn(id: string, date: Date, amount: number): Transaction {
  return {
    id,
    date,
    description: 'test',
    merchant: 'merchant',
    amount,
    type: 'debit',
    category: 'Other',
  }
}

describe('projectEndOfMonthSpend', () => {
  it('calculates projection for current month', () => {
    const now = new Date(2026, 3, 15)
    const txns = [
      txn('1', new Date(2026, 3, 1), 100),
      txn('2', new Date(2026, 3, 8), 120),
      txn('3', new Date(2026, 3, 14), 80),
      txn('4', new Date(2026, 2, 10), 200),
    ]

    const forecast = projectEndOfMonthSpend(txns, now)
    expect(forecast.currentSpend).toBe(300)
    expect(forecast.projectedMonthSpend).toBeGreaterThan(300)
  })
})
