/**
 * Integrasi Xendit Payment Gateway (QRIS).
 * Dokumentasi resmi: https://developers.xendit.co/
 */

const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

const XENDIT_BASE_URL = 'https://api.xendit.co';

function authHeader() {
  const token = Buffer.from(`${config.xendit.apiKey}:`).toString('base64');
  return { Authorization: `Basic ${token}`, 'Content-Type': 'application/json' };
}

/**
 * Membuat QR Code Payment (QRIS) baru untuk sebuah order.
 * @param {Object} params
 * @param {string} params.orderId - dipakai sebagai reference_id (harus unik)
 * @param {number} params.amount
 */
async function createQrisPayment({ orderId, amount }) {
  try {
    const response = await axios.post(
      `${XENDIT_BASE_URL}/qr_codes`,
      {
        reference_id: orderId,
        type: 'DYNAMIC',
        currency: config.currency,
        amount,
        expires_at: new Date(Date.now() + config.invoice.expiryMinutes * 60 * 1000).toISOString(),
      },
      { headers: authHeader() }
    );

    return {
      success: true,
      qrisId: response.data.id,
      qrString: response.data.qr_string,
      status: response.data.status,
    };
  } catch (err) {
    logger.error(`Gagal membuat QRIS Xendit: ${err.response?.data?.message || err.message}`);
    return { success: false, error: err.response?.data?.message || err.message };
  }
}

/**
 * Cek status pembayaran QRIS berdasarkan reference_id (order_id).
 */
async function checkPaymentStatus(qrisId) {
  try {
    const response = await axios.get(`${XENDIT_BASE_URL}/qr_codes/${qrisId}`, {
      headers: authHeader(),
    });
    return { success: true, status: response.data.status };
  } catch (err) {
    logger.error(`Gagal cek status pembayaran Xendit: ${err.response?.data?.message || err.message}`);
    return { success: false, error: err.response?.data?.message || err.message };
  }
}

/**
 * Verifikasi signature/token webhook dari Xendit.
 * Xendit mengirim header "x-callback-token" yang harus dicocokkan
 * dengan Verification Token dari dashboard Xendit.
 */
function verifyWebhookToken(headerToken) {
  return Boolean(headerToken) && headerToken === config.xendit.webhookToken;
}

module.exports = { createQrisPayment, checkPaymentStatus, verifyWebhookToken };
