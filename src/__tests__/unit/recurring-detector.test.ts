import { describe, expect, it } from 'vitest'
import { detectRecurringCharges } from '@/lib/recurring-detector'
import type { Transaction } from '@/lib/types'

function makeTxn(id: string, date: string, amount: number, merchant: string): Transaction {
  return {
    id,
    date: new Date(date),
    description: merchant,
    merchant,
    amount,
    type: 'debit',
    category: 'Subscriptions',
  }
}

describe('detectRecurringCharges', () => {
  it('detects monthly recurring charges', () => {
    const txns = [
      makeTxn('1', '2026-01-03', 19.99, 'NETFLIX.COM'),
      makeTxn('2', '2026-02-03', 19.99, 'Netflix'),
      makeTxn('3', '2026-03-03', 19.99, 'NETFLIX*AU'),
      makeTxn('4', '2026-04-03', 19.99, 'NETFLIX.COM'),
    ]

    const recurring = detectRecurringCharges(txns)
    expect(recurring.length).toBeGreaterThan(0)
    expect(recurring[0].frequency).toBe('monthly')
  })

  it('detects subscription increase', () => {
    const txns = [
      makeTxn('1', '2026-01-10', 15.99, 'NETFLIX.COM'),
      makeTxn('2', '2026-02-10', 15.99, 'NETFLIX.COM'),
      makeTxn('3', '2026-03-10', 19.99, 'NETFLIX.COM'),
      makeTxn('4', '2026-04-10', 19.99, 'NETFLIX.COM'),
    ]

    const recurring = detectRecurringCharges(txns)
    expect(recurring[0].increased).toBe(true)
    expect(recurring[0].increaseAmount).toBeGreaterThan(0)
  })
})
