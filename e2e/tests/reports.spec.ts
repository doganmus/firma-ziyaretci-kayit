import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './utils'

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

test('Reports load and filter', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/')
  await page.getByRole('link', { name: 'Rapor' }).click()
  await page.waitForURL('**/reports')
  // Header is a plain div, use label region
  await expect(page.getByLabel('Ana içerik').getByText('Rapor')).toBeVisible()
  // Apply filters
  await page.getByRole('button', { name: 'Uygula' }).click()
  // Expect summary cards or skeleton to disappear
  await expect(page.getByText('Toplam')).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
})


