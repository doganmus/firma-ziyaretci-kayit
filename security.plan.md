<!-- 87f8af0e-8fd5-42ff-9357-4aabb5aa2b42 88a89d3d-e3f7-4be5-94e3-4f0837001ba8 -->
# Canlıya Çıkış Hazırlık Planı

## Özet

Mevcut güvenlik iyileştirmeleri tamamlandı. Canlı öncesi, E2E testlerini HttpOnly cookie’ye uyarladık, docker.sock bağımlılığını prod’dan kaldırdık, CSP’yi izleyip enforce’a geçiş adımlarını ve operasyon/runbook’u bu dosyada topladık.

## Projede Yapılacaklar (Kod/Repo)

1) E2E’yi cookie tabanlı login’e uyarlama

- `e2e/tests/utils.ts` içinde token’a dayalı akış kaldırıldı; Set-Cookie, tarayıcı bağlamına enjekte ediliyor. Örnek öz kod:
```24:43:e2e/tests/utils.ts
// Login sonrası cookie'yi test context'ine aktarın
export async function loginAsAdmin(page: Page, apiBase = 'http://localhost:3000') {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const req = await playwrightRequest.newContext()
  const res = await req.post(`${apiBase}/auth/login`, { data: { email, password } })
  if (!res.ok()) throw new Error(`Login failed: ${res.status()}`)
  const storage = await req.storageState()
  // HttpOnly cookie'yi tarayıcı context'ine enjekte
  const cookies = storage.cookies.map(c => ({ ...c, url: apiBase }))
  await page.context().addCookies(cookies)
  // UI tarafında user bilgisini yerel depoya yazarak menü/rol görünürlüğünü sağlar
  const data = await res.json()
  await page.addInitScript((u) => localStorage.setItem('user', JSON.stringify(u)), data.user)
}
```

2) Prod’da docker.sock kaldırma

- `docker-compose.yml` içindeki docker.sock mount’u kaldırıldı. Backend’teki `POST /admin/ops/nginx/reload` endpoint’i prod’da kullanılmayacak.

3) CSP’yi enforce’a geçirme için adımlar

- `frontend/nginx/default.conf`’te `Content-Security-Policy-Report-Only` devrede. Enforce’a geçiş adımları runbook’ta.

4) (Opsiyonel) Metrics/Health IP allowlist için Nginx kuralı

- Prod’da `metrics`’i dışarı açmanız gerekiyorsa Nginx’e ayrı `location /metrics` bloğu ekleyin (runbook’ta örnek var).

## Canlıda Yapılacaklar (Runbook)

1) Gizli bilgiler ve ortam değişkenleri

- `JWT_SECRET` (uzun, rastgele), `DATABASE_URL` (TLS ile), `PGADMIN_*` yalnızca staging/dev.
- Dev’de `ALLOWED_ORIGINS=http://localhost:5173`; prod’da bu değişkeni kaldırın.

2) TLS kurulum

- Üretim sertifikalarını host’ta `certs/server.crt` ve `certs/server.key` olarak yerleştirin (veya Admin → Ops ekranından PEM/PFX yükleyin), ardından Nginx’i yeniden yükleyin.

3) docker.sock kaldırma (prod)

- `docker-compose.yml`’de docker.sock mount’u kaldırıldığı için ek işlem yok. Geliştirme için gerekiyorsa ayrı override dosyası kullanın.

4) CSP enforce’a geçiş

- İlk 24–48 saat `Report-Only` loglarını izleyin. Sorun yoksa `frontend/nginx/default.conf` içinde şunu ekleyip report-only olanı kaldırın:
```42:48:frontend/nginx/default.conf
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https: http:; frame-ancestors 'self'; base-uri 'self'" always;
```
- Ardından frontend’i yeniden deploy edin.

5) Metrics/Health sınırlama (harici gerekiyorsa)

- Nginx’e ayrı bir blok ekleyin:
```48:61:frontend/nginx/default.conf
location /metrics {
  allow 10.0.0.0/8; allow 172.16.0.0/12; allow 192.168.0.0/16; deny all;
  proxy_set_header Host $host;
  proxy_pass http://backend:3000/metrics;
}
```

6) Migrasyonlar

- Backend container başlarken migrasyonları otomatik ve fail‑fast uygular. İlk yayında logları doğrulayın: `[migrations] Applied`.
- Gerekirse manuel: `docker compose exec backend node dist/scripts/runMigrations.js`

7) Yedekleme / Geri Yükleme

- Günlük yedek (Linux host):
```bash
0 2 * * * docker compose exec -T db pg_dump -U $POSTGRES_USER -d $POSTGRES_DB | gzip > /backups/$(date +\%F).sql.gz
```
- Windows Task Scheduler: `scripts/backup-db.ps1` kullanın. Geri yükleme için `scripts/restore-db.ps1`.

8) İzleme ve Uyarılar

- Prometheus hedefi: backend servis adı ve iç ağ adresini kullanın (`backend:3000`).
- Grafana: Var olan dashboard’lar yüklü. Prod URL’leri ile datasource’u doğrulayın, uyarı kuralları ekleyin.

9) Staging → Prod dağıtım akışı

- Staging’e `docker compose up -d --build` ile dağıtın, smoke test: `npm test` (e2e).
- Başarılı ise aynı image tag’leriyle prod’a geçin, migrasyon loglarını ve metrikleri doğrulayın.

10) Rollback planı

- Bir önceki image tag’ine dönün; DB için son yedeği geri yükleyin (`scripts/restore-db.ps1`/`psql`).

### To-dos (Takip)

- [x] E2E login’i HttpOnly cookie’ye uyarlayın (utils.ts + istekler cookie jar)
- [x] Prod compose’dan docker.sock mount’unu kaldırın; reload endpoint’i kullanmayın
- [ ] CSP’yi report-only → enforce geçirecek config/doküman hazırla
- [ ] (Gerekiyorsa) /metrics için Nginx IP allowlist bloğu ekle

