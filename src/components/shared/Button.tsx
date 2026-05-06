'use client'

import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)] border border-[var(--accent-dark)]',
  secondary: 'bg-white text-[var(--ink)] border border-[var(--border-2)] hover:bg-[var(--surface-2)]',
  ghost: 'bg-transparent text-[var(--ink-2)] border border-transparent hover:bg-[var(--surface-2)]',
  danger: 'bg-[var(--critical)] text-white border border-[var(--critical)] hover:opacity-90',
}

export default function Button({
  className,
  variant = 'primary',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        variantClass[variant],
        className,
      )}
    >
      {loading ? 'Working…' : children}
    </button>
  )
}
