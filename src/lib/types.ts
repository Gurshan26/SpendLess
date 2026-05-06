export interface Transaction {
  id: string
  date: Date
  description: string
  merchant: string
  amount: number
  type: 'debit' | 'credit'
  category: Category
  originalCategory?: string
  isRecurring?: boolean
  recurringId?: string
}

export type Category =
  | 'Groceries'
  | 'Dining & Restaurants'
  | 'Transport'
  | 'Entertainment'
  | 'Shopping'
  | 'Utilities'
  | 'Healthcare'
  | 'Travel'
  | 'Subscriptions'
  | 'Income'
  | 'Transfers'
  | 'Fees & Charges'
  | 'Education'
  | 'Personal Care'
  | 'Other'

export type AnomalyType =
  | 'statistical_outlier'
  | 'spending_velocity'
  | 'duplicate_charge'
  | 'unusual_timing'
  | 'category_drift'
  | 'new_merchant'
  | 'forgotten_subscription'
  | 'subscription_increase'

export interface Anomaly {
  id: string
  transactionIds: string[]
  type: AnomalyType
  severity: 'critical' | 'warning' | 'info'
  headline: string
  explanation: string
  suggestion: string
  relatedTransactions: Transaction[]
  aiExplanation?: string
  dismissed: boolean
  detectedAt: Date
}

export interface RecurringCharge {
  id: string
  merchantName: string
  cleanName: string
  frequency: 'weekly' | 'biweekly' | 'monthly'
  amount: number
  firstSeen: Date
  lastSeen: Date
  occurrences: number
  totalSpent: number
  estimatedAnnualCost: number
  category: Category
  increased: boolean
  increaseAmount?: number
  transactions: Transaction[]
}

export interface CategorySummary {
  category: Category
  totalAmount: number
  transactionCount: number
  percentage: number
  previousMonthAmount: number
  changePercent: number
  avgTransactionAmount: number
  topMerchants: string[]
}

export interface MerchantSummary {
  merchantName: string
  totalAmount: number
  transactionCount: number
  category: Category
  isRecurring: boolean
  firstSeen: Date
  lastSeen: Date
}

export interface FinancialSummary {
  totalSpend: number
  totalIncome: number
  netFlow: number
  averageMonthlySpend: number
  currentMonthSpend: number
  previousMonthSpend: number
  monthOverMonthChange: number
  transactionCount: number
  dateRange: { start: Date; end: Date }
  categoryBreakdown: CategorySummary[]
  topMerchants: MerchantSummary[]
  recurringCharges: RecurringCharge[]
  anomalies: Anomaly[]
  healthScore: number
  monthlyTotals: { month: string; amount: number }[]
}

export interface CSVColumnMapping {
  dateColumn: string
  descriptionColumn: string
  amountColumn: string
  categoryColumn?: string
  typeColumn?: string
  debitColumn?: string
  creditColumn?: string
}

export type AIAction =
  | 'explain_anomaly'
  | 'recategorise'
  | 'what_if'
  | 'monthly_summary'
  | 'parse_csv_columns'
