import fs from 'fs';
import path from 'path';
import { pool } from './db.ts';

async function migrateData() {
  console.log("Starting data migration from db.json to TiDB...");
  
  const dbFile = path.join(process.cwd(), 'data', 'db.json');
  if (!fs.existsSync(dbFile)) {
    console.log("No db.json found. Nothing to migrate.");
    process.exit(0);
  }

  const data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));

  try {
    // 1. Migrate Categories
    if (data.categories && data.categories.length > 0) {
      console.log(`Migrating ${data.categories.length} categories...`);
      for (const cat of data.categories) {
        await pool.execute(
          `INSERT IGNORE INTO categories (id, name, sortOrder) VALUES (?, ?, ?)`,
          [cat.id, cat.name, cat.sortOrder]
        );
      }
    }

    // 2. Migrate Products
    if (data.products && data.products.length > 0) {
      console.log(`Migrating ${data.products.length} products...`);
      for (const prod of data.products) {
        await pool.execute(
          `INSERT IGNORE INTO products (id, sno, sortOrder, name, price, imageUrl, enabled, description, category, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            prod.id, 
            prod.sno || 0, 
            prod.sortOrder || 0, 
            prod.name, 
            prod.price || 0, 
            prod.imageUrl || '', 
            prod.enabled ? 1 : 0, 
            prod.description || '', 
            prod.category || '', 
            new Date(prod.createdAt || Date.now())
          ]
        );
      }
    }

    // 3. Migrate Orders
    if (data.orders && data.orders.length > 0) {
      console.log(`Migrating ${data.orders.length} orders...`);
      for (const order of data.orders) {
        await pool.execute(
          `INSERT IGNORE INTO orders (id, orderNumber, customerName, mobileNumber, city, totalQty, totalPrice, status, createdAt, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            order.id, 
            order.orderNumber, 
            order.customerName, 
            order.mobileNumber, 
            order.city, 
            order.totalQty, 
            order.totalPrice || 0, 
            order.status, 
            new Date(order.createdAt || Date.now()),
            order.notes || ''
          ]
        );

        // Migrate Order Items
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            await pool.execute(
              `INSERT INTO order_items (orderId, productId, productName, qty, unitPrice, imageUrl)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                order.id,
                item.productId,
                item.productName,
                item.qty,
                item.unitPrice || 0,
                item.imageUrl || ''
              ]
            );
          }
        }
      }
    }

    // 4. Migrate Settings
    if (data.settings && data.settings.whatsappNumber) {
      console.log(`Migrating settings...`);
      await pool.execute(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        ['whatsappNumber', data.settings.whatsappNumber]
      );
    }

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrateData();
