/**
 * MongoDB bağlantı testi. Çalıştırma: node scripts/test-mongo.js
 * .env.local'den MONGODB_URI okur.
 */
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*MONGODB_URI=(.+)$/);
    if (m) process.env.MONGODB_URI = m[1].replace(/^["']|["']$/g, '').trim();
  });
}

const uri = process.env.MONGODB_URI;
const mongoose = require('mongoose');

async function test() {
  if (!uri) {
    console.log('❌ MONGODB_URI .env.local içinde tanımlı değil.');
    process.exit(1);
  }
  // Güvenlik: şifreyi loglamıyoruz, sadece host var mı kontrol
  const hasPlaceholder = uri.includes('xxxxx');
  if (hasPlaceholder) {
    console.log('❌ MONGODB_URI içinde cluster0.xxxxx.mongodb.net hâlâ var.');
    console.log('   Atlas > Connect > Drivers\'dan gerçek cluster adresinizi kopyalayıp .env.local\'de güncelleyin.');
    process.exit(1);
  }
  console.log('🔄 MongoDB\'ye bağlanılıyor...');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Bağlantı başarılı.');
    const name = mongoose.connection.db?.databaseName || '?';
    console.log('   Veritabanı:', name);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.log('❌ Bağlantı hatası:', err.message);
    if (err.message.includes('authentication')) {
      console.log('   Kullanıcı adı/şifre kontrol edin (Atlas > Database Access).');
    }
    if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
      console.log('   Cluster adresi yanlış; Atlas\'taki connection string\'i kullanın.');
    }
    process.exit(1);
  }
}

test();
