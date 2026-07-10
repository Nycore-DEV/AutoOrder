const express = require('express');
const config = require('../config/config');
const xendit = require('../payments/xendit');
const orderModel = require('../database/models/order');
const { deliverProduct } = require('../commands/checkPayment');
const logger = require('../utils/logger');

/**
 * Membuat & menjalankan Express server untuk menerima webhook Xendit.
 * Webhook ini membuat pengiriman produk bisa berjalan real-time,
 * sebagai pelengkap tombol "Cek Pembayaran" manual.
 */
function startWebhookServer(sock) {
  const app = express();
  app.use(express.json());

  app.post('/webhook/xendit', async (req, res) => {
    const token = req.headers['x-callback-token'];

    if (!xendit.verifyWebhookToken(token)) {
      logger.warn('Webhook Xendit ditolak: token tidak valid.');
      return res.status(401).json({ message: 'Invalid token' });
    }

    const event = req.body;
    const referenceId = event?.reference_id || event?.data?.reference_id;
    const status = event?.status || event?.data?.status;

    res.status(200).json({ received: true }); // ack cepat ke Xendit

    if (!referenceId || (status !== 'PAID' && status !== 'COMPLETED')) return;

    const order = orderModel.getOrder(referenceId);
    if (!order) return;

    if (orderModel.isAlreadyDelivered(order.order_id)) return; // cegah kirim ganda

    logger.transaction(`Webhook Xendit: order ${order.order_id} PAID`);
    await deliverProduct(sock, order.buyer_number, order);
  });

  app.get('/', (_req, res) => res.send('WhatsApp Auto Order Bot is running.'));

  app.listen(config.server.port, () => {
    logger.info(`🌐 Webhook server berjalan di port ${config.server.port}`);
  });
}

module.exports = { startWebhookServer };
