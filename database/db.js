/**
 * Koneksi & inisialisasi database SQLite.
 * Menggunakan better-sqlite3 (synchronous, cepat, cocok untuk bot).
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const logger = require('../utils/logger');

const dbDir = path.dirname(config.database.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.database.path);
db.pragma('journal_mode = WAL');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      product_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'Umum',
      file_path TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      stock INTEGER DEFAULT -1,
      sold_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      buyer_number TEXT NOT NULL,
      product_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      invoice_id TEXT,
      qr_string TEXT,
      amount INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      paid_at TEXT,
      delivered INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products (product_id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      transaction_id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      gateway TEXT NOT NULL DEFAULT 'xendit',
      qris_string TEXT,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'UNPAID',
      paid_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (order_id)
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  logger.info('Database berhasil diinisialisasi.');
}

module.exports = { db, init };
