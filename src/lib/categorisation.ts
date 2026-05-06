import type { Category } from './types'

const CATEGORY_KEYWORDS: Record<Category, RegExp> = {
  Groceries: /(woolworths|coles|aldi|costco|grocery|supermarket|safeway|trader joe|whole foods|iga)/i,
  'Dining & Restaurants': /(restaurant|cafe|coffee|uber eats|doordash|grubhub|mcdonald|kfc|pizza|sushi|nando|takeaway|bar)/i,
  Transport: /(uber|lyft|opal|metro|train|bus|fuel|petrol|gas station|shell|bp|esso|taxi|toll)/i,
  Entertainment: /(cinema|movie|event|ticketmaster|steam|xbox|playstation|spotify|netflix|hulu|disney)/i,
  Shopping: /(amazon|ebay|etsy|kmart|target|the iconic|david jones|myer|officeworks|uniqlo|shop)/i,
  Utilities: /(electricity|water|gas bill|internet|telstra|optus|vodafone|utility|power)/i,
  Healthcare: /(pharmacy|chemist|doctor|hospital|medical|dental|dentist|health)/i,
  Travel: /(airbnb|hotel|flight|qantas|jetstar|booking\.com|expedia|travel)/i,
  Subscriptions: /(subscription|adobe|youtube premium|icloud|dropbox|notion|canva|prime)/i,
  Income: /(salary|payroll|wages|direct deposit|paycheck)/i,
  Transfers: /(transfer|zelle|venmo|paypal|bank transfer|osko|beem|cash app)/i,
  'Fees & Charges': /(fee|charge|interest|atm fee|late fee|overdraft)/i,
  Education: /(udemy|coursera|tuition|university|school|edu)/i,
  'Personal Care': /(salon|barber|spa|beauty|sephora|cosmetic|gym)/i,
  Other: /$^/,
}

const EXISTING_CATEGORY_MAP: Record<string, Category> = {
  'food & drink': 'Dining & Restaurants',
  'food and dining': 'Dining & Restaurants',
  restaurants: 'Dining & Restaurants',
  groceries: 'Groceries',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  travel: 'Travel',
  'health & fitness': 'Healthcare',
  'bills & utilities': 'Utilities',
  utilities: 'Utilities',
  income: 'Income',
  transfer: 'Transfers',
  transfers: 'Transfers',
  subscriptions: 'Subscriptions',
  education: 'Education',
}

export const STANDARD_CATEGORIES: Category[] = [
  'Groceries',
  'Dining & Restaurants',
  'Transport',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Healthcare',
  'Travel',
  'Subscriptions',
  'Income',
  'Transfers',
  'Fees & Charges',
  'Education',
  'Personal Care',
  'Other',
]

export function mapExistingCategory(raw: string): Category {
  const normalised = raw.trim().toLowerCase()
  return EXISTING_CATEGORY_MAP[normalised] ?? 'Other'
}

export function categoriseTransaction(description: string, existingCategory?: string): Category {
  if (existingCategory && existingCategory.trim().length > 0) {
    return mapExistingCategory(existingCategory)
  }

  for (const [category, pattern] of Object.entries(CATEGORY_KEYWORDS) as [Category, RegExp][]) {
    if (pattern.test(description)) {
      return category
    }
  }

  return 'Other'
}

export function isDaytimeCategory(category: Category): boolean {
  return ['Utilities', 'Income', 'Transfers', 'Education', 'Healthcare'].includes(category)
}
