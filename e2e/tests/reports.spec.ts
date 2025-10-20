import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './utils'

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

test('Reports load and filter (legacy reports page)', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/reports')
  // Eğer menüde Rapor yoksa doğrudan rota ile açılmasını doğrula
  await page.waitForURL('**/reports')
  // Header is a plain div, use label region
  await expect(page.getByLabel('Ana içerik').getByText('Rapor')).toBeVisible()
  // Apply filters (button could be named differently; try generic primary)
  const filterBtn = page.getByRole('button', { name: /Uygula|Filtrele/i }).first()
  await filterBtn.click()
  // Expect some content to be visible
  await expect(page.getByText(/Toplam|Firma Bazlı|Özet/i).first()).toBeVisible()
})


