const { isOwner, formatRupiah } = require('../utils/helpers');
const productModel = require('../database/models/product');
const logger = require('../utils/logger');

/**
 * /produk -> menampilkan seluruh daftar produk (khusus owner)
 */
async function handleListProduk(sock, msg) {
  const jid = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;

  if (!isOwner(sender)) {
    await sock.sendMessage(jid, { text: '⛔ Perintah ini khusus untuk Owner.' });
    return;
  }

  const products = productModel.getAllProducts();
  if (products.length === 0) {
    await sock.sendMessage(jid, { text: '📦 Belum ada produk. Gunakan /restock untuk menambahkan.' });
    return;
  }

  const list = products
    .map(
      (p) =>
        `🆔 ${p.product_id}\n📄 ${p.name}\n💰 ${formatRupiah(p.price)} | 📦 Terjual: ${p.sold_count}\n`
    )
    .join('\n');

  await sock.sendMessage(jid, { text: `📋 *Daftar Produk*\n\n${list}` });
}

/**
 * /edit PRD-0001 harga=25000 nama=Produk Baru deskripsi=Teks baru
 */
async function handleEditProduk(sock, msg, args) {
  const jid = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;

  if (!isOwner(sender)) {
    await sock.sendMessage(jid, { text: '⛔ Perintah ini khusus untuk Owner.' });
    return;
  }

  const [productId, ...rest] = args;
  if (!productId) {
    await sock.sendMessage(jid, {
      text:
        'ℹ️ Format: /edit PRD-0001 harga=25000 nama=Nama Baru deskripsi=Deskripsi kategori=Games stok=10',
    });
    return;
  }

  const product = productModel.getProduct(productId);
  if (!product) {
    await sock.sendMessage(jid, { text: `❌ Produk dengan ID ${productId} tidak ditemukan.` });
    return;
  }

  const fields = {};
  const fieldMap = { harga: 'price', nama: 'name', deskripsi: 'description', kategori: 'category', stok: 'stock' };

  rest.join(' ').replace(/(\w+)=([^\s].*?)(?=\s\w+=|$)/g, (_, key, value) => {
    const mapped = fieldMap[key.toLowerCase()];
    if (mapped) {
      fields[mapped] = mapped === 'price' || mapped === 'stock' ? parseInt(value.trim(), 10) : value.trim();
    }
  });

  const updated = productModel.updateProduct(productId, fields);
  logger.info(`Produk ${productId} diperbarui oleh owner.`);

  await sock.sendMessage(jid, {
    text:
      `✅ Produk berhasil diperbarui.\n\n` +
      `🆔 ${updated.product_id}\n📄 ${updated.name}\n💰 ${formatRupiah(updated.price)}\n📁 Kategori: ${updated.category}`,
  });
}

/**
 * /hapus PRD-0001
 */
async function handleHapusProduk(sock, msg, args) {
  const jid = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;

  if (!isOwner(sender)) {
    await sock.sendMessage(jid, { text: '⛔ Perintah ini khusus untuk Owner.' });
    return;
  }

  const productId = args[0];
  if (!productId) {
    await sock.sendMessage(jid, { text: 'ℹ️ Format: /hapus PRD-0001' });
    return;
  }

  const success = productModel.deleteProduct(productId);
  if (success) {
    logger.info(`Produk ${productId} dihapus oleh owner.`);
    await sock.sendMessage(jid, { text: `🗑️ Produk ${productId} berhasil dihapus.` });
  } else {
    await sock.sendMessage(jid, { text: `❌ Produk dengan ID ${productId} tidak ditemukan.` });
  }
}

module.exports = { handleListProduk, handleEditProduk, handleHapusProduk };
