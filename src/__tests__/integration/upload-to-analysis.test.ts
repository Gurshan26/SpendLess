import { describe, expect, it } from 'vitest'
import { parseCSV } from '@/lib/csv-parser'
import { detectAnomalies } from '@/lib/anomaly-detection'
import { detectRecurringCharges } from '@/lib/recurring-detector'

const SAMPLE_CSV = `Date,Description,Amount
2026-01-15,WOOLWORTHS 1234,-85.30
2026-01-17,NETFLIX.COM,-19.99
2026-01-18,SPOTIFY,-11.99
2026-01-20,UBER EATS,-45.00
2026-01-22,WOOLWORTHS 1234,-92.10
2026-02-15,WOOLWORTHS 1234,-88.50
2026-02-17,NETFLIX.COM,-19.99
2026-02-18,SPOTIFY,-11.99
2026-02-20,UBER EATS,-38.00
2026-02-22,WOOLWORTHS 1234,-76.30
2026-03-15,WOOLWORTHS 1234,-91.20
2026-03-17,NETFLIX.COM,-19.99
2026-03-17,NETFLIX.COM,-19.99
2026-03-18,SPOTIFY,-11.99
2026-03-25,FANCY RESTAURANT,-380.00
2026-03-26,FANCY RESTAURANT,-380.00`

describe('upload CSV to analysis integration', () => {
  it('parses CSV', () => {
    const parsed = parseCSV(SAMPLE_CSV)
    expect('transactions' in parsed).toBe(true)
    if ('transactions' in parsed) {
      expect(parsed.transactions.length).toBeGreaterThan(10)
    }
  })

  it('detects duplicate charge', () => {
    const parsed = parseCSV(SAMPLE_CSV)
    expect('transactions' in parsed).toBe(true)
    if ('transactions' in parsed) {
      const anomalies = detectAnomalies(parsed.transactions)
      expect(anomalies.some((item) => item.type === 'duplicate_charge')).toBe(true)
    }
  })

  it('detects large restaurant anomaly', () => {
    const parsed = parseCSV(SAMPLE_CSV)
    expect('transactions' in parsed).toBe(true)
    if ('transactions' in parsed) {
      const anomalies = detectAnomalies(parsed.transactions)
      const hit = anomalies.find((anomaly) =>
        anomaly.relatedTransactions.some((txn) => txn.amount === 380),
      )
      expect(hit).toBeDefined()
    }
  })

  it('detects recurring charges', () => {
    const parsed = parseCSV(SAMPLE_CSV)
    expect('transactions' in parsed).toBe(true)
    if ('transactions' in parsed) {
      const recurring = detectRecurringCharges(parsed.transactions)
      expect(recurring.some((item) => item.cleanName.includes('NETFLIX'))).toBe(true)
    }
  })

  it('pipeline anomalies contain required content', () => {
    const parsed = parseCSV(SAMPLE_CSV)
    expect('transactions' in parsed).toBe(true)
    if ('transactions' in parsed) {
      const anomalies = detectAnomalies(parsed.transactions)
      expect(
        anomalies.every((item) => Boolean(item.headline) && Boolean(item.explanation) && Boolean(item.suggestion)),
      ).toBe(true)
    }
  })
})
