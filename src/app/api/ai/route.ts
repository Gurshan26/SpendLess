import { NextRequest, NextResponse } from 'next/server'
import type { AIAction } from '@/lib/types'

export const runtime = 'nodejs'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface AIRequest {
  action: AIAction
  data: Record<string, unknown>
}

const SYSTEM_PROMPTS: Record<AIAction, string> = {
  explain_anomaly:
    'You are a friendly, direct financial advisor. Explain a spending anomaly in 2-3 sentences. Be specific about amounts. Sound like a smart friend, not a bank. No jargon. No em dashes. No "I" at the start.',
  recategorise:
    'You are a financial data expert. Given a transaction description, suggest the most accurate category from this list: Groceries, Dining & Restaurants, Transport, Entertainment, Shopping, Utilities, Healthcare, Travel, Subscriptions, Income, Transfers, Fees & Charges, Education, Personal Care, Other. Respond with just the category name.',
  what_if:
    'You are a practical financial advisor. Given spending data and a what-if question, calculate the dollar impact and give 2-3 concrete suggestions. Be direct and specific. No financial disclaimers. No corporate language.',
  monthly_summary:
    'You are a friendly financial analyst. Write a 3-4 paragraph conversational summary of a user\'s monthly spending. Point out what was normal, what changed, and what was unusual.',
  parse_csv_columns:
    'You are a data analyst. Given CSV headers and sample rows, identify dateColumn, descriptionColumn, amountColumn, and optional categoryColumn. Respond with a valid JSON object only.',
}

function extractGeminiText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const candidateRoot = payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  return candidateRoot.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI features require a Gemini API key' },
      { status: 503 },
    )
  }

  try {
    const body = (await req.json()) as AIRequest
    const { action, data } = body

    if (!SYSTEM_PROMPTS[action]) {
      return NextResponse.json({ error: 'Unknown AI action' }, { status: 400 })
    }

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPTS[action] }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(data) }] }],
        generationConfig: {
          temperature: action === 'parse_csv_columns' ? 0 : 0.3,
          maxOutputTokens: 700,
        },
      }),
    })

    if (response.status === 429) {
      return NextResponse.json(
        {
          error: 'Give it a second — the AI rate limit was hit. Try again in a moment.',
        },
        { status: 429 },
      )
    }

    if (!response.ok) {
      const details = await response.text()
      return NextResponse.json({ error: 'AI request failed', details }, { status: 502 })
    }

    const payload = (await response.json()) as unknown
    const text = extractGeminiText(payload)

    if (action === 'parse_csv_columns') {
      try {
        const stripped = text.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(stripped) as Record<string, string | null>
        return NextResponse.json({ result: parsed })
      } catch {
        return NextResponse.json({ result: text })
      }
    }

    return NextResponse.json({ result: text })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
