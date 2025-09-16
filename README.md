## Firma Ziyaretçi Giriş Kayıt Sistemi

Ziyaretçi giriş-çıkışlarının kayıt altına alındığı, raporlanabildiği ve kullanıcı/rol yönetimi olan bir web uygulaması. PostgreSQL, NestJS ve React üzerine kuruludur ve Docker Compose ile containerize edilir.

### Özellikler
- **Giriş/Çıkış Kaydı**: Tarih, ziyaretçi adı soyadı, şirketi, ziyaret edilen kişi, giriş/çıkış saati
- **Araç Bilgisi**: Araç var/yok, plaka; araç yoksa plaka devre dışı ve veritabanında `NULL`
- **Kimlik Doğrulama**: JWT tabanlı login
- **Raporlar**: Tarih aralığı ve filtrelerle temel raporlar, CSV/PDF (aşamalı)
- **Yönetim (Admin)**: Kullanıcı ve rol yönetimi

### Teknolojiler
- **Backend**: NestJS (TypeScript), TypeORM, PostgreSQL, JWT, class-validator
- **Frontend**: React (TypeScript), Vite, Ant Design, React Router, React Query, Axios
- **Altyapı**: Docker + Docker Compose, pgAdmin, Nginx (frontend serve)
- **Kalite**: Jest, ESLint/Prettier, Husky (opsiyonel)

## Hızlı Başlangıç (Docker)

### Önkoşullar
- Docker Desktop

### 1) Ortam değişkenleri
Proje kökünde bir `.env` dosyası oluşturun:

```bash
POSTGRES_DB=firmaziyaret
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=admin
JWT_SECRET=super-secret-change-me
```

### 2) Çalıştırma (Windows notu)
```powershell
# docker CLI PATH'te yoksa tam yol ile çalıştırın
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose up -d --build
```

### 3) Erişim
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- pgAdmin: `http://localhost:5050`

> Admin seed ve login örnekleri için `OPERATIONS.md` dosyasına bakın.

## Proje Yapısı (taslak)
```
FIRMAZIYRETCIGIRISKAYITSISTEMI/
  docker-compose.yml
  .env
  backend/
  frontend/
  README.md
  ROADMAP.md
  TASKS.md
  ARCHITECTURE.md
  API_SPEC.md
  OPERATIONS.md
```

## Belgeler
- Yol haritası: `ROADMAP.md`
- Görev listeleri/kanban: `TASKS.md`
- Mimari: `ARCHITECTURE.md`
- API sözleşmesi: `API_SPEC.md`
- Operasyonlar ve komutlar: `OPERATIONS.md`

## Yol Haritası
Aşamalar ve kabul kriterleri için `ROADMAP.md` dosyasını takip edin. Her aşamada proje Docker ile çalışır durumda olacak şekilde planlanmıştır.
