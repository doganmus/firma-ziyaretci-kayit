## Kanban ve Backlog

Bu dosya günlük/haftalık çalışmayı izlemek için kullanılır. Aşamalar `ROADMAP.md` ile uyumludur.

### In Progress
- [ ] a1: Docker Compose ile çalışma ve seed testleri

### Done
- [x] README.md oluşturuldu
- [x] ROADMAP.md oluşturuldu
- [x] TASKS.md oluşturuldu
- [x] ARCHITECTURE.md oluşturuldu
- [x] API_SPEC.md oluşturuldu
- [x] OPERATIONS.md oluşturuldu
- [x] Docker Compose: db, pgAdmin, backend, frontend
- [x] Backend: NestJS iskeleti ve health endpoint
- [x] Backend: TypeORM + User/Visit + auth + visits endpointleri
- [x] Frontend: Login sayfası
- [x] Frontend: Ziyaret Formu
- [x] Frontend: Ziyaret Listesi

### Backlog (Aşama 1)
- [ ] RBAC guard'ları ve roller (`ADMIN`, `OPERATOR`)
- [ ] Validasyon ve DB `CHECK` kuralı (araç/plaka)
- [ ] (Opsiyonel) Swagger UI

### Backlog (Aşama 2)
- [ ] Visits: filtreler (tarih, firma, araç, plaka, ziyaret edilen)
- [ ] Reports: summary ve by-company
- [ ] Frontend: Raporlar sayfası
- [ ] CSV export (frontend)
- [ ] (Opsiyonel) Sunucu taraflı CSV export

### Backlog (Aşama 3)
- [ ] Admin: kullanıcı CRUD backend
- [ ] Admin: kullanıcı yönetimi arayüzü

### Backlog (Aşama 4)
- [ ] Nginx reverse proxy + prod dockerizasyon
- [ ] Güvenlik sertifikaları (HTTPS)
- [ ] PDF export
- [ ] (Opsiyonel) Monitoring/metrics

### Backlog (Aşama 5 - Opsiyonel)
- [ ] LDAP/SSO
- [ ] Audit log
- [ ] i18n
- [ ] E2E testler
- [ ] Otomatik yedek/geri yükleme scriptleri
