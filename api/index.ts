import express from "express";
import fs from "fs";
import path from "path";
import { Product, Order, Category } from "../src/types.js";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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
    imageUrl: "/media/image101.jpeg",
    enabled: true,
    description: "High quality daily desk calendar with metallic stand and planner notes.",
    category: "Desk Calendar",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-2",
    sno: 2,
    sortOrder: 2,
    name: "Classic 12-Sheet Wall Hanging Calendar",
    price: 180,
    imageUrl: "/media/image102.jpeg",
    enabled: true,
    description: "Traditional portrait wall calendar with auspicious thithi & star details.",
    category: "Wall Calendar",
    createdAt: new Date().toISOString()
  }
];

// In-memory fallback if TiDB env not provided
let memoryProducts: Product[] = [...defaultProducts];
let memoryOrders: Order[] = [];
let memoryCategories: Category[] = [...defaultCategories];
let memorySettings = { whatsappNumber: "9080917850" };

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
app.get("/api/settings", (_req, res) => {
  res.json({ success: true, settings: memorySettings });
});

// POST update settings
app.post("/api/settings", (req, res) => {
  const { whatsappNumber } = req.body;
  if (whatsappNumber !== undefined) {
    memorySettings.whatsappNumber = whatsappNumber;
  }
  res.json({ success: true, settings: memorySettings });
});

// GET products
app.get("/api/products", (_req, res) => {
  res.json({ success: true, products: memoryProducts });
});

// POST add product
app.post("/api/products", (req, res) => {
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
  res.json({ success: true, product: newProduct });
});

// PUT update product
app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const idx = memoryProducts.findIndex(p => p.id === id);
  if (idx !== -1) {
    memoryProducts[idx] = { ...memoryProducts[idx], ...req.body };
    res.json({ success: true, product: memoryProducts[idx] });
  } else {
    res.status(404).json({ success: false, message: "Product not found" });
  }
});

// DELETE product
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  memoryProducts = memoryProducts.filter(p => p.id !== id);
  res.json({ success: true });
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
  res.json({ success: true, category: newCat });
});

// DELETE category
app.delete("/api/categories/:id", (req, res) => {
  const { id } = req.params;
  memoryCategories = memoryCategories.filter(c => c.id !== id);
  res.json({ success: true });
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
