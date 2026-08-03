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
  {
    id: "prod-1",
    sno: 1,
    sortOrder: 1,
    name: "2026 Executive Desk Spiral Calendar",
    price: 150,
    imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=300&q=80",
    enabled: true,
    description: "High quality 12-month desk calendar with sturdy spiral binding and sleek stand.",
    category: "Desk Calendar",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-2",
    sno: 2,
    sortOrder: 2,
    name: "Classic 12-Sheet Wall Hanging Calendar",
    price: 180,
    imageUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=300&q=80",
    enabled: true,
    description: "Vibrant large format monthly wall calendar printed on 200 GSM art paper.",
    category: "Wall Calendar",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-3",
    sno: 3,
    sortOrder: 3,
    name: "Landscape Scenic Photo Wall Calendar",
    price: 220,
    imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=300&q=80",
    enabled: true,
    description: "Breathtaking natural landscape photos for every month with spacious date grids.",
    category: "Wall Calendar",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-4",
    sno: 4,
    sortOrder: 4,
    name: "Wooden Base Desk Block Calendar",
    price: 250,
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80",
    enabled: true,
    description: "Eco-friendly solid wood base with interchangeable monthly calendar cards.",
    category: "Premium Calendar",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-5",
    sno: 5,
    sortOrder: 5,
    name: "Mini Pocket Planner Calendar 2026",
    price: 90,
    imageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=300&q=80",
    enabled: true,
    description: "Compact pocket-sized monthly organizer calendar with faux leather cover.",
    category: "Pocket Calendar",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-6",
    sno: 6,
    sortOrder: 6,
    name: "Tri-Fold Commercial 3-Month View Calendar",
    price: 200,
    imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=300&q=80",
    enabled: true,
    description: "Ideal for corporate offices with past, present, and next month visible simultaneously.",
    category: "Office Calendar",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-7",
    sno: 7,
    sortOrder: 7,
    name: "Magnetic Refrigerator Calendar Board",
    price: 160,
    imageUrl: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=300&q=80",
    enabled: true,
    description: "Full magnetic backing calendar sheet for home kitchens and dry-erase notes.",
    category: "Magnetic Calendar",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-8",
    sno: 8,
    sortOrder: 8,
    name: "Acrylic Stand Luxury Tabletop Calendar",
    price: 280,
    imageUrl: "https://images.unsplash.com/photo-1518057111178-44a106bad636?auto=format&fit=crop&w=300&q=80",
    enabled: true,
    description: "Crystal clear acrylic frame holding 12 gold-foiled monthly calendar inserts.",
    category: "Premium Calendar",
    createdAt: new Date().toISOString()
  }
];

let memoryProducts: Product[] = [];
let memoryOrders: Order[] = [];
let memoryCategories: Category[] = [...defaultCategories];
let memorySettings = { whatsappNumber: "9080917850" };
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

  if (memoryProducts.length === 0 && defaultProducts.length > 0) {
    memoryProducts = [...defaultProducts];
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

    // Check count
    const [rows]: any = await pool.query("SELECT COUNT(*) as count FROM products");
    if (rows && rows[0] && rows[0].count === 0) {
      // Seed default products ONCE
      for (const p of defaultProducts) {
        await pool.query(
          "INSERT IGNORE INTO products (id, sno, sortOrder, name, price, imageUrl, enabled, description, category, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [p.id, p.sno, p.sortOrder, p.name, p.price, p.imageUrl, p.enabled ? 1 : 0, p.description, p.category, p.createdAt]
        );
      }
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
app.delete("/api/products/bulk", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: "No product IDs provided" });
  }

  ids.forEach((id: string) => globalDeletedIds.add(id));
  const initCount = memoryProducts.length;
  memoryProducts = memoryProducts.filter(p => !ids.includes(p.id));
  memoryProducts = resequence(memoryProducts);

  if (pool) {
    try {
      const placeholders = ids.map(() => "?").join(",");
      await pool.query(`DELETE FROM products WHERE id IN (${placeholders})`, ids);
    } catch (err) {
      console.error("TiDB bulk delete error:", err);
    }
  }

  res.json({ success: true, message: `Successfully deleted ${initCount - memoryProducts.length} products`, products: memoryProducts });
});

// POST bulk delete products (for platforms/proxies that struggle with DELETE body)
app.post("/api/products/bulk-delete", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: "No product IDs provided" });
  }

  ids.forEach((id: string) => globalDeletedIds.add(id));
  const initCount = memoryProducts.length;
  memoryProducts = memoryProducts.filter(p => !ids.includes(p.id));
  memoryProducts = resequence(memoryProducts);

  if (pool) {
    try {
      const placeholders = ids.map(() => "?").join(",");
      await pool.query(`DELETE FROM products WHERE id IN (${placeholders})`, ids);
    } catch (err) {
      console.error("TiDB bulk delete error:", err);
    }
  }

  res.json({ success: true, message: `Successfully deleted ${initCount - memoryProducts.length} products`, products: memoryProducts });
});

// DELETE single product
const handleDeleteProductApi = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  globalDeletedIds.add(id);
  memoryProducts = memoryProducts.filter(p => p.id !== id);

  if (pool) {
    try {
      await pool.query("DELETE FROM products WHERE id = ?", [id]);
    } catch (err) {
      console.error("TiDB delete error:", err);
    }
  }

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

    const [rows]: any = await pool.query("SELECT COUNT(*) as count FROM categories");
    if (rows && rows[0] && rows[0].count === 0) {
      for (const cat of defaultCategories) {
        await pool.query(
          "INSERT IGNORE INTO categories (id, name, sortOrder) VALUES (?, ?, ?)",
          [cat.id, cat.name, cat.sortOrder]
        );
      }
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
      if (rows && Array.isArray(rows) && rows.length > 0) {
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

  if (memoryCategories.length === 0 && defaultCategories.length > 0) {
    memoryCategories = [...defaultCategories];
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
