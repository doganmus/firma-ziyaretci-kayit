## API Sözleşmesi

Tüm endpointler JSON döner. Kimlik doğrulama gerektiren uçlarda Authorization: Bearer <token> başlığı zorunludur. Swagger: /docs.

RBAC: visits ADMIN|OPERATOR (GET aynı zamanda VIEWER), admin/users ADMIN, reports ADMIN|OPERATOR|VIEWER.

Plaka kuralı: TR formatı  ^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$ (boşluklar kaldırılır, büyük harfe çevrilir). Araç yoksa vehicle_plate = null gönderilmeli/gönderilir.

Not: Frontend prod ortamda Nginx üzerinden /api yolunu backend'e proxy'ler.

### Kimlik Doğrulama
- POST /auth/login
  - Body
    `json
    { "email": "admin@example.com", "password": "secret" }
    `
  - 200
    `json
    {
      "accessToken": "<jwt>",
      "user": { "id": "uuid", "email": "admin@example.com", "full_name": "Admin", "role": "ADMIN" }
    }
    `
  - 401: Geçersiz kimlik bilgileri

### Ziyaretler (JWT + RBAC)
- GET /visits
  - Sorgu: dateFrom,dateTo,company,hasVehicle,plate,visitedPerson
  - 200 örnek
    `json
    [
      {
        "id": "uuid",
        "visitor_full_name": "DOĞAN MUŞ",
        "visited_person_full_name": "ALİ VELİ",
        "company_name": "BİTECH",
        "entry_at": "2025-09-20T08:30:00.000Z",
        "exit_at": null,
        "has_vehicle": false,
        "vehicle_plate": null
      }
    ]
    `
- POST /visits
  - Body
    `json
    {
      "entry_at": "2025-01-01T08:30:00.000Z",
      "visitor_full_name": "AD SOYAD",
      "visited_person_full_name": "ZİYARET EDİLEN",
      "company_name": "ŞİRKET A",
      "has_vehicle": true,
      "vehicle_plate": "34ABC1234"
    }
    `
  - 201: Oluşturulan ziyaret kaydı
- POST /visits/:id/exit
  - Body: boş; sunucu exit_at = now() atar

### Raporlar (JWT)
- GET /reports/summary?dateFrom&dateTo
  - Ör: { "total": 120, "withVehicle": 70, "withoutVehicle": 50, "active": 12, "exited": 108 }
- GET /reports/by-company?dateFrom&dateTo
  - Ör: [ { "company": "Şirket A", "count": 30 } ]

- GET /reports/export/excel?dateFrom&dateTo
  - Yanıt: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (xlsx)
  - İçerik: "Özet" sayfasında temel metrikler, "Firma Bazlı" sayfasında şirket/adet

- GET /reports/export/pdf?dateFrom&dateTo
  - Yanıt: application/pdf (PDF)
  - İçerik: Özet metrikleri (mini grafik) ve firma bazlı tablo

### Admin (JWT + ADMIN)
- GET /admin/users  kullanıcı listesi
- POST /admin/users  kullanıcı oluştur
  - Body
    `json
    { "email": "op@example.com", "password": "secret", "full_name": "OPERATÖR", "role": "OPERATOR" }
    `
- PATCH /admin/users/:id  full_name?, password?, role?
- DELETE /admin/users/:id  kullanıcı sil

### Ayarlar (Admin)
- GET /admin/settings → { brandName: string|null, brandLogoUrl: string|null }
- PATCH /admin/settings (ADMIN)
  - Body: { brandName?: string|null, brandLogoUrl?: string|null }
  - Not: brandName varsa brandLogoUrl null olmalıdır ve tersi
- POST /admin/settings/logo (ADMIN)
  - Form-Data: file: PNG (<=2MB)
  - 200: { url: "/uploads/logo-...png" }

### Hata Formatı
`json
{ "statusCode": 400, "message": "Validation failed", "error": "Bad Request" }
`

### Notlar
- Ziyaret kuralı: has_vehicle = false ise vehicle_plate gönderilmemeli; gönderilirse yoksayılır veya reddedilebilir
- Tarihler ISO 8601 formatında UTC olarak gönderilmelidir
