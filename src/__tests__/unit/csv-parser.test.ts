import { describe, expect, it } from 'vitest'
import { detectColumnMapping, parseAmount, parseCSV, parseDate } from '@/lib/csv-parser'

describe('parseAmount', () => {
  it('parses plain amount', () => expect(parseAmount('50.00')).toBe(50))
  it('parses amount with dollar sign', () => expect(parseAmount('$50.00')).toBe(50))
  it('parses comma separator', () => expect(parseAmount('1,234.56')).toBe(1234.56))
  it('parses negative', () => expect(parseAmount('-50.00')).toBe(-50))
  it('parses accounting negative', () => expect(parseAmount('(89.99)')).toBe(-89.99))
  it('parses european style', () => expect(parseAmount('1.234,56')).toBeCloseTo(1234.56, 2))
  it('handles empty', () => expect(parseAmount('')).toBe(0))
  it('handles non numeric', () => expect(parseAmount('N/A')).toBe(0))
})

describe('parseDate', () => {
  it('parses ISO', () => {
    const date = parseDate('2026-04-15')
    expect(date).not.toBeNull()
    expect(date?.getFullYear()).toBe(2026)
  })

  it('parses slash format', () => {
    expect(parseDate('04/15/2026')).not.toBeNull()
  })

  it('returns null for invalid', () => {
    expect(parseDate('not-a-date')).toBeNull()
  })

  it('returns null for empty', () => {
    expect(parseDate('')).toBeNull()
  })
})

describe('detectColumnMapping', () => {
  it('detects Chase-like headers', () => {
    const headers = ['Transaction Date', 'Post Date', 'Description', 'Category', 'Type', 'Amount']
    const mapping = detectColumnMapping(headers)
    expect(mapping.dateColumn).toBe('Transaction Date')
    expect(mapping.descriptionColumn).toBe('Description')
    expect(mapping.amountColumn).toBe('Amount')
  })

  it('detects Mint-like headers', () => {
    const headers = ['Date', 'Description', 'Original Description', 'Amount', 'Transaction Type', 'Category']
    const mapping = detectColumnMapping(headers)
    expect(mapping.dateColumn).toBe('Date')
    expect(mapping.amountColumn).toBe('Amount')
  })

  it('handles split debit/credit', () => {
    const headers = ['Date', 'Merchant', 'Debit', 'Credit']
    const mapping = detectColumnMapping(headers)
    expect(mapping.debitColumn).toBe('Debit')
    expect(mapping.creditColumn).toBe('Credit')
    expect(mapping.amountColumn).toBe('__synthesised__')
  })
})

describe('parseCSV', () => {
  it('returns error for empty input', () => {
    const result = parseCSV('')
    expect('type' in result).toBe(true)
    if ('type' in result) {
      expect(result.type).toBe('empty_file')
    }
  })

  it('parses valid CSV', () => {
    const csv = `Transaction Date,Description,Category,Type,Amount\n04/15/2026,WOOLWORTHS 1234,Groceries,Sale,-89.50\n04/14/2026,NETFLIX.COM,Entertainment,Sale,-19.99\n04/13/2026,PAYROLL DEPOSIT,Income,Payment,3800.00`
    const result = parseCSV(csv)
    expect('transactions' in result).toBe(true)
    if ('transactions' in result) {
      expect(result.transactions).toHaveLength(3)
    }
  })

  it('skips invalid date rows', () => {
    const csv = `Date,Description,Amount\n2026-04-15,Coffee,4.50\nBAD DATE,Another thing,10.00\n2026-04-16,Lunch,15.00`
    const result = parseCSV(csv)
    expect('transactions' in result).toBe(true)
    if ('transactions' in result) {
      expect(result.transactions).toHaveLength(2)
      expect(result.warnings.length).toBeGreaterThan(0)
    }
  })

  it('handles windows line endings', () => {
    const csv = `Date,Description,Amount\r\n2026-04-15,Coffee,4.50\r\n2026-04-16,Lunch,15.00`
    const result = parseCSV(csv)
    expect('transactions' in result).toBe(true)
  })
})
