import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Product, Order, OrderStatus, Category } from "./src/types.js";

const app = express();
const PORT = 3000;

// Body parser
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

// Persistent DB File Path
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

interface DBData {
  products: Product[];
  orders: Order[];
  categories: Category[];
  adminPasswordHash?: string;
  settings?: { whatsappNumber: string };
}

const defaultCategories: Category[] = [
  { id: "cat-1", name: "Desk Calendar", sortOrder: 1 },
  { id: "cat-2", name: "Wall Calendar", sortOrder: 2 },
  { id: "cat-3", name: "Pocket Calendar", sortOrder: 3 },
  { id: "cat-4", name: "Premium Calendar", sortOrder: 4 },
  { id: "cat-5", name: "Office Calendar", sortOrder: 5 },
  { id: "cat-6", name: "Magnetic Calendar", sortOrder: 6 }
];

// Initial seed products
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

function initDB(): DBData {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DBData = {
      products: defaultProducts,
      orders: [
        {
          id: "ord-101",
          orderNumber: "ORD-2026-001",
          customerName: "Anand Kumar",
          mobileNumber: "9876543210",
          city: "Mumbai",
          items: [
            { productId: "prod-1", sno: 1, productName: "2026 Executive Desk Spiral Calendar", qty: 5, unitPrice: 150 },
            { productId: "prod-2", sno: 2, productName: "Classic 12-Sheet Wall Hanging Calendar", qty: 2, unitPrice: 180 }
          ],
          totalQty: 7,
          totalPrice: 1110,
          status: "Confirmed",
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      ],
      categories: defaultCategories
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }

  try {
    const fileContent = fs.readFileSync(DB_FILE, "utf-8");
    const data = JSON.parse(fileContent);
    if (!data.products) data.products = defaultProducts;
    if (!data.orders) data.orders = [];
    if (!data.categories) data.categories = defaultCategories;
    if (!data.settings) data.settings = { whatsappNumber: "9080917850" };
    return data;
  } catch (err) {
    console.error("Error reading DB file, creating fresh DB:", err);
    const initialData: DBData = { products: defaultProducts, orders: [], categories: defaultCategories, settings: { whatsappNumber: "9080917850" } };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
}

function writeDB(data: DBData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to DB file:", err);
  }
}

function resequenceProducts(products: Product[]): Product[] {
  // Sort by sortOrder
  products.sort((a, b) => a.sortOrder - b.sortOrder);
  return products.map((p, idx) => ({
    ...p,
    sno: idx + 1,
    sortOrder: idx + 1
  }));
}

// REST API ROUTES

// Admin Authentication
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "selvascreenuv@gmail.com" && password === "SelvaCalendar@@2026@@") {
    res.json({ success: true, token: "admin-session-token-2026" });
  } else {
    res.status(401).json({ success: false, message: "Invalid admin credentials." });
  }
});

// GET settings
app.get("/api/settings", (req, res) => {
  const db = initDB();
  res.json({ success: true, settings: db.settings });
});

// POST update settings
app.post("/api/settings", (req, res) => {
  const db = initDB();
  const { whatsappNumber } = req.body;
  if (whatsappNumber !== undefined) {
    db.settings = { whatsappNumber };
    writeDB(db);
  }
  res.json({ success: true, settings: db.settings });
});

// GET products
app.get("/api/products", (req, res) => {
  const db = initDB();
  const products = resequenceProducts(db.products);
  res.json({ success: true, products });
});

// POST add product
app.post("/api/products", (req, res) => {
  const db = initDB();
  const { name, price, imageUrl, enabled, description, category } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Product name is required" });
  }

  const nextSno = db.products.length + 1;
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

  db.products.push(newProduct);
  db.products = resequenceProducts(db.products);
  writeDB(db);

  res.json({ success: true, product: newProduct, products: db.products });
});

// PUT / POST edit product
const handleUpdateProduct = (req: express.Request, res: express.Response) => {
  const db = initDB();
  const { id } = req.params;
  const { name, price, imageUrl, enabled, description, category } = req.body;

  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  if (name !== undefined) db.products[index].name = name.trim();
  if (price !== undefined) db.products[index].price = Number(price);
  if (imageUrl !== undefined) db.products[index].imageUrl = imageUrl;
  if (enabled !== undefined) db.products[index].enabled = Boolean(enabled);
  if (description !== undefined) db.products[index].description = description;
  if (category !== undefined) db.products[index].category = category;

  db.products = resequenceProducts(db.products);
  writeDB(db);

  res.json({ success: true, product: db.products[index], products: db.products });
};

app.put("/api/products/:id", handleUpdateProduct);
app.post("/api/products/update/:id", handleUpdateProduct);

// POST toggle enable/disable product
app.post("/api/products/toggle/:id", (req, res) => {
  const db = initDB();
  const { id } = req.params;

  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  db.products[index].enabled = !db.products[index].enabled;
  writeDB(db);

  res.json({ success: true, product: db.products[index], products: db.products });
});

// DELETE bulk products
app.delete("/api/products/bulk", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: "No product IDs provided" });
  }

  const db = initDB();
  const initCount = db.products.length;
  db.products = db.products.filter((p) => !ids.includes(p.id));
  db.products = resequenceProducts(db.products);
  writeDB(db);

  res.json({
    success: true,
    message: `Successfully deleted ${initCount - db.products.length} products`,
    products: db.products,
  });
});

// POST bulk delete products fallback
app.post("/api/products/bulk-delete", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: "No product IDs provided" });
  }

  const db = initDB();
  const initCount = db.products.length;
  db.products = db.products.filter((p) => !ids.includes(p.id));
  db.products = resequenceProducts(db.products);
  writeDB(db);

  res.json({
    success: true,
    message: `Successfully deleted ${initCount - db.products.length} products`,
    products: db.products,
  });
});

// DELETE / POST single product
const handleDeleteSingleProduct = (req: express.Request, res: express.Response) => {
  const db = initDB();
  const { id } = req.params;

  const initialCount = db.products.length;
  db.products = db.products.filter(p => p.id !== id);

  if (db.products.length === initialCount) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  db.products = resequenceProducts(db.products);
  writeDB(db);

  res.json({ success: true, message: "Product deleted successfully", products: db.products });
};

app.delete("/api/products/:id", handleDeleteSingleProduct);
app.post("/api/products/delete/:id", handleDeleteSingleProduct);


app.post("/api/products/rearrange", (req, res) => {
  const db = initDB();
  const { productIds } = req.body;

  if (!Array.isArray(productIds)) {
    return res.status(400).json({ success: false, message: "productIds array is required" });
  }

  const map = new Map(db.products.map(p => [p.id, p]));
  const rearranged: Product[] = [];

  productIds.forEach((id, idx) => {
    const prod = map.get(id);
    if (prod) {
      prod.sortOrder = idx + 1;
      prod.sno = idx + 1;
      rearranged.push(prod);
      map.delete(id);
    }
  });

  // append any remaining products not listed
  map.forEach(prod => {
    const nextSort = rearranged.length + 1;
    prod.sortOrder = nextSort;
    prod.sno = nextSort;
    rearranged.push(prod);
  });

  db.products = rearranged;
  writeDB(db);

  res.json({ success: true, products: db.products });
});

// Bulk upload products
app.post("/api/products/bulk", (req, res) => {
  const db = initDB();
  const { products, replaceExisting } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ success: false, message: "No products provided in request" });
  }

  const newProds: Product[] = products.map((p, idx) => ({
    id: `prod-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
    sno: idx + 1,
    sortOrder: idx + 1,
    name: p.productName || p.name || `Calendar Product ${idx + 1}`,
    price: p.price ? Number(p.price) : 0,
    imageUrl: p.imageUrl || "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=300&q=80",
    enabled: p.enabled !== undefined ? (String(p.enabled).toLowerCase() !== "false" && String(p.enabled).toLowerCase() !== "disabled" && Boolean(p.enabled)) : true,
    description: p.description || "",
    category: p.category || "Calendar",
    createdAt: new Date().toISOString()
  }));

  if (replaceExisting) {
    db.products = newProds;
  } else {
    db.products = [...db.products, ...newProds];
  }

  db.products = resequenceProducts(db.products);
  writeDB(db);

  res.json({ success: true, message: `Successfully imported ${newProds.length} products`, products: db.products });
});

// GET categories
app.get("/api/categories", (req, res) => {
  const db = initDB();
  res.json({ success: true, categories: db.categories || [] });
});

// POST add category
app.post("/api/categories", (req, res) => {
  const db = initDB();
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Category name is required" });
  }

  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name: name.trim(),
    sortOrder: (db.categories ? db.categories.length : 0) + 1,
  };

  if (!db.categories) db.categories = [];
  db.categories.push(newCat);
  writeDB(db);

  res.json({ success: true, category: newCat, categories: db.categories });
});

// PUT / POST update category
const handleUpdateCategory = (req: express.Request, res: express.Response) => {
  const db = initDB();
  const { id } = req.params;
  const { name } = req.body;

  if (!db.categories) db.categories = [];
  const idx = db.categories.findIndex((c) => c.id === id);

  if (idx !== -1) {
    if (name && name.trim()) {
      const oldName = db.categories[idx].name;
      const newName = name.trim();
      db.categories[idx].name = newName;
      if (db.products && Array.isArray(db.products)) {
        db.products.forEach(p => {
          if (p.category === oldName) {
            p.category = newName;
          }
        });
      }
    }
    writeDB(db);
    res.json({ success: true, category: db.categories[idx], categories: db.categories });
  } else {
    res.status(404).json({ success: false, message: "Category not found" });
  }
};

app.put("/api/categories/:id", handleUpdateCategory);
app.post("/api/categories/update/:id", handleUpdateCategory);

// DELETE / POST delete category
const handleDeleteCategory = (req: express.Request, res: express.Response) => {
  const db = initDB();
  const { id } = req.params;

  if (!db.categories) db.categories = [];
  db.categories = db.categories.filter((c) => c.id !== id);
  writeDB(db);

  res.json({ success: true, categories: db.categories });
};

app.delete("/api/categories/:id", handleDeleteCategory);
app.post("/api/categories/delete/:id", handleDeleteCategory);

// GET orders
app.get("/api/orders", (req, res) => {
  const db = initDB();
  db.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, orders: db.orders });
});

// POST create order
app.post("/api/orders", (req, res) => {
  const db = initDB();
  const { customerName, mobileNumber, city, items, notes } = req.body;

  if (!customerName || !customerName.trim()) {
    return res.status(400).json({ success: false, message: "Customer Name is required" });
  }
  if (!mobileNumber || !mobileNumber.trim()) {
    return res.status(400).json({ success: false, message: "Mobile Number is required" });
  }
  if (!city || !city.trim()) {
    return res.status(400).json({ success: false, message: "Place/City is required" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Please select at least one product with quantity > 0" });
  }

  const validItems = items.filter((i: any) => i.qty && Number(i.qty) > 0);
  if (validItems.length === 0) {
    return res.status(400).json({ success: false, message: "Product quantity must be greater than 0" });
  }

  const totalQty = validItems.reduce((acc: number, item: any) => acc + Number(item.qty), 0);
  const totalPrice = validItems.reduce((acc: number, item: any) => acc + (Number(item.qty) * (Number(item.unitPrice) || 0)), 0);

  const orderNum = `ORD-${new Date().getFullYear()}-${String(db.orders.length + 1).padStart(3, '0')}`;

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber: orderNum,
    customerName: customerName.trim(),
    mobileNumber: mobileNumber.trim(),
    city: city.trim(),
    items: validItems.map((item: any, idx: number) => ({
      productId: item.productId,
      sno: item.sno || idx + 1,
      productName: item.productName,
      qty: Number(item.qty),
      unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined,
      imageUrl: item.imageUrl
    })),
    totalQty,
    totalPrice: totalPrice > 0 ? totalPrice : undefined,
    status: "Pending",
    createdAt: new Date().toISOString(),
    notes: notes || ""
  };

  db.orders.unshift(newOrder);
  writeDB(db);

  res.json({ success: true, order: newOrder, message: "Order placed successfully!" });
});

// PUT update order status
app.put("/api/orders/:id/status", (req, res) => {
  const db = initDB();
  const { id } = req.params;
  const { status } = req.body;

  const order = db.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const validStatuses: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid order status" });
  }

  order.status = status;
  writeDB(db);

  res.json({ success: true, order, orders: db.orders });
});

// DELETE order
app.delete("/api/orders/:id", (req, res) => {
  const db = initDB();
  const { id } = req.params;

  const initialLength = db.orders.length;
  db.orders = db.orders.filter(o => o.id !== id);

  if (db.orders.length === initialLength) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  writeDB(db);
  res.json({ success: true, message: "Order deleted successfully", orders: db.orders });
});

// MEDIA ROUTES
const MEDIA_DIR = path.join(process.cwd(), "Public", "media");

app.get("/api/media", (req, res) => {
  try {
    if (!fs.existsSync(MEDIA_DIR)) {
      fs.mkdirSync(MEDIA_DIR, { recursive: true });
    }
    const files = fs.readdirSync(MEDIA_DIR);
    // Filter only images
    const images = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)).map(f => ({
      name: f,
      url: `/media/${f}`
    }));
    // Sort by modified time descending
    images.sort((a, b) => {
      return fs.statSync(path.join(MEDIA_DIR, b.name)).mtimeMs - fs.statSync(path.join(MEDIA_DIR, a.name)).mtimeMs;
    });
    res.json({ success: true, media: images });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error reading media directory" });
  }
});

app.post("/api/media", (req, res) => {
  try {
    const { filename, base64 } = req.body;
    if (!filename || !base64) {
      return res.status(400).json({ success: false, message: "Filename and base64 string are required" });
    }

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

app.delete("/api/media/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename); // Prevent directory traversal
    
    // Protect logo from being deleted
    if (safeFilename.toLowerCase().includes('logo')) {
      return res.status(403).json({ success: false, message: "System logo files cannot be deleted" });
    }

    const filePath = path.join(MEDIA_DIR, safeFilename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: "Image deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "Image not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting image" });
  }
});

app.post("/api/media/bulk-delete", (req, res) => {
  try {
    const { filenames } = req.body;
    if (!Array.isArray(filenames)) {
      return res.status(400).json({ success: false, message: "Filenames array is required" });
    }

    let deletedCount = 0;
    for (const filename of filenames) {
      const safeFilename = path.basename(filename);
      
      // Protect logo from being deleted in bulk
      if (safeFilename.toLowerCase().includes('logo')) {
        continue;
      }

      const filePath = path.join(MEDIA_DIR, safeFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    res.json({ success: true, message: `Successfully deleted ${deletedCount} images` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error bulk deleting images" });
  }
});

// VITE OR STATIC MIDDLEWARE
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Calendar Order Portal running on http://localhost:${PORT}`);
  });
}

startServer();
