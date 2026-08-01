import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Connect to 'test' or 'sys' database first to create 'calendars_db' if it doesn't exist
export async function initializeDatabase() {
  console.log("Connecting to TiDB to initialize schema...");
  
  // Create a connection without specifying the target database to ensure we can create it
  const connection = await mysql.createConnection({
    host: process.env.TIDB_HOST,
    port: Number(process.env.TIDB_PORT) || 4000,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  });

  try {
    const dbName = process.env.TIDB_DATABASE || 'calendars_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);

    // Create Products Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        sno INT,
        sortOrder INT,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2),
        imageUrl TEXT,
        enabled BOOLEAN DEFAULT true,
        description TEXT,
        category VARCHAR(255),
        createdAt DATETIME
      )
    `);

    // Create Orders Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        orderNumber VARCHAR(255) NOT NULL,
        customerName VARCHAR(255),
        mobileNumber VARCHAR(50),
        city VARCHAR(255),
        totalQty INT,
        totalPrice DECIMAL(10, 2),
        status VARCHAR(50),
        createdAt DATETIME,
        notes TEXT
      )
    `);

    // Create Order Items Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orderId VARCHAR(255),
        productId VARCHAR(255),
        productName VARCHAR(255),
        qty INT,
        unitPrice DECIMAL(10, 2),
        imageUrl TEXT,
        FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // Create Settings Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT
      )
    `);

    // Insert default settings if not exists
    await connection.query(`
      INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('whatsappNumber', '9080917850')
    `);

    // Create Categories Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sortOrder INT
      )
    `);

    console.log("TiDB schema initialized successfully.");
  } catch (error) {
    console.error("Error initializing TiDB schema:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Export a connection pool for regular queries
export const pool = mysql.createPool({
  host: process.env.TIDB_HOST,
  port: Number(process.env.TIDB_PORT) || 4000,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE || 'calendars_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});
