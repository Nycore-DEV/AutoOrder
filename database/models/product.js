const { db } = require('../db');

function generateProductId() {
  const row = db.prepare('SELECT COUNT(*) as count FROM products').get();
  const next = row.count + 1;
  return `PRD-${String(next).padStart(4, '0')}`;
}

function createProduct({ name, price = 0, description = '', category = 'Umum', filePath, fileSize }) {
  const productId = generateProductId();
  db.prepare(`
    INSERT INTO products (product_id, name, price, description, category, file_path, file_size, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(productId, name, price, description, category, filePath, fileSize, new Date().toISOString());
  return getProduct(productId);
}

function getProduct(productId) {
  return db.prepare('SELECT * FROM products WHERE product_id = ?').get(productId);
}

function getAllProducts() {
  return db.prepare('SELECT * FROM products ORDER BY created_at ASC').all();
}

function updateProduct(productId, fields) {
  const existing = getProduct(productId);
  if (!existing) return null;

  const allowed = ['name', 'price', 'description', 'category', 'stock', 'file_path', 'file_size'];
  const updates = [];
  const values = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }

  if (updates.length === 0) return existing;

  values.push(productId);
  db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE product_id = ?`).run(...values);
  return getProduct(productId);
}

function deleteProduct(productId) {
  const result = db.prepare('DELETE FROM products WHERE product_id = ?').run(productId);
  return result.changes > 0;
}

function incrementSold(productId) {
  db.prepare('UPDATE products SET sold_count = sold_count + 1 WHERE product_id = ?').run(productId);
}

module.exports = {
  createProduct,
  getProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  incrementSold,
};
