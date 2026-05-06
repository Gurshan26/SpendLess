import type { Transaction } from './types'

interface SeedTxn {
  date: Date
  description: string
  merchant: string
  amount: number
  type: 'debit' | 'credit'
  category: Transaction['category']
}

const FOOD_MERCHANTS = [
  'BILLS CAFE SYDNEY',
  'UBER EATS SYDNEY',
  'GRILLD NEWTOWN',
  'NOODLE BOX MELBOURNE',
  'SUSHI TRAIN CBD',
  'SHAKE SHACK QVB',
]

const SHOPPING_MERCHANTS = ['AMAZON AU', 'THE ICONIC', 'KMART SYDNEY', 'JB HI-FI', 'DAVID JONES']

function atDate(base: Date, day: number, hour = 11, minute = 15): Date {
  return new Date(base.getFullYear(), base.getMonth(), day, hour, minute, 0, 0)
}

function withTxnId(transactions: SeedTxn[]): Transaction[] {
  return transactions
    .map((txn, index) => ({
      id: `sample_txn_${index + 1}`,
      ...txn,
      originalCategory: txn.category,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

function debit(description: string, merchant: string, amount: number, date: Date, category: Transaction['category']): SeedTxn {
  return {
    description,
    merchant,
    amount,
    type: 'debit',
    date,
    category,
  }
}

function credit(description: string, merchant: string, amount: number, date: Date): SeedTxn {
  return {
    description,
    merchant,
    amount,
    type: 'credit',
    date,
    category: 'Income',
  }
}

function monthlySubscriptions(monthStart: Date, monthIndex: number): SeedTxn[] {
  const netflixAmount = monthIndex >= 3 ? 19.99 : 15.99
  return [
    debit('NETFLIX.COM AU*SUB', 'NETFLIX.COM', netflixAmount, atDate(monthStart, 3, 9, 42), 'Subscriptions'),
    debit('SPOTIFY P12345', 'SPOTIFY', 11.99, atDate(monthStart, 4, 9, 18), 'Subscriptions'),
    debit('ADOBE*CREATIVE CLOUD', 'ADOBE', 54.99, atDate(monthStart, 6, 8, 5), 'Subscriptions'),
    debit('YOUTUBE PREMIUM', 'YOUTUBE PREMIUM', 14.99, atDate(monthStart, 7, 7, 35), 'Entertainment'),
  ]
}

function weeklyGroceries(monthStart: Date): SeedTxn[] {
  const amounts = [72.45, 81.2, 66.9, 88.35, 74.6]
  const days = [2, 8, 14, 21, 27]
  return days.map((day, index) => {
    const isWoolies = index % 2 === 0
    return debit(
      `${isWoolies ? 'WOOLWORTHS' : 'COLES'} ${1100 + day}`,
      isWoolies ? 'WOOLWORTHS' : 'COLES',
      amounts[index],
      atDate(monthStart, day, 18, 12),
      'Groceries',
    )
  })
}

function diningTransactions(monthStart: Date, monthIndex: number): SeedTxn[] {
  const baseDays = [1, 5, 9, 12, 16, 19, 23, 26]
  const txns = baseDays.map((day, index) => {
    const merchant = FOOD_MERCHANTS[(day + monthIndex + index) % FOOD_MERCHANTS.length]
    const amount = 22 + ((monthIndex + day + index) % 34)
    return debit(`${merchant} ${4000 + day}`, merchant, Number(amount.toFixed(2)), atDate(monthStart, day, 13, 5), 'Dining & Restaurants')
  })

  if (monthIndex === 4) {
    const spikeWeekDays = [10, 11, 12, 13, 14, 15]
    const spikeAmounts = [132, 158, 176, 140, 189, 121]
    spikeWeekDays.forEach((day, i) => {
      txns.push(
        debit(
          `BIRTHDAY WEEK RESTAURANT ${5100 + i}`,
          'HARBOUR DINING GROUP',
          spikeAmounts[i],
          atDate(monthStart, day, 20, 20),
          'Dining & Restaurants',
        ),
      )
    })
  }

  if (monthIndex === 5) {
    txns.push(
      debit(
        'LATE NIGHT TAPAS 3341',
        'LUNA TAPAS BAR',
        67.5,
        atDate(monthStart, 18, 2, 11),
        'Dining & Restaurants',
      ),
    )
  }

  return txns
}

function transportTransactions(monthStart: Date, monthIndex: number): SeedTxn[] {
  const opalDays = [3, 10, 17, 24]
  const txns = opalDays.map((day, index) => {
    const amount = 35 + ((monthIndex + index) % 4) * 5
    return debit(`OPAL TOP UP ${7000 + day}`, 'OPAL CARD', amount, atDate(monthStart, day, 8, 20), 'Transport')
  })

  txns.push(debit('UBER TRIP SYDNEY', 'UBER', 18 + monthIndex * 2, atDate(monthStart, 6, 22, 15), 'Transport'))
  txns.push(debit('UBER TRIP SYDNEY', 'UBER', 24 + monthIndex, atDate(monthStart, 20, 23, 0), 'Transport'))

  return txns
}

function utilityTransactions(monthStart: Date, monthIndex: number): SeedTxn[] {
  const txns: SeedTxn[] = [
    debit('AUSSIE BROADBAND BILL', 'AUSSIE BROADBAND', 79.99, atDate(monthStart, 5, 10, 2), 'Utilities'),
  ]

  if (monthIndex === 2 || monthIndex === 5) {
    txns.push(
      debit(
        'AGL ELECTRICITY BILL',
        'AGL ENERGY',
        monthIndex === 2 ? 212.35 : 238.9,
        atDate(monthStart, 22, 9, 50),
        'Utilities',
      ),
    )
  }

  return txns
}

function shoppingTransactions(monthStart: Date, monthIndex: number): SeedTxn[] {
  const days = [7, 15, 25]
  return days.map((day, index) => {
    const merchant = SHOPPING_MERCHANTS[(monthIndex + index) % SHOPPING_MERCHANTS.length]
    const amount = Number((28 + (day % 7) * 11 + monthIndex * 4).toFixed(2))
    return debit(`${merchant} ${2200 + day}`, merchant, amount, atDate(monthStart, day, 16, 10), 'Shopping')
  })
}

function salaryTransactions(monthStart: Date): SeedTxn[] {
  return [
    credit('PAYROLL ACME PTY LTD', 'ACME PAYROLL', 3800, atDate(monthStart, 1, 7, 30)),
    credit('PAYROLL ACME PTY LTD', 'ACME PAYROLL', 3800, atDate(monthStart, 15, 7, 30)),
  ]
}

function healthcareTransactions(monthStart: Date, monthIndex: number): SeedTxn[] {
  return [
    debit('CHEMIST WAREHOUSE', 'CHEMIST WAREHOUSE', 18 + monthIndex, atDate(monthStart, 13, 18, 45), 'Healthcare'),
  ]
}

function anomalyTransactions(monthStart: Date, monthIndex: number): SeedTxn[] {
  const txns: SeedTxn[] = []

  if (monthIndex === 5) {
    txns.push(
      debit('ADOBE*CREATIVE CLOUD 8891', 'ADOBE', 89.99, atDate(monthStart, 9, 8, 12), 'Subscriptions'),
      debit('ADOBE*CREATIVE CLOUD 8891', 'ADOBE', 89.99, atDate(monthStart, 12, 8, 12), 'Subscriptions'),
    )
  }

  if (monthIndex === 6) {
    txns.push(
      debit('QZL DIGITAL HUB SYDNEY', 'QZL DIGITAL HUB', 340, atDate(monthStart, 11, 14, 5), 'Shopping'),
    )
  }

  return txns
}

export function buildSampleTransactions(now: Date = new Date()): Transaction[] {
  const seeded: SeedTxn[] = []

  for (let offset = 5; offset >= 0; offset--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const monthIndex = 6 - offset

    seeded.push(...salaryTransactions(monthStart))
    seeded.push(...weeklyGroceries(monthStart))
    seeded.push(...monthlySubscriptions(monthStart, monthIndex))
    seeded.push(...diningTransactions(monthStart, monthIndex))
    seeded.push(...transportTransactions(monthStart, monthIndex))
    seeded.push(...utilityTransactions(monthStart, monthIndex))
    seeded.push(...shoppingTransactions(monthStart, monthIndex))
    seeded.push(...healthcareTransactions(monthStart, monthIndex))
    seeded.push(...anomalyTransactions(monthStart, monthIndex))
  }

  return withTxnId(seeded)
}

export const SAMPLE_TRANSACTIONS = buildSampleTransactions()

export const SAMPLE_DATA_PREVIEW = {
  months: 6,
  transactions: SAMPLE_TRANSACTIONS.length,
  highlights: [
    'Duplicate Adobe charge',
    'Restaurant spike week',
    'Late-night restaurant spend at 2am',
    'First-time high-value merchant',
    'Subscription price increase',
  ],
}
