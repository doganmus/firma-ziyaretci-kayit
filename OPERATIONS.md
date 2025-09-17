## Operasyonlar ve Komutlar

### Docker Komutları
- İlk kurulum ve çalıştırma
```powershell
# Windows (Docker Desktop): docker CLI PATH'te değilse tam yolu kullanın
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose up -d --build
```
- Loglar
```powershell
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose logs -f backend
```
- Durdurma ve silme
```powershell
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose down
```

### Ortam Değişkenleri (.env)
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: PostgreSQL ayarları
- `PGADMIN_EMAIL`, `PGADMIN_PASSWORD`: pgAdmin giriş bilgileri
- `JWT_SECRET`: Backend için JWT imzalama anahtarı

### Veritabanı
- Bağlantı: `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}`
- Yedekleme (container içinden)
```powershell
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose exec db pg_dump -U ${env:POSTGRES_USER} ${env:POSTGRES_DB} | Out-File -FilePath backup.sql -Encoding ascii
```
- Geri yükleme
```powershell
Get-Content backup.sql | & "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose exec -T db psql -U ${env:POSTGRES_USER} ${env:POSTGRES_DB}
```

### Seed ve Test (Aşama 1)
- Admin kullanıcı seed
```powershell
$body = @{ email = 'admin@example.com'; password = 'admin123'; full_name = 'Admin'; role = 'ADMIN' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/admin/users' -ContentType 'application/json' -Body $body
```
- Operator kullanıcı seed
```powershell
$login = @{ email = 'admin@example.com'; password = 'admin123' } | ConvertTo-Json
$tok = (Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/auth/login' -ContentType 'application/json' -Body $login).accessToken
$headers = @{ Authorization = "Bearer $tok" }
$op = @{ email = 'operator@example.com'; password = 'operator123'; full_name = 'Operator'; role = 'OPERATOR' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/admin/users' -Headers $headers -ContentType 'application/json' -Body $op
```
- Login testi
```powershell
$login = @{ email = 'operator@example.com'; password = 'operator123' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/auth/login' -ContentType 'application/json' -Body $login
```

### Sorun Giderme
- Backend API açılmıyor
  - log: `compose logs -f backend`
  - `.env` değerlerini doğrulayın
- Frontend 5173 portu dolu
  - compose port eşlemelerini değiştirin
- pgAdmin bağlanamıyor
  - `db` servisinin sağlıklı olduğundan emin olun; healthcheck çıkışlarını kontrol edin

### Üretim Notları (ileri aşama)
- Nginx reverse proxy ile `frontend` ve `backend` tek host üzerinden sunulur
- HTTPS sertifikaları (Let's Encrypt) ve güvenlik başlıkları
- İzleme: Prometheus/Grafana (opsiyonel), merkezi log
