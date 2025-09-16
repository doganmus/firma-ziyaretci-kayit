## Operasyonlar ve Komutlar

### Docker Komutları
- İlk kurulum ve çalıştırma
```bash
docker compose up -d --build
```
- Loglar
```bash
docker compose logs -f backend
```
- Durdurma ve silme
```bash
docker compose down
```

### Ortam Değişkenleri (.env)
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: PostgreSQL ayarları
- `PGADMIN_EMAIL`, `PGADMIN_PASSWORD`: pgAdmin giriş bilgileri
- `JWT_SECRET`: Backend için JWT imzalama anahtarı

### Veritabanı
- Bağlantı: `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}`
- Yedekleme (container içinden)
```bash
docker compose exec db pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > backup.sql
```
- Geri yükleme
```bash
docker compose exec -T db psql -U ${POSTGRES_USER} ${POSTGRES_DB} < backup.sql
```

### Migration ve Seed (backend hazır olduğunda)
- Migration çalıştırma (örnek)
```bash
docker compose exec backend npm run typeorm migration:run | cat
```
- Seed kullanıcı (örnek — ayrıntı `API_SPEC.md` ve ilerideki scriptlerde)
  - Admin oluştur: `POST /admin/users` (ilk kullanıcı için geçici açık uç veya seed script)

### Sorun Giderme
- Backend API açılmıyor
  - `docker compose logs -f backend`
  - `.env` değerlerini doğrulayın
- Frontend 5173 portu dolu
  - `.env` veya compose port eşlemelerini değiştirin
- pgAdmin bağlanamıyor
  - `db` servisinin sağlıklı olduğundan emin olun; healthcheck çıkışlarını kontrol edin

### Üretim Notları (ileri aşama)
- Nginx reverse proxy ile `frontend` ve `backend` tek host üzerinden sunulur
- HTTPS sertifikaları (Let's Encrypt) ve güvenlik başlıkları
- İzleme: Prometheus/Grafana (opsiyonel), merkezi log
