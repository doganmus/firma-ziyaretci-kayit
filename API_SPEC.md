## API Sözleşmesi

Tüm endpointler JSON döner. Kimlik doğrulama gerektiren uçlarda `Authorization: Bearer <token>` başlığı zorunludur. Swagger: `/docs`.

RBAC: `visits` → `ADMIN|OPERATOR`, `admin/users` → `ADMIN`, `reports` → `ADMIN|OPERATOR|VIEWER`.

Plaka kuralı: TR formatı — `^(0[1-9]|[1-7][0-9]|80|81)[A-Z]{1,3}[0-9]{2,4}$` (boşluklar yok sayılır, büyük harfe çevrilir).

### Kimlik Doğrulama
- POST `/auth/login`
  - Body
    ```json
    { "email": "admin@example.com", "password": "secret" }
    ```
  - 200
    ```json
    {
      "accessToken": "<jwt>",
      "user": { "id": "uuid", "email": "admin@example.com", "full_name": "Admin", "role": "ADMIN" }
    }
    ```
  - 401: Geçersiz kimlik bilgileri

### Ziyaretler (JWT + RBAC)
- GET `/visits`
  - Sorgu: `dateFrom,dateTo,company,hasVehicle,plate,visitedPerson`
  - 200
    ```json
    { "items": [ { "id": "uuid", "visitor_full_name": "...", "company_name": "...", "entry_at": "2025-01-01T08:30:00Z", "exit_at": null, "has_vehicle": true, "vehicle_plate": "34ABC123" } ], "total": 1 }
    ```
- POST `/visits`
  - Body
    ```json
    {
      "entry_at": "2025-01-01T08:30:00.000Z",
      "visitor_full_name": "Ad Soyad",
      "visited_person_full_name": "Ziyaret Edilen",
      "company_name": "Şirket A",
      "has_vehicle": true,
      "vehicle_plate": "34ABC1234"
    }
    ```
  - 201: Oluşturulan ziyaret kaydı
- PATCH `/visits/:id`
  - Kısmi güncellemeler için
- POST `/visits/:id/exit`
  - Body: boş; sunucu `exit_at = now()` atar

### Raporlar (JWT)
- GET `/reports/summary?dateFrom&dateTo`
  - Ör: `{ "total": 120, "withVehicle": 70, "withoutVehicle": 50, "active": 12, "exited": 108 }`
- GET `/reports/by-company?dateFrom&dateTo`
  - Ör: `[ { "company": "Şirket A", "count": 30 } ]`

### Admin (JWT + ADMIN)
- GET `/admin/users` — kullanıcı listesi
- POST `/admin/users` — kullanıcı oluştur
  - Body
    ```json
    { "email": "op@example.com", "password": "secret", "full_name": "Operatör", "role": "OPERATOR" }
    ```
- PATCH `/admin/users/:id`
- DELETE `/admin/users/:id`

### Hata Formatı
```json
{ "statusCode": 400, "message": "Validation failed", "error": "Bad Request" }
```

### Notlar
- Ziyaret kuralı: `has_vehicle = false` ise `vehicle_plate` gönderilmemeli; gönderilirse reddedilebilir
- Tarihler ISO 8601 formatında UTC olarak gönderilmelidir
