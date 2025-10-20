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


