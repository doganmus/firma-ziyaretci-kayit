## Mimari Genel Bakış

Uygulama iki ana bileşenden oluşur: NestJS tabanlı REST API (backend) ve React tabanlı SPA (frontend). PostgreSQL veritabanı ve yönetim için pgAdmin kullanılır. Tüm bileşenler Docker Compose ile orkestre edilir.

### Modüller (Backend)
- **auth**: JWT ile kimlik doğrulama, login
- **users**: kullanıcı CRUD, rol yönetimi (`ADMIN`, `OPERATOR`, `VIEWER`)
- **visits**: ziyaret kayıtları CRUD ve iş kuralları
- **reports**: özet ve firma bazlı raporlar
- **admin**: admin paneline özel yönetim uçları (users)
- **common**: guard/pipe/interceptor, hata işleme, config

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

### Frontend Mimarisi
- Sayfalar: Login, Ziyaret Formu, Ziyaret Listesi, Raporlar, Admin
- Router: React Router
- Veri: React Query + Axios; global auth context
- UI: Ant Design, form validasyonunda Yup opsiyonel

### Docker Topolojisi
- Servisler: `db(PostgreSQL)`, `pgadmin`, `backend`, `frontend`
- Dahili network ile iletişim; `backend` → `db` bağlantısı `postgres://...@db:5432/...`
- `frontend` Nginx ile statik servis; API çağrıları `http://backend:3000` (prod proxy) veya `http://localhost:3000` (dev)

### Gözlemlenebilirlik ve Loglama (opsiyonel)
- API logları (pino/winston), istek-id korelasyonu
- Sağlık uçları: `/health` (ileride)
- Metrikler: Prometheus/Grafana entegrasyonu (ileride)

### Uluslararasılaştırma (opsiyonel)
- i18n planı: TR/EN dil dosyaları, UI dil seçimi
