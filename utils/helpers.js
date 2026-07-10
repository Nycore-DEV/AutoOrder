const config = require('../config/config');

function formatRupiah(amount) {
  return `Rp${Number(amount).toLocaleString('id-ID')}`;
}

function isOwner(jid) {
  return config.owners.includes(jid);
}

function normalizeJid(jid) {
  return jid?.split(':')[0] + (jid?.includes('@') ? '' : '@s.whatsapp.net');
}

function statusEmoji(status) {
  const map = {
    PENDING: '🟡 MENUNGGU PEMBAYARAN',
    UNPAID: '🟡 MENUNGGU PEMBAYARAN',
    PAID: '✅ SUDAH DIBAYAR',
    COMPLETED: '✅ SELESAI',
    EXPIRED: '⛔ KEDALUWARSA',
  };
  return map[status] || status;
}

module.exports = { formatRupiah, isOwner, normalizeJid, statusEmoji };
