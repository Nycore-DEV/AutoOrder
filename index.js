/**
 * ==========================================
 * WHATSAPP AUTO ORDER BOT - ENTRY POINT
 * ==========================================
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');

const config = require('./config/config');
const db = require('./database/db');
const logger = require('./utils/logger');
const { handleIncomingMessage } = require('./events/messageHandler');
const { handleConnectionUpdate } = require('./events/connectionHandler');
const { startWebhookServer } = require('./events/webhookServer');

db.init();

let webhookStarted = false;

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer);
  }));
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(config.bot.sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('Desktop'),
    printQRInTerminal: !config.bot.usePairingCode,
  });

  // --- Pairing Code (sesuai requirement: prioritas utama) ---
  if (config.bot.usePairingCode && !sock.authState.creds.registered) {
    let phoneNumber = config.bot.pairingNumber.replace(/[^0-9]/g, '');
    if (!phoneNumber) {
      phoneNumber = await ask('6287855074673');
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    }

    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        logger.info(`🔑 Pairing Code Anda: ${code}`);
        console.log(`\n=================================`);
        console.log(`  PAIRING CODE: ${code}`);
        console.log(`=================================\n`);
      } catch (err) {
        logger.error(`Gagal meminta pairing code: ${err.message}`);
      }
    }, 3000);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    handleConnectionUpdate(update, startBot);

    if (update.connection === 'open' && !webhookStarted) {
      startWebhookServer(sock);
      webhookStarted = true;
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      await handleIncomingMessage(sock, msg);
    }
  });

  return sock;
}

startBot().catch((err) => {
  logger.error(`Gagal memulai bot: ${err.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled rejection: ${err?.message || err}`);
});
