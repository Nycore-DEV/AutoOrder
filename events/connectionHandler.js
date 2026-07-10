const logger = require('../utils/logger');

function handleConnectionUpdate(update, startBot, DisconnectReason) {
  const { connection, lastDisconnect } = update;

  if (connection === 'close') {
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

    logger.warn(`Koneksi terputus. Status: ${statusCode}. Reconnect: ${shouldReconnect}`);

    if (shouldReconnect) {
      startBot();
    } else {
      logger.error('Bot logout dari WhatsApp. Silakan hapus folder /sessions lalu pairing ulang.');
    }
  } else if (connection === 'open') {
    logger.info('✅ Bot berhasil terhubung ke WhatsApp!');
  }
}

module.exports = { handleConnectionUpdate };
