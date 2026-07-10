const { isOwner } = require('../utils/helpers');
const { restockProduct, formatFileSize } = require('../products/productManager');
const logger = require('../utils/logger');

/**
 * Handler untuk command /restock.
 * Owner mengirim file lalu me-reply file tersebut dengan "/restock".
 */
async function handleRestock(sock, msg) {
  // Baileys adalah ES Module, jadi diimpor secara dinamis di sini.
  const { downloadMediaMessage } = await import('@whiskeysockets/baileys');

  const jid = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;

  if (!isOwner(sender)) {
    await sock.sendMessage(jid, { text: '⛔ Perintah ini khusus untuk Owner.' });
    return;
  }

  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quoted) {
    await sock.sendMessage(jid, {
      text: 'ℹ️ Cara pakai:\n1. Kirim file produk ke chat ini\n2. Reply file tersebut dengan mengetik /restock',
    });
    return;
  }

  const mediaTypes = ['documentMessage', 'imageMessage', 'videoMessage', 'audioMessage'];
  const mediaType = mediaTypes.find((t) => quoted[t]);

  if (!mediaType) {
    await sock.sendMessage(jid, { text: '⚠️ Pesan yang di-reply bukan file. Silakan reply file produk yang valid.' });
    return;
  }

  try {
    const fakeMsg = { message: quoted, key: msg.key };
    const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {});
    const fileName = quoted[mediaType].fileName || `file_${Date.now()}`;

    const product = restockProduct(buffer, fileName);

    await sock.sendMessage(jid, {
      text:
        `✅ *Produk berhasil ditambahkan.*\n\n` +
        `Product ID : ${product.product_id}\n` +
        `Nama : ${product.name}\n` +
        `Ukuran : ${formatFileSize(product.file_size)}\n\n` +
        `Gunakan /produk untuk melihat semua produk, atau edit harga & deskripsi via panel Owner.`,
    });
  } catch (err) {
    logger.error(`Gagal restock produk: ${err.message}`);
    await sock.sendMessage(jid, { text: '❌ Gagal menyimpan produk. Silakan coba lagi.' });
  }
}

module.exports = { handleRestock };
