import { Page, request as playwrightRequest, APIRequestContext } from '@playwright/test'

let cachedToken: string | null = null
let cachedUser: any = null

export async function loginAsAdmin(page: Page, apiBase = 'http://localhost:3000') {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  let token = cachedToken
  let user = cachedUser
  if (!token) {
    const req: APIRequestContext = await playwrightRequest.newContext()
    const res = await req.post(`${apiBase}/auth/login`, { data: { email, password } })
    if (!res.ok()) throw new Error(`Login failed: ${res.status()} ${res.statusText()}`)
    const data = await res.json()
    token = data.accessToken as string
    user = data.user
    cachedToken = token
    cachedUser = user
  }
  await page.addInitScript(([t, u]) => {
    try {
      localStorage.setItem('accessToken', t as string)
      localStorage.setItem('user', JSON.stringify(u))
    } catch {}
  }, [token, user])
  return token
}

export async function newAuthedRequest(apiBase = 'http://localhost:3000') {
  // ensure token
  if (!cachedToken) {
    const req0 = await playwrightRequest.newContext()
    const res0 = await req0.post(`${apiBase}/auth/login`, { data: { email: process.env.ADMIN_EMAIL || 'admin@example.com', password: process.env.ADMIN_PASSWORD || 'admin123' } })
    if (res0.ok()) {
      const data = await res0.json() as any
      cachedToken = data?.accessToken || null
    }
  }
  const req = await playwrightRequest.newContext({
    extraHTTPHeaders: cachedToken ? { Authorization: `Bearer ${cachedToken}` } : {},
  })
  return req
}


