/**
 * ==========================================
 * FILE CONTROL / KONFIGURASI PUSAT BOT
 * ==========================================
 * Semua pengaturan bot (nomor owner, nomor pairing, nama bot,
 * API payment gateway, dll) diatur dari sini / dari file .env
 * agar mudah diubah tanpa menyentuh kode logic.
 */

require('dotenv').config();

function parseOwnerNumbers(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => (n.includes('@s.whatsapp.net') ? n : `${n}@s.whatsapp.net`));
}

module.exports = {
  bot: {
    name: process.env.BOT_NAME || 'Nycore Studio',
    number: process.env.BOT_NUMBER || '6287855074673',
    pairingNumber: process.env.PAIRING_NUMBER || process.env.BOT_NUMBER || '6287855074673',
    usePairingCode: (process.env.USE_PAIRING_CODE || 'true').toLowerCase() === 'true',
    sessionPath: './sessions',
  },

  owners: parseOwnerNumbers(process.env.OWNER_NUMBERS),

  xendit: {
    apiKey: process.env.XENDIT_API_KEY || 'xnd_development_EXKZYMHngmENXS2C1PNHpgIa2WKhMaUb6WuP1Sw3n0AgWQSNXA1DJV0gA5Ssyf',
    webhookToken: process.env.XENDIT_WEBHOOK_TOKEN || '7Z4FHKWyk5l9zVxVwru1PLr5ByVhh34Be4R2Z13i0JP0HdUK',
    merchantCode: process.env.XENDIT_MERCHANT_CODE || '',
    callbackUrl: process.env.XENDIT_CALLBACK_URL || '',
  },

  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },

  database: {
    path: process.env.DB_PATH || './database/store.db',
  },

  storage: {
    productsDir: './storage/products',
  },

  invoice: {
    expiryMinutes: parseInt(process.env.INVOICE_EXPIRY_MINUTES || '30', 10),
  },

  currency: process.env.CURRENCY || 'IDR',
  timezone: process.env.TIMEZONE || 'Asia/Jakarta',
};
