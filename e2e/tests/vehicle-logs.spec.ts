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

    // Create via API
    const req = await newAuthedRequest()
    const createRes = await req.post('http://localhost:3000/vehicle-events', {
      data: { action: 'ENTRY', plate, district, vehicle_type, at: new Date().toISOString() }
    })
    expect(createRes.ok()).toBeTruthy()
    const body = await createRes.json() as any
    const id: string | null = body?.id || body?.data?.id || null

    // Go to list UI and filter by plate + district
    await page.goto('/vehicles/list')
    await page.getByPlaceholder('Plaka').fill(plate)
    await page.getByLabel('İlçe').getByRole('textbox').fill(district)
    await page.getByRole('button', { name: 'Filtrele' }).click()
    await expect(page.getByRole('cell', { name: plate })).toBeVisible()

    // Create EXIT event via API
    const exitRes = await req.post(`http://localhost:3000/vehicle-events`, {
      data: { action: 'EXIT', plate, district, vehicle_type, at: new Date().toISOString() }
    })
    expect(exitRes.ok()).toBeTruthy()
  })
})


