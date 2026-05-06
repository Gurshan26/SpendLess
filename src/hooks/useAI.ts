'use client'

import { useCallback, useState } from 'react'
import type { AIAction } from '@/lib/types'

interface AIRequestPayload {
  action: AIAction
  data: Record<string, unknown>
}

interface AIState {
  loading: boolean
  error: string | null
}

export function useAI() {
  const [state, setState] = useState<AIState>({ loading: false, error: null })
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number>(0)

  const callAI = useCallback(async (payload: AIRequestPayload): Promise<string | Record<string, unknown>> => {
    const now = Date.now()
    if (now < rateLimitedUntil) {
      throw new Error('Give it a second — the AI rate limit was hit. Try again in a moment.')
    }

    if (state.loading) {
      throw new Error('One AI request is already running. Give it a second.')
    }

    setState({ loading: true, error: null })

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const body = (await response.json()) as { result?: string | Record<string, unknown>; error?: string }

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get('retry-after') ?? '10')
          const waitMs = Number.isFinite(retryAfter) ? Math.max(retryAfter, 10) * 1000 : 10000
          setRateLimitedUntil(Date.now() + waitMs)
        }
        throw new Error(body.error ?? 'AI request failed')
      }

      setState({ loading: false, error: null })
      return body.result ?? ''
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong'
      setState({ loading: false, error: message })
      throw new Error(message)
    }
  }, [rateLimitedUntil, state.loading])

  return {
    loading: state.loading,
    error: state.error,
    callAI,
  }
}
