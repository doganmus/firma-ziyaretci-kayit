## Aşamalı Plan (Roadmap)

Her aşama sonunda proje Docker Compose ile çalışır. Temel özellikler Aşama 1'de tamamlanır; sonraki aşamalarda fonksiyonellik genişletilir ve üretim kalitesi artırılır.

### Aşama 1 - MVP (Temel Çalışan Sistem)
- Kabul Kriterleri
  - docker compose up -d --build ile db, backend, frontend ve pgAdmin konteynerları ayağa kalkar
  - Admin kullanıcı ile giriş yapılır (seed veya admin oluşturma endpointi)
  - Ziyaret oluşturma (araçlı/araçsız), listeleme ve çıkış verme çalışır
  - Araç yoksa plaka veritabanında NULL olur; UI'da boş görünür
- Teslimatlar
  - [x] Docker Compose iskeleti (PostgreSQL, pgAdmin, backend, frontend)
  - [x] Backend: NestJS iskeleti (health endpoint)
  - [x] Backend: TypeORM konfigürasyonu, users ve isits entity'leri
  - [x] Auth: POST /auth/login (JWT)
  - [x] Visits: POST /visits, GET /visits, POST /visits/:id/exit
  - [x] Frontend: Login, Kayıt (VisitForm), Kayıtlar (VisitList)
  - [x] RBAC (backend): JwtAuthGuard + RolesGuard
  - [x] Swagger /docs
  - [x] Araç/plaka kuralı (DB CHECK + DTO + TR formatı)
  - [x] RBAC (frontend): role-based görünürlük

### Aşama 2 - Filtreler ve Temel Raporlar
- Kabul Kriterleri
  - Ziyaret listesinde tarih aralığı, firma, araç var/yok, plaka, ziyaret edilen filtreleri 
  - Raporlar: GET /reports/summary ve GET /reports/by-company 
  - CSV/Excel export 
- Teslimatlar
  - [x] Backend filtreli sorgular ve rapor endpointleri
  - [x] Frontend filtre alanları ve Raporlar sayfası
  - [x] CSV/Excel export (frontend)
- Notlar
  - [x] Rapor indirme uç noktası geçici olarak CSV döndürür (PDF sonraki aşamaya taşındı)

### Aşama 3 - Admin Modülü
- Kabul Kriterleri
  - Admin kullanıcılar için CRUD ve rol atama 
  - Sadece ADMIN erişebiliyor 
- Teslimatlar
  - [x] Backend: /admin/users CRUD
  - [x] Frontend: Admin sayfası (kullanıcı listesi/ekle/düzenle/sil)

### Aşama 4 - Üretim Hazırlığı ve Gelişmiş UX
- Kabul Kriterleri
  - Nginx reverse proxy ile backend'e proxy ve CORS gereksinimi kalkar
  - HTTPS (geliştirme için self-signed, üretimde gerçek sertifika)
  - Loglama, hata takibi ve basit rate limiting
  - Rapor CSV export (geçici) , PDF export (sonraki sprint)
  - Dark Mode toggle ile tema değiştirme  (kalıcılık ile)
  - UI/UX modernizasyon: Ant Design ile sayfaların yenilenmesi 
- Teslimatlar
  - [x] Nginx konfigürasyonu (frontend + api proxy)
  - [ ] PDF export (sunucu tarafı)  beklemede
  - [x] Dark Mode (global tema sağlayıcı + kalıcı tercih)
  - [x] Frontend Modernizasyon (Ant Design):
    - Phase A: Layout + Tema (tamamlandı)
    - Phase B: Login + Kayıt (tamamlandı)
    - Phase C: Kayıtlar (tamamlandı)
    - Phase D: Admin (tamamlandı)
    - Phase E: Polishing & A11y (devam)
- Ek Notlar
  - Varsayılan rota: /  Kayıt; Kayıtlar: /list. VIEWER role / isterse /list'e yönlendirilir.
  - Navbar: "Kayıt" solda, "Kayıtlar" sağında.
  - Ziyaret Formu altında içerideki (çıkış yapmamış) kayıtlar listelenir ve tek tıkla çıkış yapılır.
  - UI'da plaka alanı araç yoksa boş, araç varsa TR regex ile doğrulama.

### Aşama 5 - Opsiyonel Gelişmiş Özellikler
- Öneriler
  - [ ] LDAP/SSO entegrasyonu
  - [ ] Denetim izi (audit log)
  - [ ] Çoklu dil desteği (i18n)
  - [ ] E2E testler (Playwright/Cypress)
  - [ ] Yedekleme/geri yükleme scriptleri ve otomasyon

## Teknik Notlar
- TR plaka regex (boşluklar kaldırılıp büyük harfe çevrildikten sonra):
  - ^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$
- Araç yoksa ehicle_plate = NULL (UI: boş gösterim; "PASİF" metni kullanılmaz)
- İsim/şirket alanları backend ve frontend'de büyük harfe normalize edilir
