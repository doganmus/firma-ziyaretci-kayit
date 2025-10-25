import { test, expect } from '@playwright/test'
import { newAuthedRequest } from './utils'
import { loginAsAdmin } from './utils'

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

test.describe.serial('Visits flow', () => {
  test('create, list filter, and edit in place', async ({ page }) => {
    const now = Date.now()
    const visitor = `E2E ZIYARETÇI ${now}`
    const visited = `E2E HEDEF ${now}`
    const company = `E2E CO ${now}`

    // Login via API seed
    await loginAsAdmin(page)
    // Ensure maintenance mode is disabled (creates are blocked otherwise)
    const adminReq = await newAuthedRequest()
    await adminReq.post('http://localhost:3000/admin/ops/maintenance/disable')
    await page.goto('/')

    // Create visit via API for robustness
    await page.waitForURL('**/')
    const reqCreate = await newAuthedRequest()
    const createRes = await reqCreate.post('http://localhost:3000/visits', {
      data: {
        entry_at: new Date().toISOString(),
        visitor_full_name: visitor,
        visited_person_full_name: visited,
        company_name: company,
        has_vehicle: true,
        vehicle_plate: '34AB1234',
      }
    })
    expect(createRes.ok()).toBeTruthy()
    const createdBody = await createRes.json() as any
    expect(createdBody).toBeTruthy()

    // UI: go to visit form and click the inside visitors row to edit
    await page.goto('/')
    await expect(page.getByText('İçerideki Ziyaretçiler (Çıkış Yapılmamış)')).toBeVisible()
    await page.getByRole('row', { name: new RegExp(company) }).first().click()
    const newCompany = `${company}-UPDATED`
    await page.getByPlaceholder('Firma adı').fill(newCompany)
    await page.getByRole('button', { name: 'Kaydet' }).click()

    // Verify via API that update took effect
    const reqVerify = await newAuthedRequest()
    const verifyRes = await reqVerify.get('http://localhost:3000/visits', { params: { company: newCompany, page: 1, pageSize: 50 } })
    expect(verifyRes.ok()).toBeTruthy()
    const verifyData = await verifyRes.json() as any
    expect(Array.isArray(verifyData?.data) && verifyData.data.length > 0).toBeTruthy()
  })

  test('pagination: navigate between pages', async ({ page }) => {
    await loginAsAdmin(page)
    const req = await newAuthedRequest()
    const baseNow = Date.now()
    // create 25 visits via API
    for (let i = 0; i < 25; i++) {
      await req.post('http://localhost:3000/visits', {
        data: {
          entry_at: new Date(baseNow - i * 60000).toISOString(),
          visitor_full_name: `PAGETEST VISITOR ${baseNow}-${i}`,
          visited_person_full_name: `PAGETEST TARGET ${baseNow}-${i}`,
          company_name: `PAGETEST CO ${baseNow}`,
          has_vehicle: false,
        },
      })
    }
    await page.goto('/list')
    await page.getByLabel('Firma ara').fill(`PAGETEST CO ${baseNow}`)
    await page.getByRole('button', { name: 'Filtrele' }).click()
    // go to page 2
    await page.getByRole('button', { name: '2' }).click()
    // expect some row visible still
    await expect(page.getByRole('cell', { name: new RegExp(`PAGETEST CO ${baseNow}`) }).first()).toBeVisible()
  })
})


