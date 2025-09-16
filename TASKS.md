## Kanban ve Backlog

Bu dosya günlük/haftalık çalışmayı izlemek için kullanılır. Aşamalar `ROADMAP.md` ile uyumludur.

### In Progress
- (boş)

### Done
- [x] README.md oluşturuldu
- [x] ROADMAP.md oluşturuldu
- [x] TASKS.md oluşturuldu
- [x] ARCHITECTURE.md oluşturuldu
- [x] API_SPEC.md oluşturuldu
- [x] OPERATIONS.md oluşturuldu

### Backlog (Aşama 1)
- [ ] Docker Compose: db, pgAdmin, backend, frontend
- [ ] Backend: NestJS iskeleti ve TypeORM yapılandırması
- [ ] DB: `User` ve `Visit` entity'leri + migration
- [ ] Auth: JWT login ve rol kontrolü
- [ ] Visits: oluşturma, listeleme, çıkış verme endpointleri
- [ ] Frontend: Login sayfası
- [ ] Frontend: Ziyaret Formu (araç/plaka kuralı)
- [ ] Frontend: Ziyaret Listesi (basit tablo)
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
