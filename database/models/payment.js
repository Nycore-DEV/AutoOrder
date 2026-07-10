const { db } = require('../db');

function createPayment({ transactionId, orderId, gateway = 'xendit', qrisString, amount }) {
  db.prepare(`
    INSERT INTO payments (transaction_id, order_id, gateway, qris_string, amount, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'UNPAID', ?)
  `).run(transactionId, orderId, gateway, qrisString, amount, new Date().toISOString());
}

function getPaymentByOrderId(orderId) {
  return db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1').get(orderId);
}

function markPaid(transactionId) {
  db.prepare("UPDATE payments SET status = 'PAID', paid_at = ? WHERE transaction_id = ?").run(
    new Date().toISOString(),
    transactionId
  );
}

module.exports = { createPayment, getPaymentByOrderId, markPaid };
