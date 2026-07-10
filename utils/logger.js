/**
 * Logger sederhana untuk mencatat aktivitas penting bot
 * (upload produk, transaksi, pembayaran, pengiriman, error, dll).
 * Log ditulis ke console + disimpan ke tabel `logs` di database.
 */

const pino = require('pino');

const baseLogger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
  },
});

function safeDbLog(type, message) {
  try {
    // require di dalam fungsi untuk menghindari circular dependency saat db belum siap
    const { db } = require('../database/db');
    db.prepare('INSERT INTO logs (type, message, created_at) VALUES (?, ?, ?)').run(
      type,
      message,
      new Date().toISOString()
    );
  } catch (err) {
    // Jika db belum siap (misal saat startup awal), abaikan saja
  }
}

module.exports = {
  info: (msg) => {
    baseLogger.info(msg);
    safeDbLog('INFO', msg);
  },
  warn: (msg) => {
    baseLogger.warn(msg);
    safeDbLog('WARN', msg);
  },
  error: (msg) => {
    baseLogger.error(msg);
    safeDbLog('ERROR', msg);
  },
  transaction: (msg) => {
    baseLogger.info(`💰 ${msg}`);
    safeDbLog('TRANSACTION', msg);
  },
};
