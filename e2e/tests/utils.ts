import { Page, request as playwrightRequest, APIRequestContext } from '@playwright/test'

let cachedUser: any = null

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

export async function loginAsAdmin(page: Page, apiBase = 'http://localhost:3000') {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const req: APIRequestContext = await playwrightRequest.newContext({
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
  })
  let attempt = 0
  let res
  while (attempt < 3) {
    res = await req.post(`${apiBase}/auth/login`, { data: { email, password } })
    if (res.ok()) break
    if (res.status() === 429) { await sleep(12000); attempt++; continue }
    break
  }
  if (!res || !res.ok()) throw new Error(`Login failed: ${res?.status()} ${res?.statusText()}`)
  const storage = await req.storageState()
  // Force cookies to have a domain/path for Playwright
  const cookies = storage.cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: 'localhost',
    path: '/',
    httpOnly: c.httpOnly,
    secure: false,
    sameSite: 'Lax' as const,
    expires: c.expires,
  }))
  await page.context().addCookies(cookies)
  const data = await res.json()
  cachedUser = data.user
  await page.addInitScript((u) => {
    try { localStorage.setItem('user', JSON.stringify(u)) } catch {}
  }, data.user)
}

export async function newAuthedRequest(apiBase = 'http://localhost:3000') {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const req = await playwrightRequest.newContext({ extraHTTPHeaders: { 'Content-Type': 'application/json' } })
  let attempt = 0
  while (attempt < 3) {
    const res = await req.post(`${apiBase}/auth/login`, { data: { email, password } })
    if (res.ok()) return req
    if (res.status() === 429) { await sleep(12000); attempt++; continue }
    throw new Error(`Login failed: ${res.status()} ${res.statusText()}`)
  }
  return req
}


