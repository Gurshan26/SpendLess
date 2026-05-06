import { expect, test } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots')

async function loadSampleData(page: import('@playwright/test').Page): Promise<void> {
  const trigger = page.locator('[data-testid="sample-data-btn"]')
  const overview = page.locator('[data-testid="overview-cards"]')

  await trigger.waitFor({ state: 'visible', timeout: 15000 })

  for (let attempt = 0; attempt < 5; attempt++) {
    await trigger.click()
    try {
      await overview.waitFor({ state: 'visible', timeout: 5000 })
      return
    } catch {
      await page.waitForTimeout(700)
    }
  }

  throw new Error('Sample data did not load after multiple attempts.')
}

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
})

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.title !== 'demo video - full user flow') return
  const target = path.join(SCREENSHOTS_DIR, 'demo.webm')
  const attachment = testInfo.attachments.find((item) => item.name === 'video' && item.path)
  if (attachment?.path && fs.existsSync(attachment.path)) {
    fs.copyFileSync(attachment.path, target)
    return
  }

  const video = page.video()
  if (!video) return
  const videoPath = await video.path()
  if (fs.existsSync(videoPath) && fs.statSync(videoPath).size > 0) {
    fs.copyFileSync(videoPath, target)
  }
})

test('01 - landing page with import options', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop only test')
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('[data-testid="import-zone"]')).toBeVisible()
  await expect(page.locator('[data-testid="sample-data-btn"]')).toBeVisible()
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-landing.png'), fullPage: false })
})

test('02 - dashboard overview after loading sample data', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop only test')
  await page.goto('/')
  await loadSampleData(page)
  await expect(page.locator('[data-testid="overview-cards"]')).toBeVisible({ timeout: 10000 })
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-dashboard-overview.png'), fullPage: false })
})

test('03 - anomaly feed with flagged transactions', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop only test')
  await page.goto('/')
  await loadSampleData(page)
  await page.waitForSelector('[data-testid="anomaly-feed"]')
  await page.locator('[data-testid="anomaly-feed"]').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-anomaly-feed.png'), fullPage: false })
})

test('04 - anomaly detail panel expanded', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop only test')
  await page.goto('/')
  await loadSampleData(page)
  await page.waitForSelector('[data-testid="anomaly-card"]')
  await page.locator('[data-testid="anomaly-card"]').first().getByRole('button', { name: 'View transactions' }).click()
  await expect(page.locator('[data-testid="anomaly-detail"]')).toBeVisible()
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-anomaly-detail.png'), fullPage: false })
})

test('05 - category breakdown chart', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop only test')
  await page.goto('/')
  await loadSampleData(page)
  await page.waitForSelector('[data-testid="category-breakdown"]')
  await page.locator('[data-testid="category-breakdown"]').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-category-breakdown.png'), fullPage: false })
})

test('06 - merchant insights view', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop only test')
  await page.goto('/')
  await loadSampleData(page)
  await page.waitForSelector('[data-testid="merchant-list"]')
  await page.locator('[data-testid="merchant-list"]').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-merchant-insights.png'), fullPage: false })
})

test('07 - transaction explorer with filter', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop only test')
  await page.goto('/')
  await loadSampleData(page)
  await page.waitForSelector('[data-testid="transaction-table"]')
  await page.locator('[data-testid="transaction-table"]').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-transaction-explorer.png'), fullPage: false })
})

test('08 - mobile viewport', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile only test')
  await page.goto('/')
  await loadSampleData(page)
  await page.waitForSelector('[data-testid="overview-cards"]')
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-mobile-view.png'), fullPage: false })
})

test('demo video - full user flow', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop only test')
  test.setTimeout(120000)
  const pause = async (ms: number) => page.waitForTimeout(ms)

  await page.goto('/')
  await pause(1600)

  await loadSampleData(page)
  await pause(2200)

  // Start at top overview
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await pause(1700)
  await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }))
  await pause(1600)

  // Anomaly feed: tab through filters and expand details
  await page.locator('[data-testid="anomaly-card"]').first().scrollIntoViewIfNeeded()
  await pause(900)

  const allTab = page.getByRole('tab', { name: 'All' })
  const criticalTab = page.getByRole('tab', { name: 'Critical' })
  const warningsTab = page.getByRole('tab', { name: 'Warnings' })
  const infoTab = page.getByRole('tab', { name: 'Info' })
  await criticalTab.click()
  await pause(900)
  await warningsTab.click()
  await pause(900)
  await infoTab.click()
  await pause(900)
  await allTab.click()
  await pause(900)

  const firstCard = page.locator('[data-testid="anomaly-card"]').first()
  await firstCard.getByRole('button', { name: 'View transactions' }).click()
  await pause(1200)

  // Dismiss + undo flow
  const dismissButton = firstCard.locator('[data-testid="dismiss-btn"]')
  if (await dismissButton.isVisible()) {
    await dismissButton.click()
    await pause(1100)
    const undoButton = page.getByRole('button', { name: 'Undo' }).first()
    if (await undoButton.isVisible()) {
      await undoButton.click()
      await pause(900)
    }
  }

  // Category breakdown interactions
  await page.locator('[data-testid="category-breakdown"]').scrollIntoViewIfNeeded()
  await pause(1400)
  const categoryButtons = page.locator('[aria-label^="Show details for "]')
  const categoryCount = await categoryButtons.count()
  if (categoryCount > 0) {
    await categoryButtons.nth(Math.min(1, categoryCount - 1)).click()
    await pause(900)
    await categoryButtons.nth(Math.min(2, categoryCount - 1)).click()
    await pause(900)
  }

  // Merchant section interactions
  await page.locator('[data-testid="merchant-list"]').scrollIntoViewIfNeeded()
  await pause(1300)
  const merchantSearch = page.getByLabel('Search merchant')
  await merchantSearch.fill('ADOBE')
  await pause(900)
  await merchantSearch.fill('')
  await pause(700)
  const merchantButtons = page.locator('[aria-label^="Open merchant "]')
  const merchantCount = await merchantButtons.count()
  if (merchantCount > 0) {
    await merchantButtons.nth(Math.min(1, merchantCount - 1)).click()
    await pause(900)
  }

  // Subscription tracker
  await page.locator('[data-testid="subscription-tracker"]').scrollIntoViewIfNeeded()
  await pause(1400)

  // Transaction explorer interactions
  await page.locator('[data-testid="transaction-table"]').scrollIntoViewIfNeeded()
  await pause(1300)

  await page.getByLabel('Search transactions').fill('uber')
  await pause(900)
  await page.getByLabel('Search transactions').fill('')
  await pause(600)
  await page.getByLabel('Filter category').selectOption('Groceries')
  await pause(900)
  await page.getByLabel('Filter category').selectOption('all')
  await pause(800)
  await page.getByLabel('Sort transactions').selectOption('amount')
  await pause(900)
  await page.getByLabel('Sort direction').selectOption('asc')
  await pause(900)
  await page.getByLabel('Sort direction').selectOption('desc')
  await pause(700)

  const anomalyFilter = page.locator('[data-testid="filter-anomalies"]')
  if (await anomalyFilter.isVisible()) {
    await anomalyFilter.click()
    await pause(900)
    await anomalyFilter.click()
    await pause(700)
  }

  const firstRow = page.locator('[data-testid="transaction-table"] tbody tr').first()
  if (await firstRow.isVisible()) {
    await firstRow.click()
    await pause(1100)
  }

  // Tools section
  await page.getByRole('heading', { name: 'Tools' }).scrollIntoViewIfNeeded()
  await pause(1500)

  // Full-page end and return to top
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }))
  await pause(1800)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await pause(1800)
})
