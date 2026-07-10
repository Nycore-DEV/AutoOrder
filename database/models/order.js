const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

function generateOrderId() {
  const year = new Date().getFullYear();
  const row = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_id LIKE ?").get(`INV-${year}%`);
  const next = row.count + 1;
  return `INV-${year}${String(next).padStart(4, '0')}`;
}

function createOrder({ buyerNumber, productId, amount }) {
  const orderId = generateOrderId();
  db.prepare(`
    INSERT INTO orders (order_id, buyer_number, product_id, status, amount, created_at)
    VALUES (?, ?, ?, 'PENDING', ?, ?)
  `).run(orderId, buyerNumber, productId, amount, new Date().toISOString());
  return getOrder(orderId);
}

function getOrder(orderId) {
  return db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);
}

function getLatestPendingOrderForBuyer(buyerNumber) {
  return db
    .prepare(`
      SELECT * FROM orders
      WHERE buyer_number = ? AND status = 'PENDING'
      ORDER BY created_at DESC LIMIT 1
    `)
    .get(buyerNumber);
}

function setInvoiceInfo(orderId, { invoiceId, qrString }) {
  db.prepare('UPDATE orders SET invoice_id = ?, qr_string = ? WHERE order_id = ?').run(
    invoiceId,
    qrString,
    orderId
  );
}

function markPaid(orderId) {
  db.prepare("UPDATE orders SET status = 'PAID', paid_at = ? WHERE order_id = ?").run(
    new Date().toISOString(),
    orderId
  );
}

function markCompleted(orderId) {
  db.prepare("UPDATE orders SET status = 'COMPLETED', delivered = 1 WHERE order_id = ?").run(orderId);
}

function isAlreadyDelivered(orderId) {
  const order = getOrder(orderId);
  return order && order.delivered === 1;
}

module.exports = {
  createOrder,
  getOrder,
  getLatestPendingOrderForBuyer,
  setInvoiceInfo,
  markPaid,
  markCompleted,
  isAlreadyDelivered,
};
