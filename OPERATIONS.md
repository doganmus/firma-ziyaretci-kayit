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

### Reverse Proxy
- Frontend Nginx, /api yolunu otomatik olarak backend:3000 servisine proxy'ler.
- /uploads yolu backend'in statik dosya servisine (http://backend:3000/uploads) proxy edilir.
- Frontend kodu VITE_API_URL yoksa otomatik /api tabanını kullanır.

### Rotalar
- Varsayılan sayfa: /  Kayıt (VisitForm)
- Kayıtlar listesi: /list
- VIEWER rolü /'e giderse otomatik /list'e yönlendirilir.

### Navigasyon
- Sol daralabilir Sider (hamburger) menü: Kayıt, Kayıtlar, Rapor ve Admin altındaki alt menüler.
- Admin alt menüleri: Kullanıcı İşlemleri, Marka Ayarları.

### Rapor Dışa Aktarım ve Tema
- Rapor CSV indirme: Raporlar sayfasındaki CSV İndir butonu veya doğrudan /api/reports/export/pdf?dateFrom=...&dateTo=... (geçici olarak CSV döner)
- Ziyaretler listesi Excel: "Excel" butonu .xls (XML Spreadsheet) indirir
- Dark Mode: Navbar sağındaki seçim ile tema değiştir; tercih localStorage'da saklanır.

### Marka Ayarları ve Yüklemeler
- Admin → Marka Ayarları: Firma adı veya PNG logo yükleyin (tek tercih). Logo yüklenirse firma adı saklanmaz.
- Yüklenen logolar backend konteynerindeki /app/uploads altında saklanır ve Docker volume (uploads_data) ile kalıcıdır.
- Dosya URL'leri /uploads/... şeklinde yayınlanır; Nginx bunları backend'e proxy eder.

### Ortam Değişkenleri (.env)
- POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD: PostgreSQL ayarları
- PGADMIN_EMAIL, PGADMIN_PASSWORD: pgAdmin giriş bilgileri
- JWT_SECRET: Backend için JWT imzalama anahtarı

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
- Login testi
`powershell
 = @{ email = 'operator@example.com'; password = 'operator123' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/auth/login' -ContentType 'application/json' -Body 
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
- Frontend 5173 portu dolu
  - compose port eşlemelerini değiştirin
- pgAdmin bağlanamıyor
  - db servisinin sağlıklı olduğundan emin olun; healthcheck çıkışlarını kontrol edin

### Üretim Notları (ileri aşama)
- Nginx reverse proxy ile rontend ve ackend tek host üzerinden sunulur
- HTTPS sertifikaları (Let's Encrypt) ve güvenlik başlıkları
- İzleme: Prometheus/Grafana (opsiyonel), merkezi log
