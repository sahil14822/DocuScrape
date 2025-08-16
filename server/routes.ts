import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScrapeJobSchema } from "@shared/schema";
import puppeteer from "puppeteer";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const downloadsDir = path.join(__dirname, '..', 'downloads');

// Ensure downloads directory exists
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

async function scrapeWebsite(url: string): Promise<{ title: string; content: string }> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Extract content
    const result = await page.evaluate(() => {
      // Remove unwanted elements
      const unwantedSelectors = [
        'script', 'style', 'nav', 'header', 'footer', 
        '.advertisement', '.ads', '.sidebar', '.menu',
        '[class*="ad-"]', '[id*="ad-"]', '.social-media',
        '.cookie-banner', '.popup', '.modal'
      ];
      
      unwantedSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
      
      // Get title
      const title = document.title || document.querySelector('h1')?.textContent || 'Untitled';
      
      // Try to find main content area
      let contentElement = document.querySelector('main') ||
                          document.querySelector('article') ||
                          document.querySelector('[role="main"]') ||
                          document.querySelector('.content') ||
                          document.querySelector('#content') ||
                          document.body;
      
      // Extract structured content
      const extractContent = (element: Element): string => {
        let content = '';
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
          null
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text && text.length > 0) {
              content += text + ' ';
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            const tagName = el.tagName.toLowerCase();
            
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
              content += '\n\n' + el.textContent?.trim() + '\n';
            } else if (tagName === 'p') {
              content += '\n' + el.textContent?.trim() + '\n';
            } else if (['ul', 'ol'].includes(tagName)) {
              content += '\n';
            } else if (tagName === 'li') {
              content += '• ' + el.textContent?.trim() + '\n';
            }
          }
        }
        
        return content.replace(/\n{3,}/g, '\n\n').trim();
      };
      
      const content = extractContent(contentElement);
      
      return { title, content };
    });
    
    return result;
  } finally {
    await browser.close();
  }
}

async function generatePDF(title: string, content: string, url: string): Promise<{ filename: string; pages: number; fileSize: number }> {
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
  const filename = `${sanitizedTitle}.pdf`;
  const filepath = path.join(downloadsDir, filename);
  
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    
    // Header
    doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Source: ${url}`, { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);
    
    // Content
    doc.fontSize(12).font('Helvetica');
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        if (line.match(/^[A-Z][^.]*$/)) {
          // Likely a heading
          doc.fontSize(14).font('Helvetica-Bold').text(line.trim());
          doc.moveDown(0.5);
          doc.fontSize(12).font('Helvetica');
        } else {
          doc.text(line.trim(), { align: 'justify' });
          doc.moveDown(0.3);
        }
      } else {
        doc.moveDown(0.5);
      }
    }
    
    doc.end();
    
    stream.on('finish', () => {
      const stats = fs.statSync(filepath);
      const pages = Math.ceil(content.length / 3000); // Rough estimate
      resolve({
        filename,
        pages,
        fileSize: stats.size
      });
    });
    
    stream.on('error', reject);
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create scrape job
  app.post("/api/scrape", async (req, res) => {
    try {
      const validatedData = insertScrapeJobSchema.parse(req.body);
      const job = await storage.createScrapeJob(validatedData);
      
      res.json(job);
      
      // Process scraping in background
      processScrapingJob(job.id, validatedData.url, validatedData.format);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Get scrape job status
  app.get("/api/scrape/:id", async (req, res) => {
    try {
      const job = await storage.getScrapeJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Download file
  app.get("/api/download/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const filepath = path.join(downloadsDir, filename);
      
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.download(filepath, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }, 60000); // Delete after 1 minute
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get recent documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getRecentScrapeJobs(10);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processScrapingJob(jobId: string, url: string, format: string) {
  try {
    // Update status to processing
    await storage.updateScrapeJob(jobId, { 
      status: "processing", 
      progress: 10 
    });
    
    // Scrape website
    await storage.updateScrapeJob(jobId, { progress: 30 });
    const { title, content } = await scrapeWebsite(url);
    
    await storage.updateScrapeJob(jobId, { 
      title,
      progress: 60 
    });
    
    // Generate document (currently only PDF supported)
    await storage.updateScrapeJob(jobId, { progress: 80 });
    const { filename, pages, fileSize } = await generatePDF(title, content, url);
    
    // Complete job
    await storage.updateScrapeJob(jobId, {
      status: "completed",
      progress: 100,
      filename,
      pages,
      fileSize,
      completedAt: new Date()
    });
  } catch (error: any) {
    console.error('Scraping job failed:', error);
    await storage.updateScrapeJob(jobId, {
      status: "failed",
      error: error.message
    });
  }
}
