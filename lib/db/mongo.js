/**
 * MongoDB bağlantısı (Next.js serverless uyumlu).
 * Vercel/serverless ortamında her istekte yeni connection açmamak için
 * global cache kullanır; development'ta hot reload'da tekrar bağlanır.
 */
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('MONGODB_URI tanımlı değil; arama kayıtları devre dışı.');
}

let cached = global.mongoDbCache;
if (!cached) {
  cached = global.mongoDbCache = { conn: null, promise: null };
}

async function connect() {
  if (!MONGODB_URI) return null;
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    }).then((mongoose) => mongoose);
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

module.exports = { connect };
