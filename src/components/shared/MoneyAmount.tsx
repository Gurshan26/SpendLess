import clsx from 'clsx'

interface MoneyAmountProps {
  amount: number
  className?: string
  showSign?: boolean
  compact?: boolean
}

export default function MoneyAmount({ amount, className, showSign = false, compact = false }: MoneyAmountProps) {
  const formatted = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(amount)

  const withSign = showSign && amount > 0 ? `+${formatted}` : formatted

  return <span className={clsx('money', className)}>{withSign}</span>
}
