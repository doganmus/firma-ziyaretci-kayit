## [0.1.1] - 2025-10-21
### Security & Ops
- Switched auth to HttpOnly cookie; removed Authorization header usage on frontend.
- Removed JWT 'dev-secret' fallback; centralized config via ConfigModule.
- Hardened file uploads: magic-bytes validation + PNG re-encode with sharp.
- CORS dev-only via `ALLOWED_ORIGINS`; disabled in production.
- `/metrics` protected in production; Prometheus still accessible internally.
- Migrations fail-fast (container startup stops on error).
- Admin safety rails: prevent last ADMIN demotion/deletion.
- Added `UpdateSettingsDto` validation.
- Throttled export endpoints.
- Added CSP (report-only) to Nginx.
## v0.5.0 - Dashboard ve Araç Kayıtları İyileştirmeleri

Öne çıkanlar:
- Yeni Dashboard: login sonrası varsayılan sayfa; KPI kartları, günlük trend (ziyaret/araç), araç türü dağılımı, en çok ziyaret alan 5 firma.
- Araç Kayıtları: İlçe, araç türü ve not alanları; giriş/çıkış akışları; filtreler ve listeleme.
- UI: Menü ve sayfa başlıkları düzenlendi; seçili menü vurgusu düzeltildi; ziyaret listesinde araç yoksa “YAYA” gösterimi.
- E2E: Dashboard ve rapor akışları stabilize edildi (7/7 yeşil).

Backend:
- /reports/dashboard/overview (Dashboard verileri)
- (Opsiyonel) /reports/by-day, /reports/vehicle-summary
- VehicleLogs modülü ve migration’lar

Dokümanlar:
- API_SPEC.md, ARCHITECTURE.md, ROADMAP.md, FRONTEND_UX_PLAN.md güncellendi


