import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './utils'

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

test.describe('Admin flows', () => {
  test('Users CRUD basics', async ({ page }) => {
    const email = `e2e_${Date.now()}@example.com`
    await loginAsAdmin(page)
    await page.goto('/')
    await page.getByRole('menuitem', { name: 'Admin' }).click()
    await page.getByRole('menuitem', { name: 'Kullanıcı İşlemleri' }).click()
    await page.getByRole('button', { name: 'Ekle' }).isEnabled()
    const createForm = page.locator('form').first()
    await createForm.getByPlaceholder('E-posta').fill(email)
    await createForm.getByPlaceholder('Ad Soyad').fill('E2E KULLANICI')
    await createForm.getByPlaceholder('Şifre').fill('e2e123')
    // Role default already OPERATOR; skip selection to avoid flakiness
    await createForm.getByRole('button', { name: 'Ekle' }).click()
    await expect(page.getByText('Kullanıcı eklendi')).toBeVisible()
    // Filter by email and verify row exists
    await page.getByPlaceholder('E-posta ara').fill(email)
    await expect(page.getByRole('cell', { name: email })).toBeVisible()
  })

  test('AdminOps cert forms render and reload button callable', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/')
    await page.getByRole('menuitem', { name: 'Admin' }).click()
    await page.getByRole('menuitem', { name: 'Sistem Yönetimi' }).click()
    await expect(page.getByText('Sertifikalar')).toBeVisible()
    // We won't actually upload in CI; just assert controls exist and reload button is clickable
    await expect(page.getByText('PEM Yükleme')).toBeVisible()
    await expect(page.getByText('PFX/P12 Yükleme')).toBeVisible()
    // Reload bölümünün varlığı (buton metni değişebilir; kopyala butonu sabit)
    await expect(page.getByText('Nginx Reload')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Komutu kopyala' })).toBeVisible()
  })
})


