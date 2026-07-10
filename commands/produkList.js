const config = require('../config/config');
const productModel = require('../database/models/product');
const { formatRupiah } = require('../utils/helpers');

/**
 * Mengirim daftar produk menggunakan Single Select List
 * (Product Picker ala WhatsApp Business).
 */
async function sendProductList(sock, jid) {
  const products = productModel.getAllProducts().filter((p) => p.stock !== 0);

  if (products.length === 0) {
    await sock.sendMessage(jid, {
      text: '📦 Saat ini belum ada produk yang tersedia. Silakan cek kembali beberapa saat lagi ya 🙏',
    });
    return;
  }

  const rows = products.map((p) => ({
    title: `${formatRupiah(p.price)} - ${p.name}`,
    description: p.description?.slice(0, 60) || 'Produk digital siap kirim otomatis',
    rowId: `buy_${p.product_id}`,
  }));

  const sections = [
    {
      title: 'Produk Tersedia',
      rows,
    },
  ];

  await sock.sendMessage(jid, {
    text:
      `📦 *Daftar Produk*\n\n` +
      `Silakan pilih produk yang ingin Anda beli.\n\n` +
      `Pastikan Anda memilih produk dengan benar sebelum melakukan pembayaran. ` +
      `Setelah pembayaran berhasil diverifikasi, produk akan dikirim secara otomatis ` +
      `tanpa perlu menunggu admin. ⚡`,
    footer: config.bot.name,
    title: '📦 Katalog Produk',
    buttonText: 'Pilih Produk',
    sections,
  });
}

module.exports = { sendProductList };
