#!/usr/bin/env node
/**
 * Admin kullanıcısının şifresini sıfırlama script'i
 * 
 * Kullanım:
 *   node scripts/reset-admin-password.js <email> <new-password>
 * 
 * Örnek:
 *   node scripts/reset-admin-password.js admin@example.com Admin123!
 * 
 * NOT: Bu script backend container'ı içinde çalıştırılmalıdır
 * veya DATABASE_URL environment variable'ı set edilmelidir.
 */

const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function resetAdminPassword(email, newPassword) {
  if (!email || !newPassword) {
    console.error('Kullanım: node scripts/reset-admin-password.js <email> <new-password>');
    process.exit(1);
  }

  // Password strength kontrolü
  if (newPassword.length < 8) {
    console.error('HATA: Şifre en az 8 karakter olmalıdır');
    process.exit(1);
  }

  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword);

  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    console.error('HATA: Şifre en az bir büyük harf, bir küçük harf, bir sayı ve bir özel karakter içermelidir');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/firmaziyaret',
  });

  try {
    await client.connect();
    console.log('Veritabanına bağlandı...');

    // Kullanıcıyı kontrol et
    const userResult = await client.query('SELECT id, email, role FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      // Kullanıcı yoksa oluştur
      console.log(`Kullanıcı bulunamadı: ${email}. Yeni admin kullanıcısı oluşturuluyor...`);
      const passwordHash = await bcrypt.hash(newPassword, 10);
      const insertResult = await client.query(
        `INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
         RETURNING id, email, full_name, role`,
        [email, passwordHash, 'Admin', 'ADMIN']
      );
      console.log('✓ Yeni admin kullanıcısı oluşturuldu:');
      console.log(`  ID: ${insertResult.rows[0].id}`);
      console.log(`  Email: ${insertResult.rows[0].email}`);
      console.log(`  Role: ${insertResult.rows[0].role}`);
    } else {
      // Kullanıcı varsa şifresini güncelle
      const user = userResult.rows[0];
      console.log(`Kullanıcı bulundu: ${user.email} (${user.role})`);
      console.log('Şifre güncelleniyor...');
      
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
        [passwordHash, email]
      );
      console.log('✓ Şifre başarıyla güncellendi');
    }

    console.log('\nŞimdi bu bilgilerle giriş yapabilirsiniz:');
    console.log(`  Email: ${email}`);
    console.log(`  Şifre: ${newPassword}`);
  } catch (error) {
    console.error('HATA:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

const email = process.argv[2];
const password = process.argv[3];

resetAdminPassword(email, password).catch((error) => {
  console.error('Beklenmeyen hata:', error);
  process.exit(1);
});

