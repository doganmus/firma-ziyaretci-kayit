import { Page, request as playwrightRequest, APIRequestContext } from '@playwright/test'

let cachedUser: any = null

export async function loginAsAdmin(page: Page, apiBase = 'http://localhost:3000') {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const req: APIRequestContext = await playwrightRequest.newContext({
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
  })
  const res = await req.post(`${apiBase}/auth/login`, { data: { email, password } })
  if (!res.ok()) throw new Error(`Login failed: ${res.status()} ${res.statusText()}`)
  const storage = await req.storageState()
  const cookies = storage.cookies.map((c) => ({ ...c, url: apiBase }))
  await page.context().addCookies(cookies)
  const data = await res.json()
  cachedUser = data.user
  await page.addInitScript((u) => {
    try { localStorage.setItem('user', JSON.stringify(u)) } catch {}
  }, data.user)
}

export async function newAuthedRequest(apiBase = 'http://localhost:3000') {
  // Cookie tabanlı context
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const req = await playwrightRequest.newContext()
  const res = await req.post(`${apiBase}/auth/login`, { data: { email, password } })
  if (!res.ok()) throw new Error(`Login failed: ${res.status()} ${res.statusText()}`)
  return req
}


