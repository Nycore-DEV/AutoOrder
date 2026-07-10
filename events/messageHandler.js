const { sendMainMenu, sendOwnerInfo } = require('../commands/menu');
const { sendProductList } = require('../commands/produkList');
const { handleRestock } = require('../commands/restock');
const { handleListProduk, handleEditProduk, handleHapusProduk } = require('../commands/manageProduk');
const { createOrderAndInvoice } = require('../commands/order');
const { handleCheckPayment } = require('../commands/checkPayment');
const logger = require('../utils/logger');

function extractText(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.buttonsResponseMessage?.selectedButtonId ||
    msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  );
}

async function handleIncomingMessage(sock, msg) {
  try {
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const text = extractText(msg).trim();
    if (!text) return;

    // --- Tombol / List response ---
    if (text === 'menu_produk') return sendProductList(sock, jid);
    if (text === 'menu_owner') return sendOwnerInfo(sock, jid);
    if (text.startsWith('buy_')) return createOrderAndInvoice(sock, jid, text.replace('buy_', ''));
    if (text.startsWith('check_')) return handleCheckPayment(sock, jid, text.replace('check_', ''));

    // --- Text command ---
    const [command, ...args] = text.split(' ');
    const cmd = command.toLowerCase();

    switch (cmd) {
      case '/menu':
        return sendMainMenu(sock, jid);
      case '/restock':
        return handleRestock(sock, msg);
      case '/produk':
        return handleListProduk(sock, msg);
      case '/edit':
        return handleEditProduk(sock, msg, args);
      case '/hapus':
        return handleHapusProduk(sock, msg, args);
      default:
        return; // command tidak dikenali, diamkan agar tidak spam
    }
  } catch (err) {
    logger.error(`Error saat memproses pesan: ${err.message}`);
  }
}

module.exports = { handleIncomingMessage };
