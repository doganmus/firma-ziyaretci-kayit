## Mimari Genel Bakış

Uygulama iki ana bileşenden oluşur: NestJS tabanlı REST API (backend) ve React tabanlı SPA (frontend). PostgreSQL veritabanı ve yönetim için pgAdmin kullanılır. Tüm bileşenler Docker Compose ile orkestre edilir.

### Modüller (Backend)
- **auth**: JWT ile kimlik doğrulama, login
- **users**: kullanıcı CRUD, rol yönetimi (`ADMIN`, `OPERATOR`, `VIEWER`)
- **visits**: ziyaret kayıtları CRUD ve iş kuralları
- **reports**: özet ve firma bazlı raporlar
- **admin**: admin paneline özel yönetim uçları (users)
- **common**: guard/pipe/interceptor, hata işleme, config
- **settings**: marka ayarları ve bakım modu (`maintenance_mode`)
- **ops**: sistem yönetimi uçları (status, maintenance enable/disable, audit cleanup, sertifika yükleme, nginx reload)

### Veri Modeli
- **users**
  - `id` (uuid, pk)
  - `email` (varchar 150, unique)
  - `password_hash` (varchar 255)
  - `full_name` (varchar 150)
  - `role` (enum: ADMIN | OPERATOR | VIEWER)
  - `created_at`, `updated_at` (timestamptz)
- **visits**
  - `id` (uuid, pk)
  - `date` (date) — görünüm için; `entry_at`'tan türetilebilir
  - `entry_at` (timestamptz) — giriş saati
  - `exit_at` (timestamptz, nullable) — çıkış saati
  - `visitor_full_name` (varchar 150)
  - `visited_person_full_name` (varchar 150)
  - `company_name` (varchar 150)
  - `has_vehicle` (boolean)
  - `vehicle_plate` (varchar 20, nullable)
  - Kısıt: `(has_vehicle = false AND vehicle_plate IS NULL) OR (has_vehicle = true AND vehicle_plate IS NOT NULL)`
  - Indeksler: `entry_at`, `vehicle_plate`

### Akışlar
- **Login**
  1. `POST /auth/login` (email, password)
  2. Başarılı ise JWT verilir; frontend local storage'da saklar
- **Ziyaret Oluşturma**
  1. Form validasyonu (araç var ise plaka zorunlu)
  2. `POST /visits` ile kayıt
  3. Liste ekranında görünür
- **Çıkış Verme**
  1. Liste veya detaydan "Çıkış Ver" ⇒ `POST /visits/:id/exit`

### Güvenlik
- Parolalar `bcrypt` ile hashlenir (min cost 10)
- JWT access token (kısa ömür), opsiyonel refresh token ileri aşama
- RBAC: route guard'ları ile rol denetimi
- Giriş doğrulama: `class-validator` ve global `ValidationPipe`
 - HTTP güvenliği: `helmet` varsayılan başlıkları etkin; Nginx üzerinden ek güvenlik başlıkları (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
 - Basit rate limiting: `@nestjs/throttler` (örn. 120 req/dakika)
 - Statik yüklemeler: `/uploads` dizininden servis edilir; Nginx `/uploads` proxy'si ile sunulur

### Frontend Mimarisi
- Sayfalar: Login, Ziyaret Formu, Ziyaret Listesi, Raporlar, Admin
- Router: React Router
- Veri: Axios tabanlı `api` istemcisi ve interceptor'lar (401 yakalama, token ekleme)
- UI: Ant Design; Form kuralları AntD üzerinden. Admin altında “Sistem Yönetimi” sayfası (bakım modu, audit temizliği, sertifika yükleme ve reload butonu).

### Docker Topolojisi
- Servisler: `db(PostgreSQL)`, `pgadmin`, `backend`, `frontend`
- Dahili network ile iletişim; `backend` → `db` bağlantısı `postgres://...@db:5432/...`
- `frontend` Nginx ile statik servis; API çağrıları prod'da Nginx `/api` → `http://backend:3000` proxy'si, geliştirmede Vite dev proxy `/api` ve `/uploads` yollarını `http://localhost:3000`'a yönlendirir.

### Gözlemlenebilirlik ve Loglama
- İstek logları: `RequestLoggerMiddleware` ile istek-id ve süre loglanır
- Sağlık uçları: `/health`
- Metrikler: `/metrics` (Prometheus), Grafana dashboardları sağlanır

### Uluslararasılaştırma (opsiyonel)
- i18n planı: TR/EN dil dosyaları, UI dil seçimi
