import { type User, type InsertUser, type ScrapeJob, type InsertScrapeJob } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createScrapeJob(job: InsertScrapeJob): Promise<ScrapeJob>;
  getScrapeJob(id: string): Promise<ScrapeJob | undefined>;
  updateScrapeJob(id: string, updates: Partial<ScrapeJob>): Promise<ScrapeJob | undefined>;
  getRecentScrapeJobs(limit?: number): Promise<ScrapeJob[]>;
  deleteScrapeJob(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private scrapeJobs: Map<string, ScrapeJob>;

  constructor() {
    this.users = new Map();
    this.scrapeJobs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createScrapeJob(insertJob: InsertScrapeJob): Promise<ScrapeJob> {
    const id = randomUUID();
    const job: ScrapeJob = {
      ...insertJob,
      id,
      status: "pending",
      progress: 0,
      title: null,
      filename: null,
      fileSize: null,
      pages: null,
      error: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.scrapeJobs.set(id, job);
    return job;
  }

  async getScrapeJob(id: string): Promise<ScrapeJob | undefined> {
    return this.scrapeJobs.get(id);
  }

  async updateScrapeJob(id: string, updates: Partial<ScrapeJob>): Promise<ScrapeJob | undefined> {
    const existing = this.scrapeJobs.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.scrapeJobs.set(id, updated);
    return updated;
  }

  async getRecentScrapeJobs(limit = 10): Promise<ScrapeJob[]> {
    return Array.from(this.scrapeJobs.values())
      .filter(job => job.status === 'completed')
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async deleteScrapeJob(id: string): Promise<boolean> {
    return this.scrapeJobs.delete(id);
  }
}

export const storage = new MemStorage();
