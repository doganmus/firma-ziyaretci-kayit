## Kanban ve Backlog

Bu dosya günlük/haftalık çalışmayı izlemek için kullanılır. Aşamalar ROADMAP.md ile uyumludur.

### In Progress


### Done
- [x] Aşama 1 tüm başlıklar
- [x] Aşama 2: Visits filtreleri, rapor uçları, Raporlar sayfası, CSV/Excel export
- [x] Aşama 3: Admin CRUD backend + Admin sayfası (RBAC)
- [x] Frontend Modernizasyon Phase A: AntD entegrasyon + Layout/Theme
- [x] Frontend Modernizasyon Phase B: Login ve Kayıt (VisitForm) AntD Form
- [x] Frontend Modernizasyon Phase C: Kayıtlar (VisitList) AntD Table + filtreler
- [x] Dark Mode toggle (kalıcılık)
- [x] Navbar: "Kayıt" solda, "Kayıtlar" sağında; varsayılan rota /  Kayıt, Kayıtlar /list
- [x] Reports: CSV indirme (geçici), PDF sonraki aşamaya taşındı
- [x] Ziyaret Formu: içerideki (çıkışsız) kayıtlar listesi + tek tıkla çıkış
- [x] Plaka gösterimi: Araç yoksa UI'da boş ("PASİF" kaldırıldı)
- [x] TR plaka regex sıkılaştırma ve isim/şirket uppercase normalize
- [x] VIEWER rolü için GET /visits izni; exit/create gizleme (UI)
- [x] Login sayfası: başlık ve tam sayfa tema
- [x] Raporlar: "İçeride"/"Çıkış Yapan" metinleri
- [x] Admin: Marka Ayarları (firma adı veya PNG logo), /uploads kalıcı
- [x] Global navigasyon: Sol daralabilir Sider (hamburger) ve Admin alt menüleri
- [x] Aşama 4: Prod hazırlığı (PDF export, güvenlik başlıkları)
- [x] Frontend modernizasyon: Polishing & A11y

### Backlog (Aşama 4)
- [x] Nginx reverse proxy + prod dockerizasyon
- [x] Güvenlik sertifikaları (HTTPS)
- [x] (Opsiyonel) Monitoring/metrics

### Backlog (Aşama 5 - Opsiyonel)
- [ ] LDAP/SSO
- [ ] Audit log
- [ ] i18n
- [ ] E2E testler
- [ ] Otomatik yedek/geri yükleme scriptleri
