const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const productModel = require('../database/models/product');
const logger = require('../utils/logger');

function ensureStorageDir() {
  if (!fs.existsSync(config.storage.productsDir)) {
    fs.mkdirSync(config.storage.productsDir, { recursive: true });
  }
}

/**
 * Menyimpan buffer file yang dikirim owner ke storage lokal,
 * lalu mencatatnya ke database sebagai produk baru.
 * @param {Buffer} fileBuffer
 * @param {string} originalFileName
 */
function restockProduct(fileBuffer, originalFileName) {
  ensureStorageDir();

  const ext = path.extname(originalFileName) || '';
  const safeName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}_${safeName}`;
  const destPath = path.join(config.storage.productsDir, uniqueName);

  fs.writeFileSync(destPath, fileBuffer);
  const fileSize = fs.statSync(destPath).size;

  const product = productModel.createProduct({
    name: originalFileName,
    price: 0,
    description: 'Silakan edit deskripsi & harga produk ini.',
    category: 'Umum',
    filePath: destPath,
    fileSize,
  });

  logger.info(`Produk baru ditambahkan: ${product.product_id} - ${product.name}`);
  return product;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

module.exports = { restockProduct, formatFileSize };
