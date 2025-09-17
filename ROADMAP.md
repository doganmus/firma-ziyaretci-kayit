## Aşamalı Plan (Roadmap)

Her aşama sonunda proje Docker Compose ile çalışır. Temel özellikler Aşama 1'de tamamlanır; sonraki aşamalarda fonksiyonellik genişletilir ve üretim kalitesi artırılır.

### Aşama 1 - MVP (Temel Çalışan Sistem)
- Kabul Kriterleri
  - `docker compose up -d --build` ile db, backend, frontend ve pgAdmin konteynerları ayağa kalkar
  - Admin kullanıcı ile giriş yapılır (seed veya admin oluşturma endpointi)
  - Ziyaret oluşturma (araçlı/araçsız), listeleme ve çıkış verme çalışır
  - Araç yoksa plaka veritabanında `NULL` olur; formda pasif görünür
- Teslimatlar
  - [x] Docker Compose iskeleti (PostgreSQL, pgAdmin, backend, frontend)
  - [x] Backend: NestJS iskeleti (health endpoint)
  - [x] Backend: TypeORM konfigürasyonu, `users` ve `visits` entity'leri
  - [x] Auth: `POST /auth/login` (JWT)
  - [x] Visits: `POST /visits`, `GET /visits`, `POST /visits/:id/exit`
  - [x] Frontend: Login, Ziyaret Formu, Ziyaret Listesi (basit)
  - [x] RBAC (backend): JwtAuthGuard + RolesGuard
  - [x] Swagger `/docs`
  - [x] Araç/plaka kuralı (DB CHECK + DTO + TR formatı)
  - [x] RBAC (frontend): role-based görünürlük

### Aşama 2 - Filtreler ve Temel Raporlar
- Kabul Kriterleri
  - Ziyaret listesinde tarih aralığı, firma, araç var/yok, plaka filtreleri
  - Raporlar: `GET /reports/summary` ve `GET /reports/by-company`
  - CSV export ile ziyaret listesini indirme
- Teslimatlar
  - Backend filtreli sorgular ve rapor endpointleri
  - Frontend filtre alanları ve rapor ekranı
  - CSV export (frontend)
- Görevler
  - [ ] Visits: filtre parametreleri için backend sorguları
  - [ ] Reports: summary ve by-company endpointleri
  - [ ] Frontend: Raporlar sayfası + grafik/tablo
  - [ ] Frontend: CSV export
  - [ ] (Opsiyonel) Sunucu taraflı CSV export endpointi

### Aşama 3 - Admin Modülü
- Kabul Kriterleri
  - Admin kullanıcılar için CRUD ve rol atama
  - Sadece `ADMIN` erişebiliyor
- Teslimatlar
  - Backend: `/admin/users` CRUD
  - Frontend: Admin sayfası (kullanıcı listesi/ekle/düzenle/sil)
- Görevler
  - [ ] Users service + controller
  - [ ] RBAC guard'ları ve policy'ler
  - [ ] Frontend Admin ekranları

### Aşama 4 - Üretim Hazırlığı ve Gelişmiş UX
- Kabul Kriterleri
  - Nginx reverse proxy ile backend'e proxy ve CORS gereksinimi kalkar
  - HTTPS (geliştirme için self-signed, üretimde gerçek sertifika)
  - Loglama, hata takibi ve basit rate limiting
  - PDF export çalışır
- Teslimatlar
  - Nginx konfigürasyonu (frontend + api proxy)
  - PDF export (sunucu veya istemci tarafı)
  - Temel observability (isteğe bağlı: pino, prometheus/grafana)
- Görevler
  - [ ] Nginx reverse proxy ve prod dockerfile'lar
  - [ ] Rate limiting ve güvenlik başlıkları (helmet)
  - [ ] PDF export
  - [ ] (Opsiyonel) Monitoring/metrikler

### Aşama 5 - Opsiyonel Gelişmiş Özellikler
- Öneriler
  - [ ] LDAP/SSO entegrasyonu
  - [ ] Denetim izi (audit log)
  - [ ] Çoklu dil desteği (i18n)
  - [ ] E2E testler (Playwright/Cypress)
  - [ ] Yedekleme/geri yükleme scriptleri ve otomasyon

## Sürümleme
- Aşama 1: v0.1.0
- Aşama 2: v0.2.0
- Aşama 3: v0.3.0
- Aşama 4: v0.4.0
- Aşama 5: v0.5.0 (opsiyonel ekler)
