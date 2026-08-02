import express from "express";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { Product, Order, Category } from "../src/types.js";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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

const defaultCategories: Category[] = [
  { id: "cat-1", name: "Desk Calendar", sortOrder: 1 },
  { id: "cat-2", name: "Wall Calendar", sortOrder: 2 },
  { id: "cat-3", name: "Pocket Calendar", sortOrder: 3 },
  { id: "cat-4", name: "Premium Calendar", sortOrder: 4 },
  { id: "cat-5", name: "Office Calendar", sortOrder: 5 },
  { id: "cat-6", name: "Magnetic Calendar", sortOrder: 6 }
];

const defaultProducts: Product[] = [
  { id: "prod-1", sno: 1, sortOrder: 1, name: "2026 Desk Spiral Calendar", price: 0, imageUrl: "/media/image122.jpeg", enabled: true, description: "12-month desk calendar with spiral binding", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-2", sno: 2, sortOrder: 2, name: "Executive Wall Calendar 2026", price: 0, imageUrl: "/media/image123.jpeg", enabled: true, description: "Large 12-sheet wall hanging calendar", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-3", sno: 3, sortOrder: 3, name: "Eco Wooden Stand Tabletop Calendar", price: 0, imageUrl: "/media/image124.jpeg", enabled: true, description: "Solid wood block calendar with monthly cards", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-4", sno: 4, sortOrder: 4, name: "Laxmi(Green) 101", price: 0, imageUrl: "/media/image101.jpeg", enabled: true, description: "12-month desk calendar with spiral binding", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-5", sno: 5, sortOrder: 5, name: "Laxmi(Blue) 102", price: 0, imageUrl: "/media/image102.jpeg", enabled: true, description: "Large 12-sheet wall hanging calendar", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-6", sno: 6, sortOrder: 6, name: "Pillaiyar(Red) 103", price: 0, imageUrl: "/media/image103.jpeg", enabled: true, description: "Solid wood block calendar with monthly cards", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-7", sno: 7, sortOrder: 7, name: "Pillaiyar(Blue) 104", price: 0, imageUrl: "/media/image104.jpeg", enabled: true, description: "12-month desk calendar with spiral binding", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-8", sno: 8, sortOrder: 8, name: "Pillaiyar(Megata) 105", price: 0, imageUrl: "/media/image105.jpeg", enabled: true, description: "Large 12-sheet wall hanging calendar", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-9", sno: 9, sortOrder: 9, name: "Tirupathi Laxmi 106", price: 0, imageUrl: "/media/image106.jpeg", enabled: true, description: "Solid wood block calendar with monthly cards", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-10", sno: 10, sortOrder: 10, name: "Tirupathi (Maroon) 107", price: 0, imageUrl: "/media/image107.jpeg", enabled: true, description: "12-month desk calendar with spiral binding", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-11", sno: 11, sortOrder: 11, name: "Tirupathi (Green) 108", price: 0, imageUrl: "/media/image108.jpeg", enabled: true, description: "Large 12-sheet wall hanging calendar", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-12", sno: 12, sortOrder: 12, name: "Murugan Pillaiyar 109", price: 0, imageUrl: "/media/image109.jpeg", enabled: true, description: "Solid wood block calendar with monthly cards", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-13", sno: 13, sortOrder: 13, name: "Saravanan 110", price: 0, imageUrl: "/media/image110.jpeg", enabled: true, description: "12-month desk calendar with spiral binding", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-14", sno: 14, sortOrder: 14, name: "T.Murugan (Purple) 111", price: 0, imageUrl: "/media/image111.jpeg", enabled: true, description: "Large 12-sheet wall hanging calendar", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-15", sno: 15, sortOrder: 15, name: "T.Murugan (Blue) 112", price: 0, imageUrl: "/media/image112.jpeg", enabled: true, description: "Solid wood block calendar with monthly cards", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-16", sno: 16, sortOrder: 16, name: "Palani Murugan 113", price: 0, imageUrl: "/media/image113.jpeg", enabled: true, description: "12-month desk calendar with spiral binding", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-17", sno: 17, sortOrder: 17, name: "Murugan Half 114", price: 0, imageUrl: "/media/image114.jpeg", enabled: true, description: "Large 12-sheet wall hanging calendar", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-18", sno: 18, sortOrder: 18, name: "Murugan Om 115", price: 0, imageUrl: "/media/image115.jpeg", enabled: true, description: "Solid wood block calendar with monthly cards", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-19", sno: 19, sortOrder: 19, name: "Murugan Oti Vaa 116", price: 0, imageUrl: "/media/image116.jpeg", enabled: true, description: "12-month desk calendar with spiral binding", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-20", sno: 20, sortOrder: 20, name: "T.Murugan Arupadai 117", price: 0, imageUrl: "/media/image117.jpeg", enabled: true, description: "Large 12-sheet wall hanging calendar", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-21", sno: 21, sortOrder: 21, name: "P.Murugan Arupadai 118", price: 0, imageUrl: "/media/image118.jpeg", enabled: true, description: "Solid wood block calendar with monthly cards", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-22", sno: 22, sortOrder: 22, name: "Murugan Motivation 119", price: 0, imageUrl: "/media/image119.jpeg", enabled: true, description: "12-month desk calendar with spiral binding", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-23", sno: 23, sortOrder: 23, name: "Vel Murugan 120", price: 0, imageUrl: "/media/image120.jpeg", enabled: true, description: "Large 12-sheet wall hanging calendar", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-24", sno: 24, sortOrder: 24, name: "Siva Family 121", price: 0, imageUrl: "/media/image121.jpeg", enabled: true, description: "Solid wood block calendar with monthly cards", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-25", sno: 25, sortOrder: 25, name: "Jesus 122", price: 0, imageUrl: "/media/image122.jpeg", enabled: true, description: "12-month desk calendar with spiral binding", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-26", sno: 26, sortOrder: 26, name: "Velankanni Matha 123", price: 0, imageUrl: "/media/image123.jpeg", enabled: true, description: "Large 12-sheet wall hanging calendar", category: "Wall Calendar", createdAt: new Date().toISOString() },
  { id: "prod-27", sno: 27, sortOrder: 27, name: "Mecca Madina 124", price: 0, imageUrl: "/media/image124.jpeg", enabled: true, description: "Solid wood block calendar with monthly cards", category: "Wall Calendar", createdAt: new Date().toISOString() }
];

let memoryProducts: Product[] = [...defaultProducts];
let memoryOrders: Order[] = [];
let memoryCategories: Category[] = [...defaultCategories];
let memorySettings = { whatsappNumber: "9080917850" };

function resequence(products: Product[]): Product[] {
  products.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  return products.map((p, idx) => ({ ...p, sno: idx + 1, sortOrder: idx + 1 }));
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

// GET products
app.get("/api/products", async (_req, res) => {
  if (pool) {
    try {
      const [rows]: any = await pool.query("SELECT * FROM products ORDER BY sortOrder ASC, sno ASC");
      if (rows && Array.isArray(rows)) {
        if (rows.length > 0) {
          const formatted = rows.map((r: any, idx: number) => ({
            ...r,
            sno: idx + 1,
            sortOrder: idx + 1,
            enabled: Boolean(r.enabled),
            price: Number(r.price) || 0
          }));
          memoryProducts = formatted;
          return res.json({ success: true, products: formatted });
        } else {
          memoryProducts = [];
          return res.json({ success: true, products: [] });
        }
      }
    } catch (err) {
      console.error("TiDB error:", err);
    }
  }
  memoryProducts = memoryProducts.filter(p => !globalDeletedIds.has(p.id));
  memoryProducts = resequence(memoryProducts);
  res.json({ success: true, products: memoryProducts });
});

// POST add product
app.post("/api/products", async (req, res) => {
  const { name, price, imageUrl, enabled, description, category } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Product name is required" });
  }

  const nextSno = memoryProducts.length + 1;
  const newProduct: Product = {
    id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sno: nextSno,
    sortOrder: nextSno,
    name: name.trim(),
    price: price ? Number(price) : 0,
    imageUrl: imageUrl || "/media/image101.jpeg",
    enabled: enabled !== undefined ? Boolean(enabled) : true,
    description: description || "",
    category: category || "Calendar",
    createdAt: new Date().toISOString()
  };

  memoryProducts.push(newProduct);
  memoryProducts = resequence(memoryProducts);

  if (pool) {
    try {
      await pool.query(
        "INSERT INTO products (id, sno, sortOrder, name, price, imageUrl, enabled, description, category, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [newProduct.id, newProduct.sno, newProduct.sortOrder, newProduct.name, newProduct.price, newProduct.imageUrl, newProduct.enabled, newProduct.description, newProduct.category, newProduct.createdAt]
      );
    } catch (err) {
      console.error("TiDB insert error:", err);
    }
  }

  res.json({ success: true, product: newProduct, products: memoryProducts });
});

// PUT update product
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, imageUrl, enabled, description, category } = req.body;

  const idx = memoryProducts.findIndex(p => p.id === id);
  if (idx !== -1) {
    memoryProducts[idx] = { ...memoryProducts[idx], ...req.body };
    memoryProducts = resequence(memoryProducts);

    if (pool) {
      try {
        await pool.query(
          "UPDATE products SET name = ?, price = ?, imageUrl = ?, enabled = ?, description = ?, category = ? WHERE id = ?",
          [memoryProducts[idx].name, memoryProducts[idx].price, memoryProducts[idx].imageUrl, memoryProducts[idx].enabled, memoryProducts[idx].description, memoryProducts[idx].category, id]
        );
      } catch (err) {
        console.error("TiDB update error:", err);
      }
    }
    res.json({ success: true, product: memoryProducts[idx], products: memoryProducts });
  } else {
    res.status(404).json({ success: false, message: "Product not found" });
  }
});

// Track deleted IDs across serverless invocations within container lifespan
let globalDeletedIds = new Set<string>();

// DELETE single product
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  globalDeletedIds.add(id);
  memoryProducts = memoryProducts.filter(p => !globalDeletedIds.has(p.id));
  memoryProducts = resequence(memoryProducts);

  if (pool) {
    try {
      await pool.query("DELETE FROM products WHERE id = ?", [id]);
    } catch (err) {
      console.error("TiDB delete error:", err);
    }
  }

  res.json({ success: true, message: "Product deleted successfully", products: memoryProducts });
});

// POST single delete product fallback
app.post("/api/products/delete/:id", async (req, res) => {
  const { id } = req.params;
  globalDeletedIds.add(id);
  memoryProducts = memoryProducts.filter(p => !globalDeletedIds.has(p.id));
  memoryProducts = resequence(memoryProducts);

  if (pool) {
    try {
      await pool.query("DELETE FROM products WHERE id = ?", [id]);
    } catch (err) {
      console.error("TiDB delete error:", err);
    }
  }

  res.json({ success: true, message: "Product deleted successfully", products: memoryProducts });
});

// GET categories
app.get("/api/categories", (_req, res) => {
  res.json({ success: true, categories: memoryCategories });
});

// POST add category
app.post("/api/categories", (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Category name is required" });
  }
  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name: name.trim(),
    sortOrder: memoryCategories.length + 1
  };
  memoryCategories.push(newCat);
  res.json({ success: true, category: newCat, categories: memoryCategories });
});

// PUT update category
app.put("/api/categories/:id", (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const idx = memoryCategories.findIndex(c => c.id === id);
  if (idx !== -1) {
    if (name && name.trim()) {
      memoryCategories[idx].name = name.trim();
    }
    res.json({ success: true, category: memoryCategories[idx], categories: memoryCategories });
  } else {
    res.status(404).json({ success: false, message: "Category not found" });
  }
});

// DELETE category
app.delete("/api/categories/:id", (req, res) => {
  const { id } = req.params;
  memoryCategories = memoryCategories.filter(c => c.id !== id);
  res.json({ success: true, categories: memoryCategories });
});

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
