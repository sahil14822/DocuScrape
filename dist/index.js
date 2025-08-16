// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  scrapeJobs;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.scrapeJobs = /* @__PURE__ */ new Map();
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async createScrapeJob(insertJob) {
    const id = randomUUID();
    const job = {
      ...insertJob,
      id,
      status: "pending",
      progress: 0,
      title: null,
      filename: null,
      fileSize: null,
      pages: null,
      error: null,
      createdAt: /* @__PURE__ */ new Date(),
      completedAt: null
    };
    this.scrapeJobs.set(id, job);
    return job;
  }
  async getScrapeJob(id) {
    return this.scrapeJobs.get(id);
  }
  async updateScrapeJob(id, updates) {
    const existing = this.scrapeJobs.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...updates };
    this.scrapeJobs.set(id, updated);
    return updated;
  }
  async getRecentScrapeJobs(limit = 10) {
    return Array.from(this.scrapeJobs.values()).filter((job) => job.status === "completed").sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)).slice(0, limit);
  }
  async deleteScrapeJob(id) {
    return this.scrapeJobs.delete(id);
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var scrapeJobs = pgTable("scrape_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  status: text("status").notNull(),
  // 'pending', 'processing', 'completed', 'failed'
  format: text("format").notNull(),
  // 'pdf', 'docx'
  progress: integer("progress").default(0),
  title: text("title"),
  filename: text("filename"),
  fileSize: integer("file_size"),
  pages: integer("pages"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at")
});
var insertScrapeJobSchema = createInsertSchema(scrapeJobs).pick({
  url: true,
  format: true
}).extend({
  url: z.string().url("Please enter a valid URL"),
  format: z.enum(["pdf", "docx"])
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});

// server/routes.ts
import puppeteer from "puppeteer";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var downloadsDir = path.join(__dirname, "..", "downloads");
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}
async function scrapeWebsite(url) {
  console.log("Starting scrape for URL:", url);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    console.log("Navigating to URL...");
    await page.goto(url, { waitUntil: "networkidle0", timeout: 3e4 });
    console.log("Page loaded successfully");
    console.log("Starting page evaluation...");
    const result = await page.evaluate(() => {
      try {
        const title = document.title || "Untitled";
        const body = document.body;
        if (!body) {
          return { title, content: "No body element found" };
        }
        const content = body.innerText || body.textContent || "No content found";
        return { title, content: content.substring(0, 5e3) };
      } catch (error) {
        return { title: "Error", content: "Error in page evaluation: " + error.message };
      }
    });
    console.log("Page evaluation completed successfully");
    return result;
  } catch (error) {
    console.error("Error in scrapeWebsite:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
async function generatePDF(title, content, url) {
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_");
  const filename = `${sanitizedTitle}.pdf`;
  const filepath = path.join(downloadsDir, filename);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    doc.fontSize(20).font("Helvetica-Bold").text(title, { align: "center" });
    doc.moveDown();
    doc.fontSize(10).font("Helvetica").text(`Source: ${url}`, { align: "center" });
    doc.fontSize(10).text(`Generated: ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`, { align: "center" });
    doc.moveDown(2);
    doc.fontSize(12).font("Helvetica");
    const lines = content.split("\n");
    for (const line of lines) {
      if (line.trim()) {
        if (line.match(/^[A-Z][^.]*$/)) {
          doc.fontSize(14).font("Helvetica-Bold").text(line.trim());
          doc.moveDown(0.5);
          doc.fontSize(12).font("Helvetica");
        } else {
          doc.text(line.trim(), { align: "justify" });
          doc.moveDown(0.3);
        }
      } else {
        doc.moveDown(0.5);
      }
    }
    doc.end();
    stream.on("finish", () => {
      const stats = fs.statSync(filepath);
      const pages = Math.ceil(content.length / 3e3);
      resolve({
        filename,
        pages,
        fileSize: stats.size
      });
    });
    stream.on("error", reject);
  });
}
async function registerRoutes(app2) {
  app2.post("/api/scrape", async (req, res) => {
    try {
      const validatedData = insertScrapeJobSchema.parse(req.body);
      const job = await storage.createScrapeJob(validatedData);
      res.json(job);
      processScrapingJob(job.id, validatedData.url, validatedData.format);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/scrape/:id", async (req, res) => {
    try {
      const job = await storage.getScrapeJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/download/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const filepath = path.join(downloadsDir, filename);
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ message: "File not found" });
      }
      res.download(filepath, (err) => {
        if (err) {
          console.error("Download error:", err);
        }
        setTimeout(() => {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }, 6e4);
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getRecentScrapeJobs(10);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.delete("/api/documents/:id", async (req, res) => {
    try {
      const job = await storage.getScrapeJob(req.params.id);
      if (job?.filename) {
        const filepath = path.join(downloadsDir, job.filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }
      const deleted = await storage.deleteScrapeJob(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
async function processScrapingJob(jobId, url, format) {
  try {
    await storage.updateScrapeJob(jobId, {
      status: "processing",
      progress: 10
    });
    await storage.updateScrapeJob(jobId, { progress: 30 });
    const { title, content } = await scrapeWebsite(url);
    await storage.updateScrapeJob(jobId, {
      title,
      progress: 60
    });
    await storage.updateScrapeJob(jobId, { progress: 80 });
    const { filename, pages, fileSize } = await generatePDF(title, content, url);
    await storage.updateScrapeJob(jobId, {
      status: "completed",
      progress: 100,
      filename,
      pages,
      fileSize,
      completedAt: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    console.error("Scraping job failed:", error);
    await storage.updateScrapeJob(jobId, {
      status: "failed",
      error: error.message
    });
  }
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = process.env.PORT || 3e3;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();
