## Frontend Modernization Plan (Ant Design + UX)

### Goals
- Consistent, modern UI with Ant Design
- Better validation, feedback, and accessibility
- Maintain Dark Mode and responsive layout

### Phase A — Foundation (Layout + Theme)
- Add Ant Design and icons
- Global layout shell: header menu, content container, theme toggle
- Wrap app with `ConfigProvider` (light/dark algorithm)
- Acceptance:
  - All existing pages render inside new layout
  - Theme toggle affects AntD components
 - Status: Completed

### Phase B — Forms (Login + Ziyaret Form)
- Convert Login and Ziyaret Form to AntD `Form`, `Input`, `Switch`, `DatePicker`
- Client-side validation with AntD rules
- Acceptance:
  - Required alanlar net uyarılar gösterir; loading state butonları kilitler
 - Status: Completed

### Phase C — Lists (Ziyaretler + Raporlar/Dashboard)
- Convert Ziyaret Listesi to AntD `Table` (pagination, sorting)
- Raporlar Dashboard'a dönüştürüldü: KPI kartları, günlük trend, araç türü dağılımı, top 5 firma
- Filtre: tarih aralığı tüm widget'ları etkiler; PDF/Excel export raporlar bölümünde korunur
- Acceptance:
  - Tablo sayfalama ve sıralama çalışır; filtreler tutarlı
- Status: Completed (Dashboard deployed, menu default)

### Phase D — Admin
- Admin kullanıcı ekranı: AntD `Table` + inline actions; kullanıcı ekleme `Modal`
- Acceptance:
  - E-posta/rol/şifre akışları tek ekranda, tutarlı uyarılarla çalışır
 - Status: Completed

### Phase E — Polish & A11y
- Empty states, skeletons, toasts, focus states; basic a11y
- Acceptance:
  - Lighthouse/Axe temel kontrolleri geçer; görünür geri bildirimler
 - Status: In Progress

### Notes
- Dark Mode CSS değişkenleri korunur; AntD `ConfigProvider` ile uyumlu tema
- Kademeli dönüşüm: Her faz commit/push ve Docker rebuild
