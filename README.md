## Firma Ziyaretçi Giriş Kayıt Sistemi

Ziyaretçi giriş-çıkışlarının kayıt altına alındığı, raporlanabildiği ve kullanıcı/rol yönetimi olan bir web uygulaması. PostgreSQL, NestJS ve React üzerine kuruludur ve Docker Compose ile containerize edilir.

### Özellikler
- **Giriş/Çıkış Kaydı**: Tarih, ziyaretçi adı soyadı, şirketi, ziyaret edilen kişi, giriş/çıkış saati
- **Araç Bilgisi**: Araç var/yok, plaka; araç yoksa plaka devre dışı ve veritabanında NULL
- **Kimlik Doğrulama**: JWT tabanlı login ve RBAC
- **Raporlar**: Tarih aralığı ve filtrelerle temel raporlar, CSV indirme (geçici), ileride PDF
- **Kayıtlar Export**: Ziyaret listesi için Excel (.xls) indirme
- **Tema**: Dark/Light mode toggle (kalıcı tercih)

### Teknolojiler
- **Backend**: NestJS (TypeScript), TypeORM, PostgreSQL, JWT, class-validator
- **Frontend**: React (TypeScript), Vite, Ant Design, React Router, Axios
- **Altyapı**: Docker + Docker Compose, pgAdmin, Nginx (frontend serve)

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

### 3) Erişim
- Kayıt (varsayılan): http://localhost:5173/
- Kayıtlar: http://localhost:5173/list
- Raporlar: http://localhost:5173/reports
- Backend API: http://localhost:3000
- pgAdmin: http://localhost:5050

> Admin/Operator seed ve login örnekleri için OPERATIONS.md dosyasına bakın.

## Belgeler
- Yol haritası: ROADMAP.md
- Görev listeleri/kanban: TASKS.md
- Mimari: ARCHITECTURE.md
- API sözleşmesi: API_SPEC.md
- Operasyonlar ve komutlar: OPERATIONS.md

## Notlar
- TR plaka doğrulaması katmanlıdır (DTO + Service + DB CHECK) ve boşluklar kaldırıldıktan sonra büyük harfle kontrol edilir.
- UI'da araç yoksa plaka alanı boş gösterilir; "PASİF" metni kullanılmaz.
