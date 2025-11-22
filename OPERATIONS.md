## Operasyonlar ve Komutlar

### Docker Komutları
- İlk kurulum ve çalıştırma
`powershell
# Windows (Docker Desktop): docker CLI PATH'te değilse tam yolu kullanın
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose up -d --build
`
- Loglar
`powershell
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose logs -f backend
`
- Durdurma ve silme
`powershell
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose down
`

#### Linux/Unix
- İlk kurulum ve çalıştırma
`bash
cp .env.example .env
docker compose up -d --build
`
- Durdurma ve volume’ları sıfırlama (temiz başlangıç)
`bash
docker compose down -v
docker compose up -d
`

### Reverse Proxy
- Frontend Nginx, /api yolunu otomatik olarak backend:3000 servisine proxy'ler.
- /uploads yolu backend'in statik dosya servisine (http://backend:3000/uploads) proxy edilir.
- Frontend kodu VITE_API_URL yoksa otomatik /api tabanını kullanır.

### Sertifikalar (SSL)
- Sertifikalar `certs/server.crt` ve `certs/server.key` olarak projede tutulur ve frontend Nginx container'ına mount edilir.
- Self-signed üretmek için (PowerShell):
`powershell
./scripts/generate-ssl.ps1 -Days 365 -CommonName localhost
./scripts/reload-nginx.ps1
`

#### UI Üzerinden Yükleme (Admin → Sistem Yönetimi)
- PEM yükleme: `server.crt` ve `server.key` (opsiyonel `chain`) dosyalarını seçin ve yükleyin. Ardından `./scripts/reload-nginx.ps1` ile Nginx’i yeniden yükleyin.
- PFX/P12 yükleme: `.pfx/.p12` dosyanızı ve parolasını girin, yükleyin; işlem sonunda `server.crt` ve `server.key` üretilir. Sonrasında Nginx reload yapın.
- Not: Backend `./certs` (container: `/app/certs`) dizinine yazar; frontend container bu klasörü `/etc/nginx/certs` olarak kullanır.

### Yedekleme / Geri Yükleme
- Veritabanı yedeği almak:
`powershell
./scripts/backup-db.ps1 -File backups/backup.sql
`
- Yedekten geri yüklemek:
`powershell
./scripts/restore-db.ps1 -File backups/backup.sql
`

### Ops Durum
- Servis durumlarını görmek:
`powershell
./scripts/ops-status.ps1
`

### Admin Ops API (yalnız ADMIN)
- Bakım modu aç: `POST /api/admin/ops/maintenance/enable`
- Bakım modu kapat: `POST /api/admin/ops/maintenance/disable`
- Audit temizliği: `POST /api/admin/ops/audit/cleanup` body: `{ olderThanDays: 30 }`
- Durum: `GET /api/admin/ops/status`

### Rotalar
- Varsayılan sayfa: /  Kayıt (VisitForm)
- Kayıtlar listesi: /list
- VIEWER rolü /'e giderse otomatik /list'e yönlendirilir.

### Navigasyon
- Sol daralabilir Sider (hamburger) menü: Kayıt, Kayıtlar, Rapor ve Admin altındaki alt menüler.
- Admin alt menüleri: Kullanıcı İşlemleri, Marka Ayarları.

### Rapor Dışa Aktarım ve Tema
- Raporlar: /api/reports/export/excel?dateFrom=...&dateTo=... → Excel (xlsx), /api/reports/export/pdf?dateFrom=...&dateTo=... → PDF
- Ziyaretler listesi Excel: "Excel" butonu .xls (XML Spreadsheet) indirir (istemci tarafı)
- Dark Mode: Navbar sağındaki seçim ile tema değiştir; tercih localStorage'da saklanır.

### Monitoring / Metrics
- Prometheus: http://localhost:9090 (backend /metrics scrape)
- Grafana: http://localhost:3001  (admin / admin)
- Dashboardlar: NodeJS App, Prometheus 2.0 Stats (provisioned)

### Audit Log
- Otomatik olarak tüm istekler için audit_logs tablosuna meta veri yazılır (yöntem, yol, kullanıcı, durum, süre).
- Hassas veriler payload olarak loglanmaz.

### Performans İpuçları
- /visits endpointi server-side sıralama ve sayfalama destekler: `sortKey, sortOrder, page, pageSize`.
- Büyük listelerde filtre kolonlarına indeksler eklendi (ziyaretçi, ziyaret edilen, firma, giriş tarihi).

### Marka Ayarları ve Yüklemeler
- Admin → Marka Ayarları: Firma adı veya PNG logo yükleyin (tek tercih). Logo yüklenirse firma adı saklanmaz.
- Yüklenen logolar backend konteynerindeki /app/uploads altında saklanır ve Docker volume (uploads_data) ile kalıcıdır.
- Dosya URL'leri /uploads/... şeklinde yayınlanır; Nginx bunları backend'e proxy eder.

### Ortam Değişkenleri (.env)
- **Zorunlu Değişkenler:**
  - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: PostgreSQL ayarları
  - `NODE_ENV`: Ortam tipi (`production`, `development`, `test`)
  - `JWT_SECRET`: Backend için JWT imzalama anahtarı (minimum 32 karakter, önerilen: 64+)
  - `DATABASE_URL`: PostgreSQL bağlantı string'i
  - Production'da: `FRONTEND_URL` veya `ALLOWED_ORIGINS` (CORS için)
- **Opsiyonel Değişkenler:**
  - `PORT`: Backend port numarası (varsayılan: 3000)
  - `FRONTEND_URL`: Production'da tek frontend URL'i (örn: `https://example.com`)
  - `ALLOWED_ORIGINS`: Virgülle ayrılmış izinli origin'ler (development veya production)
  - `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`: İlk admin kullanıcı seed'i
  - `PGADMIN_EMAIL`, `PGADMIN_PASSWORD`: pgAdmin giriş bilgileri (sadece development/staging)
  - `BUSINESS_TZ`: İş saatleri için timezone (IANA format, örn: `Europe/Istanbul`)
- **Not:** Tüm environment variable'lar startup'ta validate edilir. Eksik veya geçersiz değişkenlerde uygulama başlamaz. `.env.example` dosyasını referans olarak kullanabilirsiniz.

### JWT_SECRET Güvenli Oluşturma
- **Otomatik Script (Önerilen):**
  ```powershell
  # Windows
  .\scripts\generate-jwt-secret.ps1
  
  # Linux/Mac
  ./scripts/generate-jwt-secret.sh
  ```
- Script özellikleri:
  - Cryptographically secure random string (64+ karakter)
  - Otomatik .env backup oluşturma
  - Mevcut JWT_SECRET'ı güvenli şekilde değiştirme
- **Önemli Notlar:**
  - JWT_SECRET değişikliği tüm aktif kullanıcı session'larını geçersiz kılar
  - Production'da maintenance window'da yapılmalı
  - Backend container'ı yeniden başlatılmalı
  - Yeni secret güvenli bir yerde saklanmalı

### FRONTEND_URL Yapılandırması (Production)
- Production ortamında frontend'in erişilebilir olduğu URL'i belirtin:
  ```env
  FRONTEND_URL=https://yourdomain.com
  ```
- **Yapılandırma Adımları:**
  1. Production domain'i belirleyin
  2. `.env` dosyasına `FRONTEND_URL=https://yourdomain.com` ekleyin
  3. Backend container'ını yeniden başlatın: `docker compose restart backend`
  4. CORS yapılandırmasının aktif olduğunu doğrulayın
- **Alternatif:** Birden fazla origin için `ALLOWED_ORIGINS` kullanın:
  ```env
  ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
  ```
- **Not:** FRONTEND_URL veya ALLOWED_ORIGINS yoksa CORS devre dışı kalır ve frontend backend'e erişemeyebilir.

### Veritabanı
- Bağlantı: postgres://:@db:5432/
- Yedekleme (container içinden)
`powershell
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose exec db pg_dump -U   | Out-File -FilePath backup.sql -Encoding ascii
`
- Geri yükleme
`powershell
Get-Content backup.sql | & "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose exec -T db psql -U  
`

### Production Deployment Checklist
- [ ] `.env` dosyası oluşturuldu ve tüm zorunlu değişkenler ayarlandı
- [ ] JWT_SECRET güvenli bir şekilde oluşturuldu (64+ karakter, `generate-jwt-secret` script kullanıldı)
- [ ] FRONTEND_URL production domain ile yapılandırıldı
- [ ] SSL sertifikaları yüklendi (production için)
- [ ] Database migration'ları çalıştırıldı
- [ ] Backend ve frontend container'ları başlatıldı
- [ ] Health check endpoint'leri test edildi (`/health`, `/health/detailed`)
- [ ] Frontend'den backend'e API çağrıları test edildi
- [ ] Login işlemi test edildi

### TypeORM Migration
- Prod'da `synchronize=false` kullanılır; migration hatası durumda başlatma başarısız olur.
  - Migration üret/çalıştır:
  - `npm run typeorm migration:generate -n init`
  - `npm run typeorm migration:run`

### Seed ve Test (Aşama 1)
- Admin kullanıcı seed
`powershell
 = @{ email = 'admin@example.com'; password = 'admin123'; full_name = 'Admin'; role = 'ADMIN' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/admin/users' -ContentType 'application/json' -Body 
`
- Operator kullanıcı seed
`powershell
 = @{ email = 'admin@example.com'; password = 'admin123' } | ConvertTo-Json
 = (Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/auth/login' -ContentType 'application/json' -Body ).accessToken
 = @{ Authorization = "Bearer " }
 = @{ email = 'operator@example.com'; password = 'operator123'; full_name = 'Operator'; role = 'OPERATOR' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/admin/users' -Headers  -ContentType 'application/json' -Body 
`
-- Login testi (cookie tabanlı)
`powershell
 = @{ email = 'operator@example.com'; password = 'operator123' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/auth/login' -ContentType 'application/json' -Body  -SessionVariable s
($s.Cookies.GetCookies('http://localhost:3000')['access_token']).Value # doğrula
`

### HTTPS (Geliştirme için self-signed)
- Sertifika oluşturma (PowerShell, OpenSSL):
`powershell
mkdir certs
openssl req -x509 -newkey rsa:2048 -nodes -keyout certs/server.key -out certs/server.crt -days 365 -subj "/CN=localhost"
`
- Compose ile frontend 443 portu 5443e map edilmiştir: https://localhost:5443
- Sertifikayı tarayıcıya güvenilir olarak eklemeniz gerekebilir (geliştirme ortamı).

### Sorun Giderme
- Backend API açılmıyor
  - log: compose logs -f backend
  - .env değerlerini doğrulayın
- Postgres env değişkenleri boş uyarısı
  - `.env` eksik olabilir. `.env.example` içeriğiyle `.env` oluşturun ve yeniden başlatın.
- Frontend 5173 portu dolu
  - compose port eşlemelerini değiştirin
- pgAdmin bağlanamıyor
  - db servisinin sağlıklı olduğundan emin olun; healthcheck çıkışlarını kontrol edin

### Admin Şifre Sıfırlama

**Yöntem 1: Node.js Script (Önerilen)**

Backend container'ı içinde çalıştırın:

```bash
# Backend container'ına girin
docker compose exec backend sh

# Script'i çalıştırın (email ve yeni şifre ile)
node scripts/reset-admin-password.js admin@example.com YeniSifre123!

# Container'dan çıkın
exit
```

**Yöntem 2: Veritabanına Direkt Erişim**

```bash
# PostgreSQL container'ına girin
docker compose exec db psql -U postgres -d firmaziyaret

# Veritabanında admin kullanıcısını kontrol edin
SELECT id, email, role FROM users WHERE role = 'ADMIN';

# Şifre hash'ini güncellemek için backend container'ında bcrypt hash oluşturun:
docker compose exec backend node -e "const bcrypt=require('bcrypt'); bcrypt.hash('YeniSifre123!', 10).then(h=>console.log(h))"

# Çıkan hash'i kullanarak UPDATE yapın (psql içinde):
UPDATE users 
SET password_hash = '$2b$10$OLUSTURULAN_HASH_BURAYA', updated_at = NOW()
WHERE email = 'admin@example.com';

# Çıkış
\q
```

**Not:** Yeni şifre en az 8 karakter olmalı ve büyük harf, küçük harf, sayı ve özel karakter içermelidir.

### Üretim Notları (ileri aşama)
- Nginx reverse proxy ile rontend ve ackend tek host üzerinden sunulur
- HTTPS sertifikaları (Let's Encrypt) ve güvenlik başlıkları
- İzleme: Prometheus/Grafana (opsiyonel), merkezi log
