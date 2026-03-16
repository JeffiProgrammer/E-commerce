import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("supermarket.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en TEXT NOT NULL,
    name_de TEXT NOT NULL,
    name_fa TEXT NOT NULL,
    icon TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer'
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en TEXT NOT NULL,
    name_de TEXT NOT NULL,
    name_fa TEXT NOT NULL,
    description_en TEXT,
    description_de TEXT,
    description_fa TEXT,
    price REAL NOT NULL,
    image TEXT,
    stock INTEGER DEFAULT 0,
    categoryId INTEGER,
    FOREIGN KEY (categoryId) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cartId INTEGER,
    productId INTEGER,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (cartId) REFERENCES carts(id),
    FOREIGN KEY (productId) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER,
    userId INTEGER,
    userName TEXT,
    rating INTEGER,
    comment TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

// Migration: Add icon column to categories if it doesn't exist
try {
  db.prepare("SELECT icon FROM categories LIMIT 1").get();
} catch (e) {
  console.log("Adding icon column to categories table...");
  db.exec("ALTER TABLE categories ADD COLUMN icon TEXT");
}

// Seed Admin if not exists
const adminEmail = "admin@freshmart.com";
const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);
if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run("Admin", adminEmail, hashedPassword, "admin");
}

// Seed some categories and products if empty
const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get().count;
if (categoryCount === 0) {
  const cat1 = db.prepare("INSERT INTO categories (name_en, name_de, name_fa, icon) VALUES (?, ?, ?, ?)").run("Fruits", "Früchte", "میوه‌ها", "Apple").lastInsertRowid;
  const cat2 = db.prepare("INSERT INTO categories (name_en, name_de, name_fa, icon) VALUES (?, ?, ?, ?)").run("Vegetables", "Gemüse", "سبزیجات", "LeafyGreen").lastInsertRowid;
  const cat3 = db.prepare("INSERT INTO categories (name_en, name_de, name_fa, icon) VALUES (?, ?, ?, ?)").run("Dairy", "Milchprodukte", "لبنیات", "Milk").lastInsertRowid;
  const cat4 = db.prepare("INSERT INTO categories (name_en, name_de, name_fa, icon) VALUES (?, ?, ?, ?)").run("Bakery", "Bäckerei", "نانوایی", "Cookie").lastInsertRowid;
  const cat5 = db.prepare("INSERT INTO categories (name_en, name_de, name_fa, icon) VALUES (?, ?, ?, ?)").run("Meat", "Fleisch", "گوشت", "Drumstick").lastInsertRowid;
  
  db.prepare("INSERT INTO products (name_en, name_de, name_fa, description_en, description_de, description_fa, price, image, stock, categoryId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run("Apple", "Apfel", "سیب", "Fresh red apple", "Frischer roter Apfel", "سیب قرمز تازه", 1.5, "https://picsum.photos/seed/apple/400/300", 100, cat1);
  db.prepare("INSERT INTO products (name_en, name_de, name_fa, description_en, description_de, description_fa, price, image, stock, categoryId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run("Banana", "Banane", "موز", "Sweet yellow banana", "Süße gelbe Banane", "موز زرد شیرین", 0.8, "https://picsum.photos/seed/banana/400/300", 150, cat1);
  db.prepare("INSERT INTO products (name_en, name_de, name_fa, description_en, description_de, description_fa, price, image, stock, categoryId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run("Carrot", "Karotte", "هویج", "Crunchy orange carrot", "Knackige orange Karotte", "هویج نارنجی ترد", 0.5, "https://picsum.photos/seed/carrot/400/300", 200, cat2);
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

  app.use(cors());
  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    next();
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(name, email, hashedPassword, "customer");
      const user = { id: result.lastInsertRowid, name, email, role: "customer" };
      const token = jwt.sign(user, JWT_SECRET);
      res.json({ user, token });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign(userWithoutPassword, JWT_SECRET);
    res.json({ user: userWithoutPassword, token });
  });

  // Categories
  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.post("/api/categories", authenticate, isAdmin, (req, res) => {
    const { name_en, name_de, name_fa, icon } = req.body;
    const result = db.prepare("INSERT INTO categories (name_en, name_de, name_fa, icon) VALUES (?, ?, ?, ?)").run(name_en, name_de, name_fa, icon || 'LayoutGrid');
    res.json({ id: result.lastInsertRowid, name_en, name_de, name_fa, icon });
  });

  app.put("/api/categories/:id", authenticate, isAdmin, (req, res) => {
    const { name_en, name_de, name_fa, icon } = req.body;
    db.prepare("UPDATE categories SET name_en = ?, name_de = ?, name_fa = ?, icon = ? WHERE id = ?").run(name_en, name_de, name_fa, icon, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/categories/:id", authenticate, isAdmin, (req, res) => {
    db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Products
  app.get("/api/products", (req, res) => {
    const { categoryId } = req.query;
    let products;
    if (categoryId) {
      products = db.prepare("SELECT * FROM products WHERE categoryId = ?").all(categoryId);
    } else {
      products = db.prepare("SELECT * FROM products").all();
    }
    res.json(products);
  });

  app.get("/api/products/:id", (req, res) => {
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  });

  app.post("/api/products", authenticate, isAdmin, (req, res) => {
    const { name_en, name_de, name_fa, description_en, description_de, description_fa, price, image, stock, categoryId } = req.body;
    const result = db.prepare("INSERT INTO products (name_en, name_de, name_fa, description_en, description_de, description_fa, price, image, stock, categoryId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(name_en, name_de, name_fa, description_en, description_de, description_fa, price, image, stock, categoryId);
    res.json({ id: result.lastInsertRowid, ...req.body });
  });

  app.put("/api/products/:id", authenticate, isAdmin, (req, res) => {
    const { name_en, name_de, name_fa, description_en, description_de, description_fa, price, image, stock, categoryId } = req.body;
    db.prepare("UPDATE products SET name_en = ?, name_de = ?, name_fa = ?, description_en = ?, description_de = ?, description_fa = ?, price = ?, image = ?, stock = ?, categoryId = ? WHERE id = ?")
      .run(name_en, name_de, name_fa, description_en, description_de, description_fa, price, image, stock, categoryId, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", authenticate, isAdmin, (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Cart
  app.get("/api/cart", authenticate, (req: any, res: any) => {
    let cart = db.prepare("SELECT * FROM carts WHERE userId = ?").get(req.user.id);
    if (!cart) {
      const result = db.prepare("INSERT INTO carts (userId) VALUES (?)").run(req.user.id);
      cart = { id: result.lastInsertRowid, userId: req.user.id };
    }
    const items = db.prepare(`
      SELECT ci.*, p.name_en, p.name_de, p.name_fa, p.price, p.image 
      FROM cart_items ci 
      JOIN products p ON ci.productId = p.id 
      WHERE ci.cartId = ?
    `).all(cart.id);
    res.json({ cart, items });
  });

  app.post("/api/cart/items", authenticate, (req: any, res: any) => {
    const { productId, quantity } = req.body;
    let cart = db.prepare("SELECT * FROM carts WHERE userId = ?").get(req.user.id);
    if (!cart) {
      const result = db.prepare("INSERT INTO carts (userId) VALUES (?)").run(req.user.id);
      cart = { id: result.lastInsertRowid, userId: req.user.id };
    }
    
    const existing = db.prepare("SELECT * FROM cart_items WHERE cartId = ? AND productId = ?").get(cart.id, productId);
    if (existing) {
      db.prepare("UPDATE cart_items SET quantity = quantity + ? WHERE id = ?").run(quantity || 1, existing.id);
    } else {
      db.prepare("INSERT INTO cart_items (cartId, productId, quantity) VALUES (?, ?, ?)").run(cart.id, productId, quantity || 1);
    }
    res.json({ success: true });
  });

  app.put("/api/cart/items/:id", authenticate, (req, res) => {
    const { quantity } = req.body;
    if (quantity <= 0) {
      db.prepare("DELETE FROM cart_items WHERE id = ?").run(req.params.id);
    } else {
      db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(quantity, req.params.id);
    }
    res.json({ success: true });
  });

  app.delete("/api/cart/items/:id", authenticate, (req, res) => {
    db.prepare("DELETE FROM cart_items WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Reviews
  app.get("/api/products/:id/reviews", (req, res) => {
    const reviews = db.prepare("SELECT * FROM reviews WHERE productId = ? ORDER BY createdAt DESC").all(req.params.id);
    res.json(reviews);
  });

  app.post("/api/products/:id/reviews", authenticate, (req: any, res: any) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user.id;
    const userName = req.user.name;

    const result = db.prepare("INSERT INTO reviews (productId, userId, userName, rating, comment) VALUES (?, ?, ?, ?, ?)")
      .run(productId, userId, userName, rating, comment);
    
    res.json({ id: result.lastInsertRowid, productId, userId, userName, rating, comment, createdAt: new Date().toISOString() });
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
