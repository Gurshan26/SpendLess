import Papa from 'papaparse'
import { categoriseTransaction } from './categorisation'
import type { CSVColumnMapping, Transaction } from './types'

const DATE_PATTERNS = [
  'date',
  'transaction date',
  'posting date',
  'settlement date',
  'trans date',
  'posted date',
]

const DESC_PATTERNS = [
  'description',
  'name',
  'merchant',
  'transaction description',
  'payee',
  'details',
  'memo',
  'narrative',
]

const AMOUNT_PATTERNS = ['amount', 'transaction amount', 'sum', 'value']
const DEBIT_PATTERNS = ['debit', 'withdrawal', 'debit amount', 'out']
const CREDIT_PATTERNS = ['credit', 'deposit', 'credit amount', 'in']
const CATEGORY_PATTERNS = ['category', 'type', 'transaction type', 'classification']

export interface ParseResult {
  transactions: Transaction[]
  mapping: CSVColumnMapping
  warnings: string[]
  rowsProcessed: number
  rowsSkipped: number
}

export interface ParseError {
  type: 'empty_file' | 'no_columns' | 'no_date' | 'no_amount' | 'no_description' | 'malformed'
  message: string
  suggestManualMapping: boolean
}

function normaliseHeader(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\-_]/g, ' ')
    .replace(/\s+/g, ' ')
}

function bestMatch(headers: string[], patterns: string[]): string | undefined {
  const scored = headers
    .map((header) => {
      const normalised = normaliseHeader(header)
      const score = patterns.reduce((max, pattern) => {
        if (normalised === pattern) return Math.max(max, 3)
        if (normalised.includes(pattern)) return Math.max(max, 2)
        return max
      }, 0)
      return { header, score }
    })
    .sort((a, b) => b.score - a.score)

  return scored[0]?.score > 0 ? scored[0].header : undefined
}

export function detectColumnMapping(headers: string[]): Partial<CSVColumnMapping> {
  const mapping: Partial<CSVColumnMapping> = {}

  mapping.dateColumn = bestMatch(headers, DATE_PATTERNS)
  mapping.descriptionColumn = bestMatch(headers, DESC_PATTERNS)
  mapping.amountColumn = bestMatch(headers, AMOUNT_PATTERNS)
  mapping.debitColumn = bestMatch(headers, DEBIT_PATTERNS)
  mapping.creditColumn = bestMatch(headers, CREDIT_PATTERNS)
  mapping.categoryColumn = bestMatch(headers, CATEGORY_PATTERNS)

  if (!mapping.amountColumn && mapping.debitColumn && mapping.creditColumn) {
    mapping.amountColumn = '__synthesised__'
  }

  return mapping
}

export function parseAmount(raw: string): number {
  if (!raw) return 0
  const original = raw.trim()
  if (!original) return 0

  const hasParens = original.startsWith('(') && original.endsWith(')')
  const minusSign = /^\s*-/.test(original)
  const isNegative = hasParens || minusSign

  let cleaned = original.replace(/[\s$£€A-Za-z]/g, '')
  cleaned = cleaned.replace(/[()]/g, '')

  const commaCount = (cleaned.match(/,/g) ?? []).length
  const dotCount = (cleaned.match(/\./g) ?? []).length

  if (commaCount > 0 && dotCount > 0) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (commaCount > 0 && dotCount === 0) {
    const parts = cleaned.split(',')
    if (parts[parts.length - 1].length === 2) {
      cleaned = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1]
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else {
    cleaned = cleaned.replace(/,/g, '')
  }

  const numeric = Number.parseFloat(cleaned)
  if (Number.isNaN(numeric)) return 0

  return isNegative ? -Math.abs(numeric) : numeric
}

export function parseDate(raw: string): Date | null {
  if (!raw || raw.trim() === '') return null
  const value = raw.trim()

  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) {
    const year = Number(iso[1])
    const month = Number(iso[2]) - 1
    const day = Number(iso[3])
    const date = new Date(year, month, day)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const slash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slash) {
    const a = Number(slash[1])
    const b = Number(slash[2])
    const yearRaw = Number(slash[3])
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw

    let month = a - 1
    let day = b

    if (a > 12 && b <= 12) {
      day = a
      month = b - 1
    }

    const date = new Date(year, month, day)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const dash = value.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/)
  if (dash) {
    const a = Number(dash[1])
    const b = Number(dash[2])
    const yearRaw = Number(dash[3])
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw

    let month = a - 1
    let day = b

    if (a > 12 && b <= 12) {
      day = a
      month = b - 1
    }

    const date = new Date(year, month, day)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function cleanMerchantName(description: string): string {
  return description
    .replace(/\*+\d+/g, '')
    .replace(/\s+#\s*\d+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 4)
    .join(' ')
}

function inferSignedAmount(
  row: Record<string, string>,
  mapping: CSVColumnMapping,
  rawAmount: number,
): number {
  if (mapping.amountColumn === '__synthesised__' && mapping.debitColumn && mapping.creditColumn) {
    const debit = parseAmount(row[mapping.debitColumn] ?? '')
    const credit = parseAmount(row[mapping.creditColumn] ?? '')
    if (Math.abs(credit) > 0) {
      return -Math.abs(credit)
    }
    return Math.abs(debit)
  }

  if (mapping.typeColumn) {
    const typeValue = (row[mapping.typeColumn] ?? '').toLowerCase()
    if (/credit|deposit|payment received|in/.test(typeValue)) {
      return -Math.abs(rawAmount)
    }
    if (/debit|withdrawal|purchase|out/.test(typeValue)) {
      return Math.abs(rawAmount)
    }
  }

  return rawAmount
}

function parseHeaders(text: string): string[] {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0)
  if (!firstLine) return []
  return firstLine.split(',').map((value) => value.trim().replace(/^"|"$/g, ''))
}

export function parseCSV(csvText: string, manualMapping?: CSVColumnMapping): ParseResult | ParseError {
  if (!csvText || csvText.trim().length === 0) {
    return {
      type: 'empty_file',
      message: 'The file is empty.',
      suggestManualMapping: false,
    }
  }

  const headers = parseHeaders(csvText)
  if (headers.length === 0) {
    return {
      type: 'no_columns',
      message: 'Could not find headers in this file.',
      suggestManualMapping: true,
    }
  }

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return {
      type: 'malformed',
      message: 'That CSV looks malformed. Try a different export or use manual mapping.',
      suggestManualMapping: true,
    }
  }

  if (parsed.data.length === 0) {
    return {
      type: 'no_columns',
      message: 'Could not find any rows in this file.',
      suggestManualMapping: true,
    }
  }

  const inferred = manualMapping ?? (detectColumnMapping(Object.keys(parsed.data[0])) as CSVColumnMapping)

  if (!inferred.dateColumn) {
    return { type: 'no_date', message: 'Could not find a date column.', suggestManualMapping: true }
  }
  if (!inferred.amountColumn) {
    return { type: 'no_amount', message: 'Could not find an amount column.', suggestManualMapping: true }
  }
  if (!inferred.descriptionColumn) {
    return {
      type: 'no_description',
      message: 'Could not find a description column.',
      suggestManualMapping: true,
    }
  }

  const transactions: Transaction[] = []
  const warnings: string[] = []
  let rowsSkipped = 0
  const stagedRows: Array<{
    index: number
    date: Date
    description: string
    merchant: string
    signedAmount: number
    originalCategory?: string
  }> = []

  parsed.data.forEach((row, index) => {
    const dateRaw = row[inferred.dateColumn] ?? ''
    const descriptionRaw = row[inferred.descriptionColumn] ?? ''

    const parsedDate = parseDate(dateRaw)
    if (!parsedDate) {
      rowsSkipped += 1
      warnings.push(`Row ${index + 2} skipped: date "${dateRaw}" is not recognised.`)
      return
    }

    const amountInput = inferred.amountColumn === '__synthesised__' ? '0' : row[inferred.amountColumn] ?? ''
    const parsedAmount = parseAmount(amountInput)
    const signedAmount = inferSignedAmount(row, inferred, parsedAmount)

    if (!Number.isFinite(signedAmount) || (signedAmount === 0 && descriptionRaw.trim() === '')) {
      rowsSkipped += 1
      return
    }

    const originalCategory = inferred.categoryColumn ? row[inferred.categoryColumn] : undefined
    const description = descriptionRaw.trim() || 'Unknown transaction'

    stagedRows.push({
      index,
      date: parsedDate,
      description,
      merchant: cleanMerchantName(description),
      signedAmount,
      originalCategory,
    })
  })

  if (stagedRows.length === 0) {
    return {
      type: 'malformed',
      message: 'No valid transactions were found after parsing.',
      suggestManualMapping: true,
    }
  }

  const hasExplicitTypeColumns = Boolean(
    inferred.typeColumn ||
      inferred.debitColumn ||
      inferred.creditColumn ||
      inferred.amountColumn === '__synthesised__',
  )

  const signedValues = stagedRows
    .map((row) => row.signedAmount)
    .filter((value) => value !== 0 && Number.isFinite(value))
  const negatives = signedValues.filter((value) => value < 0).length
  const positives = signedValues.filter((value) => value > 0).length

  const shouldFlipConvention = !hasExplicitTypeColumns && negatives > positives * 1.5

  stagedRows.forEach((row) => {
    const signedAmount = shouldFlipConvention ? row.signedAmount * -1 : row.signedAmount
    const type: 'debit' | 'credit' = signedAmount < 0 ? 'credit' : 'debit'
    const amount = Math.abs(signedAmount)

    transactions.push({
      id: `txn_${row.index + 1}`,
      date: row.date,
      description: row.description,
      merchant: row.merchant,
      amount,
      type,
      category: categoriseTransaction(row.description, row.originalCategory),
      originalCategory: row.originalCategory,
    })
  })

  return {
    transactions,
    mapping: inferred,
    warnings,
    rowsProcessed: parsed.data.length,
    rowsSkipped,
  }
}
