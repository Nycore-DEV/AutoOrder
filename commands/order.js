const QRCode = require('qrcode');
const config = require('../config/config');
const productModel = require('../database/models/product');
const orderModel = require('../database/models/order');
const paymentModel = require('../database/models/payment');
const xendit = require('../payments/xendit');
const { formatRupiah, statusEmoji } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Dipanggil saat pembeli memilih produk dari Single Select List (rowId: buy_PRD-XXXX)
 */
async function createOrderAndInvoice(sock, jid, productId) {
  const product = productModel.getProduct(productId);

  if (!product) {
    await sock.sendMessage(jid, { text: '❌ Produk tidak ditemukan atau sudah tidak tersedia.' });
    return;
  }
  if (product.stock === 0) {
    await sock.sendMessage(jid, { text: '⚠️ Maaf, stok produk ini sedang habis.' });
    return;
  }

  const order = orderModel.createOrder({ buyerNumber: jid, productId, amount: product.price });

  const qrisResult = await xendit.createQrisPayment({ orderId: order.order_id, amount: product.price });

  if (!qrisResult.success) {
    await sock.sendMessage(jid, {
      text: '❌ Gagal membuat invoice pembayaran saat ini. Silakan coba beberapa saat lagi.',
    });
    logger.error(`Gagal membuat QRIS untuk order ${order.order_id}: ${qrisResult.error}`);
    return;
  }

  orderModel.setInvoiceInfo(order.order_id, { invoiceId: qrisResult.qrisId, qrString: qrisResult.qrString });
  paymentModel.createPayment({
    transactionId: qrisResult.qrisId,
    orderId: order.order_id,
    qrisString: qrisResult.qrString,
    amount: product.price,
  });

  logger.transaction(`Invoice dibuat: ${order.order_id} - ${product.name} - ${formatRupiah(product.price)}`);

  // Generate gambar QR dari string QRIS
  const qrImageBuffer = await QRCode.toBuffer(qrisResult.qrString, { width: 500 });

  const caption =
    `🧾 *Invoice Pembelian*\n\n` +
    `Status : ${statusEmoji('PENDING')}\n\n` +
    `Produk : ${product.name}\n` +
    `Harga : ${formatRupiah(product.price)}\n` +
    `Order ID : ${order.order_id}\n\n` +
    `Silakan lakukan pembayaran menggunakan QRIS di atas. Invoice berlaku selama ` +
    `${config.invoice.expiryMinutes} menit.`;

  await sock.sendMessage(jid, {
    image: qrImageBuffer,
    caption,
    footer: config.bot.name,
    buttons: [{ buttonId: `check_${order.order_id}`, buttonText: { displayText: '✅ Cek Pembayaran' }, type: 1 }],
  });
}

module.exports = { createOrderAndInvoice };
