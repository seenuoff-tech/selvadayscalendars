import express from "express";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { Product, Order, Category } from "../src/types.js";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Enable CORS for frontend requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// TiDB Database Pool Connection setup
const hasTiDB = Boolean(process.env.TIDB_HOST && process.env.TIDB_USER && process.env.TIDB_PASSWORD);

const pool = hasTiDB
  ? mysql.createPool({
      host: process.env.TIDB_HOST,
      port: Number(process.env.TIDB_PORT) || 4000,
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE || "calendars_db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      },
    })
  : null;

const defaultCategories: Category[] = [];
const defaultProducts: Product[] = [];

let memoryProducts: Product[] = [];
let memoryOrders: Order[] = [];
let memoryCategories: Category[] = [];
let memorySettings = { whatsappNumber: "9080917850" };
let isMemoryProductsInitialized = false;
let isMemoryCategoriesInitialized = false;
const globalDeletedIds = new Set<string>();

function resequence(products: Product[]): Product[] {
  products.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  return products.map((p, idx) => ({ ...p, sno: idx + 1, sortOrder: idx + 1 }));
}

async function getProductsList(): Promise<Product[]> {
  if (pool) {
    try {
      await ensureDBSeeded();
      const [rows]: any = await pool.query("SELECT * FROM products ORDER BY sortOrder ASC, sno ASC");
      if (rows && Array.isArray(rows)) {
        return rows.map((r: any, idx: number) => ({
          ...r,
          sno: idx + 1,
          sortOrder: idx + 1,
          enabled: Boolean(r.enabled),
          price: Number(r.price) || 0
        }));
      }
    } catch (err) {
      console.error("TiDB error fetching products:", err);
    }
  }

  if (!isMemoryProductsInitialized) {
    memoryProducts = [...defaultProducts];
    isMemoryProductsInitialized = true;
  }
  memoryProducts = memoryProducts.filter(p => !globalDeletedIds.has(p.id));
  return resequence(memoryProducts);
}

// Admin Authentication
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "selvascreenuv@gmail.com" && password === "SelvaCalendar@@2026@@") {
    return res.json({ success: true, token: "admin-session-token-2026" });
  } else {
    return res.status(401).json({ success: false, message: "Invalid admin credentials." });
  }
});

// GET settings
app.get("/api/settings", async (_req, res) => {
  if (pool) {
    try {
      const [rows]: any = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'whatsappNumber'");
      if (rows && rows.length > 0) {
        return res.json({ success: true, settings: { whatsappNumber: rows[0].setting_value } });
      }
    } catch (err) {
      console.error("TiDB error:", err);
    }
  }
  res.json({ success: true, settings: memorySettings });
});

// POST update settings
app.post("/api/settings", async (req, res) => {
  const { whatsappNumber } = req.body;
  if (whatsappNumber !== undefined) {
    memorySettings.whatsappNumber = whatsappNumber;
    if (pool) {
      try {
        await pool.query("INSERT INTO settings (setting_key, setting_value) VALUES ('whatsappNumber', ?) ON DUPLICATE KEY UPDATE setting_value = ?", [whatsappNumber, whatsappNumber]);
      } catch (err) {
        console.error("TiDB error:", err);
      }
    }
  }
  res.json({ success: true, settings: memorySettings });
});

let isDBInitialized = false;

async function ensureDBSeeded() {
  if (!pool || isDBInitialized) return;
  try {
    // Ensure table exists
    await pool.query(`
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT
      )
    `);

    const [settingRows]: any = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'products_seeded'");
    if (!settingRows || settingRows.length === 0) {
      // Seed default products ONCE
      for (const p of defaultProducts) {
        await pool.query(
          "INSERT IGNORE INTO products (id, sno, sortOrder, name, price, imageUrl, enabled, description, category, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [p.id, p.sno, p.sortOrder, p.name, p.price, p.imageUrl, p.enabled ? 1 : 0, p.description, p.category, p.createdAt]
        );
      }
      await pool.query("INSERT INTO settings (setting_key, setting_value) VALUES ('products_seeded', 'true') ON DUPLICATE KEY UPDATE setting_value = 'true'");
    }
    isDBInitialized = true;
  } catch (err) {
    console.error("Failed to seed TiDB:", err);
  }
}

// GET products
app.get("/api/products", async (_req, res) => {
  const products = await getProductsList();
  res.json({ success: true, products });
});

// POST add product
app.post("/api/products", async (req, res) => {
  const { name, price, imageUrl, enabled, description, category } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Product name is required" });
  }

  const currentProducts = await getProductsList();
  const nextSno = currentProducts.length + 1;
  const newProduct: Product = {
    id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sno: nextSno,
    sortOrder: nextSno,
    name: name.trim(),
    price: price ? Number(price) : 0,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=300&q=80",
    enabled: enabled !== undefined ? Boolean(enabled) : true,
    description: description || "",
    category: category || "Calendar",
    createdAt: new Date().toISOString()
  };

  memoryProducts = [...currentProducts, newProduct];
  memoryProducts = resequence(memoryProducts);

  if (pool) {
    try {
      await pool.query(
        "INSERT INTO products (id, sno, sortOrder, name, price, imageUrl, enabled, description, category, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [newProduct.id, newProduct.sno, newProduct.sortOrder, newProduct.name, newProduct.price, newProduct.imageUrl, newProduct.enabled ? 1 : 0, newProduct.description, newProduct.category, newProduct.createdAt]
      );
    } catch (err) {
      console.error("TiDB insert error:", err);
    }
  }

  const allProducts = await getProductsList();
  res.json({ success: true, product: newProduct, products: allProducts });
});

// PUT / POST update product
const handleUpdateProductApi = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { name, price, imageUrl, enabled, description, category } = req.body;

  const currentProducts = await getProductsList();
  const idx = currentProducts.findIndex(p => p.id === id);
  if (idx !== -1) {
    currentProducts[idx] = { ...currentProducts[idx], ...req.body };
    if (name !== undefined) currentProducts[idx].name = name.trim();
    if (price !== undefined) currentProducts[idx].price = Number(price);

    memoryProducts = resequence(currentProducts);

    if (pool) {
      try {
        await pool.query(
          "UPDATE products SET name = ?, price = ?, imageUrl = ?, enabled = ?, description = ?, category = ? WHERE id = ?",
          [memoryProducts[idx].name, memoryProducts[idx].price, memoryProducts[idx].imageUrl, memoryProducts[idx].enabled ? 1 : 0, memoryProducts[idx].description, memoryProducts[idx].category, id]
        );
      } catch (err) {
        console.error("TiDB update error:", err);
      }
    }
    const allProducts = await getProductsList();
    res.json({ success: true, product: memoryProducts[idx], products: allProducts });
  } else {
    res.status(404).json({ success: false, message: "Product not found" });
  }
};

app.put("/api/products/:id", handleUpdateProductApi);
app.post("/api/products/update/:id", handleUpdateProductApi);

// POST bulk upload products (Excel Import)
app.post("/api/products/bulk", async (req, res) => {
  const { products, replaceExisting } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ success: false, message: "No products provided" });
  }

  const startSno = replaceExisting ? 0 : memoryProducts.length;
  const newProds: Product[] = products.map((p, idx) => ({
    id: `prod-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
    sno: startSno + idx + 1,
    sortOrder: startSno + idx + 1,
    name: p.productName || p.name || `Calendar Product ${idx + 1}`,
    price: p.price ? Number(p.price) : 0,
    imageUrl: p.imageUrl || "/media/image101.jpeg",
    enabled: p.enabled !== undefined ? (String(p.enabled).toLowerCase() !== "false" && String(p.enabled).toLowerCase() !== "disabled" && Boolean(p.enabled)) : true,
    description: p.description || "",
    category: p.category || "Calendar",
    createdAt: new Date().toISOString()
  }));

  if (replaceExisting) {
    memoryProducts = newProds;
  } else {
    memoryProducts = [...memoryProducts, ...newProds];
  }

  memoryProducts = resequence(memoryProducts);

  if (pool) {
    try {
      if (replaceExisting) {
        await pool.query("TRUNCATE TABLE products");
      }
      for (const p of newProds) {
        await pool.query(
          "INSERT INTO products (id, sno, sortOrder, name, price, imageUrl, enabled, description, category, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [p.id, p.sno, p.sortOrder, p.name, p.price, p.imageUrl, p.enabled, p.description, p.category, p.createdAt]
        );
      }
    } catch (err) {
      console.error("TiDB bulk insert error:", err);
    }
  }

  res.json({ success: true, message: `Successfully imported ${newProds.length} products!`, products: memoryProducts });
});

// POST bulk upload products fallback endpoint
app.post("/api/products/bulk-upload", async (req, res) => {
  const { products, replaceExisting } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ success: false, message: "No products provided" });
  }

  const startSno = replaceExisting ? 0 : memoryProducts.length;
  const newProds: Product[] = products.map((p, idx) => ({
    id: `prod-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
    sno: startSno + idx + 1,
    sortOrder: startSno + idx + 1,
    name: p.productName || p.name || `Calendar Product ${idx + 1}`,
    price: p.price ? Number(p.price) : 0,
    imageUrl: p.imageUrl || "/media/image101.jpeg",
    enabled: p.enabled !== undefined ? (String(p.enabled).toLowerCase() !== "false" && String(p.enabled).toLowerCase() !== "disabled" && Boolean(p.enabled)) : true,
    description: p.description || "",
    category: p.category || "Calendar",
    createdAt: new Date().toISOString()
  }));

  if (replaceExisting) {
    memoryProducts = newProds;
  } else {
    memoryProducts = [...memoryProducts, ...newProds];
  }

  memoryProducts = resequence(memoryProducts);

  if (pool) {
    try {
      if (replaceExisting) {
        await pool.query("TRUNCATE TABLE products");
      }
      for (const p of newProds) {
        await pool.query(
          "INSERT INTO products (id, sno, sortOrder, name, price, imageUrl, enabled, description, category, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [p.id, p.sno, p.sortOrder, p.name, p.price, p.imageUrl, p.enabled, p.description, p.category, p.createdAt]
        );
      }
    } catch (err) {
      console.error("TiDB bulk insert error:", err);
    }
  }

  res.json({ success: true, message: `Successfully imported ${newProds.length} products!`, products: memoryProducts });
});

// DELETE bulk products
const handleBulkDeleteApi = async (req: express.Request, res: express.Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: "No product IDs provided" });
  }

  ids.forEach((id: string) => globalDeletedIds.add(id));
  memoryProducts = memoryProducts.filter(p => !ids.includes(p.id));

  if (pool) {
    try {
      await ensureDBSeeded();
      const placeholders = ids.map(() => "?").join(",");
      await pool.query(`DELETE FROM products WHERE id IN (${placeholders})`, ids);
    } catch (err) {
      console.error("TiDB bulk delete error:", err);
    }
  }

  const updatedProducts = await getProductsList();
  res.json({
    success: true,
    message: `Successfully deleted products`,
    products: updatedProducts,
  });
};

app.delete("/api/products/bulk", handleBulkDeleteApi);
app.post("/api/products/bulk-delete", handleBulkDeleteApi);

// DELETE single product
const handleDeleteProductApi = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, message: "Product ID is required" });
  }

  globalDeletedIds.add(id);

  if (pool) {
    try {
      await ensureDBSeeded();
      await pool.query("DELETE FROM products WHERE id = ?", [id]);
    } catch (err) {
      console.error("TiDB delete error:", err);
    }
  }

  memoryProducts = memoryProducts.filter(p => p.id !== id);
  const updatedProducts = await getProductsList();
  res.json({ success: true, message: "Product deleted successfully", products: updatedProducts });
};

app.delete("/api/products/:id", handleDeleteProductApi);
app.post("/api/products/delete/:id", handleDeleteProductApi);

let isCategoryTableInitialized = false;
const globalDeletedCategoryIds = new Set<string>();

async function ensureCategoryTable() {
  if (!pool || isCategoryTableInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sortOrder INT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT
      )
    `);

    const [settingRows]: any = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'categories_seeded'");
    if (!settingRows || settingRows.length === 0) {
      for (const cat of defaultCategories) {
        await pool.query(
          "INSERT IGNORE INTO categories (id, name, sortOrder) VALUES (?, ?, ?)",
          [cat.id, cat.name, cat.sortOrder]
        );
      }
      await pool.query("INSERT INTO settings (setting_key, setting_value) VALUES ('categories_seeded', 'true') ON DUPLICATE KEY UPDATE setting_value = 'true'");
    }
    isCategoryTableInitialized = true;
  } catch (err) {
    console.error("Failed to seed category table:", err);
  }
}

async function getCategoriesList(): Promise<Category[]> {
  if (pool) {
    try {
      await ensureCategoryTable();
      const [rows]: any = await pool.query("SELECT * FROM categories ORDER BY sortOrder ASC");
      if (rows && Array.isArray(rows)) {
        return rows.map((r: any, idx: number) => ({
          id: String(r.id),
          name: String(r.name),
          sortOrder: Number(r.sortOrder) || (idx + 1)
        }));
      }
    } catch (err) {
      console.error("TiDB category error:", err);
    }
  }

  if (!isMemoryCategoriesInitialized) {
    memoryCategories = [...defaultCategories];
    isMemoryCategoriesInitialized = true;
  }
  memoryCategories = memoryCategories.filter(c => !globalDeletedCategoryIds.has(c.id));
  return memoryCategories;
}

// GET categories
app.get("/api/categories", async (_req, res) => {
  const categories = await getCategoriesList();
  res.json({ success: true, categories });
});

// POST add category
app.post("/api/categories", async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Category name is required" });
  }

  const currentCategories = await getCategoriesList();
  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name: name.trim(),
    sortOrder: currentCategories.length + 1
  };

  memoryCategories = [...currentCategories, newCat];

  if (pool) {
    try {
      await ensureCategoryTable();
      await pool.query(
        "INSERT INTO categories (id, name, sortOrder) VALUES (?, ?, ?)",
        [newCat.id, newCat.name, newCat.sortOrder]
      );
    } catch (err) {
      console.error("TiDB category insert error:", err);
    }
  }

  const updatedCategories = await getCategoriesList();
  res.json({ success: true, category: newCat, categories: updatedCategories });
});

// PUT / POST update category
const handleUpdateCategoryApi = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { name } = req.body;

  const currentCategories = await getCategoriesList();
  const idx = currentCategories.findIndex(c => c.id === id);
  if (idx !== -1) {
    if (name && name.trim()) {
      const oldName = currentCategories[idx].name;
      const newName = name.trim();
      currentCategories[idx].name = newName;
      memoryCategories = [...currentCategories];

      if (pool) {
        try {
          await ensureCategoryTable();
          await pool.query("UPDATE categories SET name = ? WHERE id = ?", [newName, id]);
          await pool.query("UPDATE products SET category = ? WHERE category = ?", [newName, oldName]);
        } catch (err) {
          console.error("TiDB category update error:", err);
        }
      }

      memoryProducts.forEach(p => {
        if (p.category === oldName) p.category = newName;
      });
    }
    const updatedCategories = await getCategoriesList();
    res.json({ success: true, category: currentCategories[idx], categories: updatedCategories });
  } else {
    res.status(404).json({ success: false, message: "Category not found" });
  }
};

app.put("/api/categories/:id", handleUpdateCategoryApi);
app.post("/api/categories/update/:id", handleUpdateCategoryApi);

// DELETE / POST delete category
const handleDeleteCategoryApi = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  globalDeletedCategoryIds.add(id);
  memoryCategories = memoryCategories.filter(c => c.id !== id);

  if (pool) {
    try {
      await ensureCategoryTable();
      await pool.query("DELETE FROM categories WHERE id = ?", [id]);
    } catch (err) {
      console.error("TiDB category delete error:", err);
    }
  }

  const updatedCategories = await getCategoriesList();
  res.json({ success: true, categories: updatedCategories });
};

app.delete("/api/categories/:id", handleDeleteCategoryApi);
app.post("/api/categories/delete/:id", handleDeleteCategoryApi);

// GET orders
app.get("/api/orders", (_req, res) => {
  res.json({ success: true, orders: memoryOrders });
});

// POST create order
app.post("/api/orders", (req, res) => {
  const { customerName, mobileNumber, city, items, notes } = req.body;

  if (!customerName || !mobileNumber) {
    return res.status(400).json({ success: false, message: "Customer Name & Mobile Number are required" });
  }

  const orderNum = `ORD-2026-${Math.floor(100 + Math.random() * 900)}`;
  const totalQty = items?.reduce((sum: number, item: any) => sum + (item.qty || 0), 0) || 0;
  const totalPrice = items?.reduce((sum: number, item: any) => sum + ((item.qty || 0) * (item.unitPrice || 0)), 0) || 0;

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber: orderNum,
    customerName,
    mobileNumber,
    city: city || "",
    items: items || [],
    totalQty,
    totalPrice,
    status: "Pending",
    createdAt: new Date().toISOString(),
    notes: notes || ""
  };

  memoryOrders.unshift(newOrder);
  res.json({ success: true, order: newOrder });
});

// PUT update order status
app.put("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const idx = memoryOrders.findIndex(o => o.id === id);
  if (idx !== -1) {
    memoryOrders[idx].status = status;
    res.json({ success: true, order: memoryOrders[idx] });
  } else {
    res.status(404).json({ success: false, message: "Order not found" });
  }
});

// DELETE order
app.delete("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  memoryOrders = memoryOrders.filter(o => o.id !== id);
  res.json({ success: true, message: "Order deleted successfully" });
});

// GET media
app.get("/api/media", (_req, res) => {
  try {
    const MEDIA_DIR = path.join(process.cwd(), "Public", "media");
    if (!fs.existsSync(MEDIA_DIR)) {
      return res.json({ success: true, media: [] });
    }
    const files = fs.readdirSync(MEDIA_DIR);
    const images = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)).map(f => ({
      name: f,
      url: `/media/${f}`
    }));
    res.json({ success: true, media: images });
  } catch (err) {
    res.json({ success: true, media: [] });
  }
});

// POST upload media
app.post("/api/media", (req, res) => {
  try {
    const { filename, base64 } = req.body;
    if (!filename || !base64) {
      return res.status(400).json({ success: false, message: "Filename and base64 string are required" });
    }

    const MEDIA_DIR = path.join(process.cwd(), "Public", "media");
    if (!fs.existsSync(MEDIA_DIR)) {
      fs.mkdirSync(MEDIA_DIR, { recursive: true });
    }

    const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const filePath = path.join(MEDIA_DIR, safeFilename);

    fs.writeFileSync(filePath, base64Data, 'base64');
    res.json({ success: true, message: "Image uploaded successfully", url: `/media/${safeFilename}` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error uploading image" });
  }
});

// DELETE media item
app.delete("/api/media/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const MEDIA_DIR = path.join(process.cwd(), "Public", "media");
    const filePath = path.join(MEDIA_DIR, safeFilename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: "File not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting file" });
  }
});

// POST bulk delete media
app.post("/api/media/bulk-delete", (req, res) => {
  try {
    const { filenames } = req.body;
    const MEDIA_DIR = path.join(process.cwd(), "Public", "media");

    if (Array.isArray(filenames)) {
      filenames.forEach(f => {
        const safe = path.basename(f);
        const p = path.join(MEDIA_DIR, safe);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting files" });
  }
});

export default app;
