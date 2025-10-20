import { test, expect } from '@playwright/test'
import { newAuthedRequest, loginAsAdmin } from './utils'

test.describe.serial('Vehicle logs flow', () => {
  test('create, list filter, and exit vehicle log', async ({ page }) => {
    const now = Date.now()
    const plate = `34ABC${(now % 900 + 100).toString()}`.slice(0, 7)
    const district = 'E2E-ILCE'
    const vehicle_type = 'BINEK'

    await loginAsAdmin(page)
    // Ensure maintenance mode is disabled
    const adminReq = await newAuthedRequest()
    await adminReq.post('http://localhost:3000/admin/ops/maintenance/disable')

    // Create via API
    const req = await newAuthedRequest()
    const createRes = await req.post('http://localhost:3000/vehicle-logs', {
      data: { plate, district, vehicle_type }
    })
    expect(createRes.ok()).toBeTruthy()
    const body = await createRes.json() as any
    const id: string | null = body?.id || body?.data?.id || null

    // Go to list UI and filter by plate + district
    await page.goto('/')
    await page.getByRole('link', { name: 'Araç Kayıtları' }).click()
    await page.waitForURL('**/vehicles/list')
    await page.getByPlaceholder('Plaka').fill(plate)
    await page.getByPlaceholder('İlçe').fill(district)
    await page.getByRole('button', { name: 'Filtrele' }).click()
    await expect(page.getByRole('cell', { name: plate })).toBeVisible()

    // Exit via API for determinism
    if (id) {
      const exitRes = await req.post(`http://localhost:3000/vehicle-logs/${id}/exit`)
      expect(exitRes.ok()).toBeTruthy()
    }
  })
})


