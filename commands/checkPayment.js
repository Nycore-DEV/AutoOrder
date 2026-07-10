const fs = require('fs');
const orderModel = require('../database/models/order');
const paymentModel = require('../database/models/payment');
const productModel = require('../database/models/product');
const xendit = require('../payments/xendit');
const logger = require('../utils/logger');

/**
 * Dipanggil saat tombol "✅ Cek Pembayaran" / "🔄 Cek Kembali" ditekan.
 * Mencegah pengiriman produk ganda dengan mengecek flag `delivered`.
 */
async function handleCheckPayment(sock, jid, orderId) {
  const order = orderModel.getOrder(orderId);

  if (!order) {
    await sock.sendMessage(jid, { text: '❌ Order tidak ditemukan.' });
    return;
  }

  // Cegah pengecekan ulang jika sudah selesai & terkirim
  if (orderModel.isAlreadyDelivered(orderId)) {
    await sock.sendMessage(jid, {
      text: `ℹ️ Order ${orderId} sudah *Completed* dan produk sudah dikirim sebelumnya.`,
    });
    return;
  }

  const payment = paymentModel.getPaymentByOrderId(orderId);
  const statusResult = await xendit.checkPaymentStatus(payment.transaction_id);

  if (!statusResult.success) {
    await sock.sendMessage(jid, { text: '⚠️ Gagal mengecek status pembayaran. Silakan coba lagi.' });
    return;
  }

  if (statusResult.status !== 'PAID' && statusResult.status !== 'COMPLETED') {
    await sock.sendMessage(jid, {
      text:
        `❌ Pembayaran Anda belum kami terima.\n\n` +
        `Mohon pastikan pembayaran telah berhasil dan dana sudah terpotong dari ` +
        `rekening atau e-wallet Anda.\n\n` +
        `Apabila pembayaran baru saja dilakukan, silakan tunggu beberapa saat lalu ` +
        `tekan tombol Cek Pembayaran kembali.`,
      footer: 'Auto Order System',
      buttons: [{ buttonId: `check_${orderId}`, buttonText: { displayText: '🔄 Cek Kembali' }, type: 1 }],
    });
    return;
  }

  await deliverProduct(sock, jid, order);
}

/**
 * Menandai order selesai & mengirim file produk ke pembeli.
 * Idempotent: tidak akan mengirim ulang jika sudah pernah terkirim.
 */
async function deliverProduct(sock, jid, order) {
  if (orderModel.isAlreadyDelivered(order.order_id)) return;

  paymentModel.markPaid(order.invoice_id);
  orderModel.markPaid(order.order_id);

  await sock.sendMessage(jid, {
    text:
      `✅ *Pembayaran berhasil diterima.*\n\n` +
      `Terima kasih telah melakukan pembelian. Produk Anda sedang dipersiapkan ` +
      `dan akan dikirim secara otomatis... 📦`,
  });

  const product = productModel.getProduct(order.product_id);

  if (!product || !fs.existsSync(product.file_path)) {
    logger.error(`File produk tidak ditemukan untuk order ${order.order_id}`);
    await sock.sendMessage(jid, {
      text: '⚠️ Terjadi kendala saat mengirim file produk. Owner akan segera menindaklanjuti secara manual.',
    });
    return;
  }

  await sock.sendMessage(jid, {
    document: fs.readFileSync(product.file_path),
    fileName: product.name,
    mimetype: 'application/octet-stream',
    caption: `📦 ${product.name}\n\nTerima kasih sudah berbelanja! 🙏`,
  });

  orderModel.markCompleted(order.order_id);
  productModel.incrementSold(order.product_id);

  logger.transaction(`Order ${order.order_id} COMPLETED - produk "${product.name}" terkirim ke ${jid}`);
}

module.exports = { handleCheckPayment, deliverProduct };
