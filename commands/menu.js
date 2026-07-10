const config = require('../config/config');

/**
 * Mengirim pesan sambutan utama dengan tombol interaksi.
 */
async function sendMainMenu(sock, jid) {
  const text =
    `👋 *Halo, selamat datang di ${config.bot.name}!*\n\n` +
    `Terima kasih sudah mampir 🙌. Semua transaksi di sini berjalan ` +
    `*100% otomatis, 24 jam penuh* — tanpa perlu menunggu admin online.\n\n` +
    `Ingin belanja produk digital berkualitas? Yuk pilih menu di bawah ini ` +
    `untuk mulai transaksi. Cepat, aman, dan produk langsung terkirim ` +
    `setelah pembayaran terverifikasi. ✨`;

  const buttons = [
    { buttonId: 'menu_produk', buttonText: { displayText: '📦 Lihat Produk' }, type: 1 },
    { buttonId: 'menu_owner', buttonText: { displayText: '👤 Owner' }, type: 1 },
  ];

  await sock.sendMessage(jid, {
    text,
    footer: config.bot.name,
    buttons,
    headerType: 1,
  });
}

async function sendOwnerInfo(sock, jid) {
  const ownerNumber = config.owners[0]?.replace('@s.whatsapp.net', '') || 'tidak tersedia';
  await sock.sendMessage(jid, {
    text:
      `👤 *Informasi Owner*\n\n` +
      `Jika ada kendala di luar sistem otomatis (misalnya kendala teknis), ` +
      `silakan hubungi owner kami di nomor:\n\n` +
      `wa.me/${ownerNumber}\n\n` +
      `Namun untuk pembelian, seluruh proses sudah otomatis ya — cukup gunakan menu 📦 *Lihat Produk*.`,
  });
}

module.exports = { sendMainMenu, sendOwnerInfo };
