'use client'

import { useMemo } from 'react'
import ImportZone from '@/components/import/ImportZone'
import OverviewCards from '@/components/overview/OverviewCards'
import HealthScore from '@/components/overview/HealthScore'
import SpendForecast from '@/components/overview/SpendForecast'
import AnomalyFeed from '@/components/anomalies/AnomalyFeed'
import CategoryBreakdown from '@/components/categories/CategoryBreakdown'
import MerchantList from '@/components/merchants/MerchantList'
import SubscriptionTracker from '@/components/merchants/SubscriptionTracker'
import TransactionTable from '@/components/transactions/TransactionTable'
import SpendingTrendChart from '@/components/charts/SpendingTrendChart'
import WeeklyHeatmap from '@/components/charts/WeeklyHeatmap'
import MonthComparisonChart from '@/components/charts/MonthComparisonChart'
import WhatIfSimulator from '@/components/tools/WhatIfSimulator'
import MonthlySummary from '@/components/tools/MonthlySummary'
import EmptyState from '@/components/shared/EmptyState'
import Button from '@/components/shared/Button'
import { useFinancialData } from '@/hooks/useFinancialData'
import { useAnomalies } from '@/hooks/useAnomalies'
import { useAI } from '@/hooks/useAI'
import { projectEndOfMonthSpend } from '@/lib/forecasting'
import { anomaliesByTransactionId, PEER_BENCHMARKS } from '@/lib/financial-summary'
import { SAMPLE_DATA_PREVIEW } from '@/lib/sample-data'
import type { Anomaly, CSVColumnMapping, Transaction } from '@/lib/types'

interface SpendLensAppProps {
  aiEnabled: boolean
}

function toRecord(value: string | Record<string, unknown>): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>
      return parsed
    } catch {
      return {}
    }
  }
  return value
}

function formatAIError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'AI request failed'
  if (/gemini api key/i.test(message)) {
    return 'AI features need a Gemini API key in .env.local. Add GEMINI_API_KEY, then restart npm run dev.'
  }
  return message
}

export default function SpendLensApp({ aiEnabled }: SpendLensAppProps) {
  const store = useFinancialData()
  const { loading: aiLoading, error: aiError, callAI } = useAI()
  const anomaliesState = useAnomalies(store.summary?.anomalies ?? [])

  const summary = store.summary
  const forecast = useMemo(
    () => (store.transactions.length ? projectEndOfMonthSpend(store.transactions) : null),
    [store.transactions],
  )

  const anomalyMap = useMemo(() => anomaliesByTransactionId(anomaliesState.anomalies), [anomaliesState.anomalies])

  const firstTimeMerchantNames = useMemo(
    () =>
      anomaliesState.anomalies
        .filter((anomaly) => anomaly.type === 'new_merchant')
        .flatMap((anomaly) => anomaly.relatedTransactions.map((txn) => txn.merchant)),
    [anomaliesState.anomalies],
  )

  const explainAnomaly = async (anomaly: Anomaly): Promise<void> => {
    if (!summary) return
    if (!aiEnabled) {
      anomaliesState.setAIExplanation(
        anomaly.id,
        'AI explain is off right now. Add GEMINI_API_KEY in .env.local, then restart the dev server.',
      )
      return
    }

    try {
      const result = await callAI({
        action: 'explain_anomaly',
        data: {
          anomaly,
          category_summary: summary.categoryBreakdown,
        },
      })

      if (typeof result === 'string' && result.trim().length > 0) {
        anomaliesState.setAIExplanation(anomaly.id, result)
      }
    } catch (error) {
      const message = formatAIError(error)
      throw new Error(message)
    }
  }

  const assistColumnMapping = async (
    headers: string[],
    rows: Record<string, string>[],
  ): Promise<Partial<CSVColumnMapping> | null> => {
    if (!aiEnabled) return null
    const result = await callAI({
      action: 'parse_csv_columns',
      data: {
        headers,
        rows,
      },
    })

    const parsed = toRecord(result)
    const mapping: Partial<CSVColumnMapping> = {
      dateColumn: typeof parsed.dateColumn === 'string' ? parsed.dateColumn : undefined,
      descriptionColumn: typeof parsed.descriptionColumn === 'string' ? parsed.descriptionColumn : undefined,
      amountColumn: typeof parsed.amountColumn === 'string' ? parsed.amountColumn : undefined,
      categoryColumn: typeof parsed.categoryColumn === 'string' ? parsed.categoryColumn : undefined,
    }

    if (!mapping.dateColumn || !mapping.descriptionColumn || !mapping.amountColumn) {
      return null
    }

    return mapping
  }

  const recategorise = async (transaction: Transaction): Promise<string> => {
    if (!aiEnabled) return 'AI is disabled'
    try {
      const result = await callAI({
        action: 'recategorise',
        data: {
          description: transaction.description,
          merchant: transaction.merchant,
          currentCategory: transaction.category,
        },
      })

      if (typeof result === 'string') {
        return result.trim()
      }
    } catch (error) {
      return formatAIError(error)
    }

    return 'Other'
  }

  const runWhatIf = async (question: string): Promise<string> => {
    if (!summary || !aiEnabled) {
      return 'Add a Gemini API key to enable this tool.'
    }

    try {
      const result = await callAI({
        action: 'what_if',
        data: {
          summary,
          user_question: question,
        },
      })

      return typeof result === 'string' ? result : JSON.stringify(result)
    } catch (error) {
      return formatAIError(error)
    }
  }

  const generateMonthlySummary = async (): Promise<string> => {
    if (!summary || !aiEnabled) {
      return 'AI summary is disabled until a Gemini key is configured.'
    }

    try {
      const result = await callAI({
        action: 'monthly_summary',
        data: {
          summary,
        },
      })

      return typeof result === 'string' ? result : JSON.stringify(result)
    } catch (error) {
      return formatAIError(error)
    }
  }

  const exportFilteredRows = (rows: Transaction[]) => {
    const header = 'Date,Merchant,Description,Category,Type,Amount\n'
    const lines = rows
      .map((txn) => {
        const values = [
          txn.date.toISOString().slice(0, 10),
          txn.merchant,
          txn.description,
          txn.category,
          txn.type,
          txn.amount.toFixed(2),
        ]
        return values.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')
      })
      .join('\n')

    const blob = new Blob([header + lines], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `spendlens-export-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <ImportZone
        onLoadSample={store.loadSampleData}
        onParseCSV={store.loadCSVText}
        onAIAssistMapping={assistColumnMapping}
        aiEnabled={aiEnabled}
        sampleTransactionCount={SAMPLE_DATA_PREVIEW.transactions}
      />

      {!summary ? (
        <EmptyState
          title="No data loaded yet"
          message="Explore the sample dataset or drop in a CSV to see anomalies, category drift, subscriptions, and merchant insights."
        />
      ) : (
        <>
          <section className="space-y-4">
            <OverviewCards
              currentMonthSpend={summary.currentMonthSpend}
              previousMonthSpend={summary.previousMonthSpend}
              monthOverMonthChange={summary.monthOverMonthChange}
              anomalyCount={anomaliesState.filtered.length}
              runRate={forecast?.projectedMonthSpend ?? summary.currentMonthSpend}
            />
            <div className="grid gap-4 xl:grid-cols-2">
              <HealthScore score={summary.healthScore} />
              {forecast ? <SpendForecast forecast={forecast} /> : null}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <div className="space-y-6">
              <AnomalyFeed
                anomalies={anomaliesState.filtered}
                filter={anomaliesState.filter}
                onFilterChange={anomaliesState.setFilter}
                onDismiss={anomaliesState.dismiss}
                onUndismiss={anomaliesState.undismiss}
                onAIExplain={explainAnomaly}
                canAIExplain={aiEnabled}
                aiBusy={aiLoading}
              />

              {anomaliesState.dismissed.length > 0 ? (
                <div className="card flex items-center justify-between p-3 text-sm">
                  <span>{anomaliesState.dismissed.length} anomaly cards dismissed.</span>
                  <Button
                    variant="secondary"
                    onClick={() => anomaliesState.dismissed.forEach((item) => anomaliesState.undismiss(item.id))}
                  >
                    Restore all
                  </Button>
                </div>
              ) : null}

              <CategoryBreakdown
                categorySummary={summary.categoryBreakdown}
                transactions={store.transactions}
                peerBenchmarks={PEER_BENCHMARKS}
              />

              <MerchantList
                merchants={summary.topMerchants}
                transactions={store.transactions}
                firstTimeMerchantNames={firstTimeMerchantNames}
              />

              <SubscriptionTracker recurringCharges={summary.recurringCharges} />
            </div>

            <div className="space-y-4">
              <SpendingTrendChart monthlyTotals={summary.monthlyTotals} />
              <MonthComparisonChart data={summary.monthlyTotals} />
              <WeeklyHeatmap transactions={store.transactions} />
            </div>
          </div>

          <TransactionTable
            transactions={store.transactions}
            anomalyMap={anomalyMap}
            onRecategorise={recategorise}
            onExportCSV={exportFilteredRows}
          />

          <section className="space-y-4">
            <h2 className="section-title">Tools</h2>
            <p className="section-subtitle">Try scenarios and generate a plain-English money story.</p>
            {aiError ? (
              <div className="card border-[var(--warning)]/30 bg-[var(--warning-bg)] p-3 text-sm text-[var(--warning)]">
                {formatAIError(new Error(aiError))}
              </div>
            ) : null}
            <div className="grid gap-4 xl:grid-cols-2">
              <WhatIfSimulator onAsk={runWhatIf} disabled={!aiEnabled || aiLoading} />
              <MonthlySummary onGenerate={generateMonthlySummary} disabled={!aiEnabled || aiLoading} />
            </div>
          </section>
        </>
      )}
    </main>
  )
}
