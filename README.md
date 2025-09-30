## Firma Ziyaretçi Giriş Kayıt Sistemi

Ziyaretçi giriş-çıkışlarının kayıt altına alındığı, raporlanabildiği ve kullanıcı/rol yönetimi olan bir web uygulaması. PostgreSQL, NestJS ve React üzerine kuruludur ve Docker Compose ile containerize edilir.

### Özellikler
- **Giriş/Çıkış Kaydı**: Tarih, ziyaretçi adı soyadı, şirketi, ziyaret edilen kişi, giriş/çıkış saati
- **Araç Bilgisi**: Araç var/yok, plaka; araç yoksa plaka devre dışı ve veritabanında NULL
- **Kimlik Doğrulama**: JWT tabanlı login ve RBAC
- **Raporlar**: Tarih aralığı ve filtrelerle özet ve firma bazlı tablo; Excel/PDF dışa aktarma uçları
- **Kayıtlar Export**: Ziyaret listesi için Excel (.xls) indirme
- **Tema**: Dark/Light mode toggle (kalıcı tercih)
- **Marka Ayarları**: Admin panelinden firma adı veya PNG logo yükleme (tek tercih)
- **Kalıcılık**: Logo yüklemeleri Docker volume ile kalıcıdır (/uploads)

### Teknolojiler
- **Backend**: NestJS (TypeScript), TypeORM, PostgreSQL, JWT, class-validator
  - Prod notu: `synchronize=false`; migration kullanımı önerilir
- **Frontend**: React (TypeScript), Vite, Ant Design, React Router, Axios
- **Altyapı**: Docker + Docker Compose, pgAdmin, Nginx (frontend serve)
 - **Audit**: Global istek/yanıt meta verileri audit_logs tablosuna yazılır (kullanıcı, yol, durum kodu, süre)
 - **Monitoring**: Prometheus + Grafana (hazır datasource ve dashboard provisioning)
 - **Admin**: Kullanıcı İşlemleri, Marka Ayarları, Audit Log ekranı

## Hızlı Başlangıç (Docker)

### Önkoşullar
- Docker Desktop

### 1) Ortam değişkenleri
Proje kökünde bir .env dosyası oluşturun:

`ash
POSTGRES_DB=firmaziyaret
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=admin
JWT_SECRET=super-secret-change-me
`

### 2) Çalıştırma (Windows notu)
`powershell
# docker CLI PATH'te yoksa tam yol ile çalıştırın
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose up -d --build
`

### 2a) Çalıştırma (Linux/Unix)
`bash
cp .env.example .env
docker compose up -d --build
`

### 3) Erişim
- Kayıt (varsayılan): http://localhost:5173/
- Kayıtlar: http://localhost:5173/list
- Raporlar: http://localhost:5173/reports
- Backend API: http://localhost:3000
- Metrics: http://localhost:3000/metrics (Prometheus format)
- Yüklenen dosyalar: http://localhost:5173/uploads/... (Nginx backend'e proxy eder)
- pgAdmin: http://localhost:5050
 - Prometheus: http://localhost:9090
 - Grafana: http://localhost:3001 (admin/admin)

> Admin/Operator seed ve login örnekleri için OPERATIONS.md dosyasına bakın.

### Geliştirme (yalnız frontend)
- Sadece frontend geliştirmek için Vite dev sunucusunu kullanın. `/api` ve `/uploads` çağrıları otomatik olarak `http://localhost:3000` backend'ine proxy edilir.
```
cd frontend
npm install
npm run dev
```

## Belgeler
- Yol haritası: ROADMAP.md
- Görev listeleri/kanban: TASKS.md
- Mimari: ARCHITECTURE.md
- API sözleşmesi: API_SPEC.md
- Operasyonlar ve komutlar: OPERATIONS.md

## Notlar
- TR plaka doğrulaması katmanlıdır (DTO + Service + DB CHECK) ve boşluklar kaldırıldıktan sonra büyük harfle kontrol edilir.
- UI'da araç yoksa plaka alanı boş gösterilir; "PASİF" metni kullanılmaz.
- Ziyaretçi ve ziyaret edilen adları aynı olamaz (form doğrulaması).
- RBAC: VIEWER rolü ziyaretleri görüntüleyebilir (GET /visits), ancak oluşturamaz/çıkış veremez.
 - Navigasyon: Tüm sayfalar sol tarafta daralabilir Sider (hamburger) menü ile gezilir. Admin altında "Kullanıcı İşlemleri" ve "Marka Ayarları" alt menüleri bulunur. Tema ile uyumlu çalışır.

## Sorun Giderme
- docker compose env uyarıları (POSTGRES_* vb.)
  - Çözüm: `.env` oluşturun (bkz. `.env.example`) ve `docker compose up -d --build`.
- Temiz başlangıç (veri/volume sıfırlama)
  - `docker compose down -v && docker compose up -d`
