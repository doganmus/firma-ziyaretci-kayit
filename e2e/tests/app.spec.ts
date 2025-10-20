import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './utils'

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

test.describe('App smoke', () => {
  test('login opens dashboard by default', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard')
    // Dashboard başlığı veya menü öğesi görünmeli
    await expect(page.getByText('Dashboard').first()).toBeVisible()
    // En az bir grafik render edilmiş olmalı (recharts svg veya ant-design/plots canvas)
    await expect(page.locator('svg.recharts-surface, canvas').first()).toBeVisible()
  })

  test('maintenance mode flow (admin)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/')
    await page.waitForURL('**/')

    // go to Admin → Sistem Yönetimi
    await page.getByRole('menuitem', { name: 'Admin' }).click()
    await page.getByRole('menuitem', { name: 'Sistem Yönetimi' }).click()
    await expect(page.getByText('Sertifikalar')).toBeVisible()

    // Toggle maintenance (robust to initial state)
    const toggle = page.getByRole('switch').first()
    const before = await toggle.getAttribute('aria-checked')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true')
    // Toggle back
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', before || 'false')
  })
})


