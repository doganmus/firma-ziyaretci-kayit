import { test, expect } from '@playwright/test'
import { newAuthedRequest, loginAsAdmin } from './utils'

test.describe.serial('Vehicle events flow', () => {
  test('create entry/exit events and list', async ({ page }) => {
    const now = Date.now()
    const plate = `34ABC${(now % 900 + 100).toString()}`.slice(0, 7)
    const district = 'E2E-ILCE'
    const vehicle_type = 'BINEK'

    await loginAsAdmin(page)
    // Ensure maintenance mode is disabled
    const adminReq = await newAuthedRequest()
    await adminReq.post('http://localhost:3000/admin/ops/maintenance/disable')

    // Create via API (reuse same authenticated context to avoid rate limits)
    const atIso = new Date().toISOString()
    const createRes = await adminReq.post('http://localhost:3000/vehicle-events', {
      data: { action: 'ENTRY', plate, district, vehicle_type, at: atIso }
    })
    expect(createRes.ok()).toBeTruthy()
    const body = await createRes.json() as any
    const id: string | null = body?.id || body?.data?.id || null

    // Go to list UI and filter by plate + district
    await page.goto('/vehicles/list')
    await page.getByPlaceholder('Plaka').fill(plate)
    await page.getByPlaceholder('İlçe').fill(district)
    await page.getByRole('button', { name: 'Filtrele' }).click()
    await expect(page.getByRole('cell', { name: plate })).toBeVisible()

    // Create EXIT event via API
    const exitResSame = await adminReq.post(`http://localhost:3000/vehicle-events`, {
      data: { action: 'EXIT', plate, district, vehicle_type, at: atIso }
    })
    expect(exitResSame.ok()).toBeFalsy()
    // change time +1 minute
    const exitRes = await adminReq.post(`http://localhost:3000/vehicle-events`, {
      data: { action: 'EXIT', plate, district, vehicle_type, at: new Date(Date.now() + 60000).toISOString() }
    })
    expect(exitRes.ok()).toBeTruthy()
  })

  test('vehicle form shows title and defaults date to now', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/vehicles')
    await expect(page.getByText('Araç Kayıt')).toBeVisible()
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const expected = `${pad(now.getDate())}.${pad(now.getMonth()+1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    const value = await page.getByLabel('Tarih').locator('..').locator('input').inputValue()
    expect(value.slice(0, 13)).toBe(expected.slice(0, 13))
  })

  test('vehicle form aligned widths (Plaka=İlçe, Tarih=Araç Türü)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/vehicles')
    const plaka = await page.getByLabel('Plaka').boundingBox()
    const ilce = await page.getByLabel('İlçe').boundingBox()
    const tarih = await page.getByLabel('Tarih').boundingBox()
    const tur = await page.getByLabel('Araç Türü').boundingBox()
    expect(plaka && ilce).toBeTruthy()
    expect(tarih && tur).toBeTruthy()
    const w1 = Math.abs((plaka!.width) - (ilce!.width))
    const w2 = Math.abs((tarih!.width) - (tur!.width))
    expect(w1).toBeLessThan(10)
    expect(w2).toBeLessThan(10)
    // Also check left alignment (x positions should match within tolerance)
    expect(Math.abs(plaka!.x - ilce!.x)).toBeLessThan(5)
    expect(Math.abs(tarih!.x - tur!.x)).toBeLessThan(5)
  })

  test('EXIT without same-day ENTRY should be rejected', async ({ page }) => {
    const now = Date.now()
    const plate = `34E${(now % 900 + 100).toString()}`.slice(0, 7)
    await loginAsAdmin(page)
    const req = await newAuthedRequest()
    const atIso = new Date().toISOString()
    const res = await req.post('http://localhost:3000/vehicle-events', {
      data: { action: 'EXIT', plate, at: atIso }
    })
    expect(res.ok()).toBeFalsy()
    const body = await res.json().catch(() => null)
    expect((body?.message || '').toString()).toContain('Giriş kaydı olmayan aracın çıkış kaydı olamaz')
  })
})


