-- Admin kullanıcısının şifresini sıfırlama script'i
-- Kullanım: psql -h localhost -U postgres -d firmaziyaret -f scripts/reset-admin-password.sql
-- Veya Docker içinden: docker compose exec db psql -U postgres -d firmaziyaret -f /path/to/reset-admin-password.sql

-- Önce mevcut admin kullanıcısını kontrol et
SELECT id, email, full_name, role FROM users WHERE role = 'ADMIN';

-- Eğer admin kullanıcısı yoksa, yeni bir tane oluştur
-- NOT: Şifre hash'i 'admin123' için bcrypt hash'i (10 rounds)
-- Gerçek kullanımda, backend'den bcrypt.hash('yeni-sifre', 10) ile hash oluşturmalısınız
INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'admin@example.com',
  '$2b$10$rOzJqZqZqZqZqZqZqZqZqOZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', -- Bu geçici bir hash, gerçek kullanımda backend'den alınmalı
  'Admin',
  'ADMIN',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

-- Admin kullanıcısının şifresini güncellemek için:
-- 1. Backend container'ına girin
-- 2. Node.js REPL'de bcrypt.hash() ile yeni hash oluşturun
-- 3. Aşağıdaki UPDATE komutunu kullanın

-- UPDATE users 
-- SET password_hash = '$2b$10$YENI_HASH_BURAYA', updated_at = NOW()
-- WHERE email = 'admin@example.com';

