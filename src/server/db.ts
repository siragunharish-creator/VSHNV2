import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initialWebsiteContent } from './defaultData.ts';
import { WebsiteContent, ContactSubmission, ActivityLog } from '../shared/types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const DRAFT_FILE = path.join(DATA_DIR, 'draft.json');
const ENQUIRIES_FILE = path.join(DATA_DIR, 'enquiries.json');
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure public/uploads folder exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Hash password with salt
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Initialize Auth
interface StoredAuth {
  username: string;
  salt: string;
  passwordHash: string;
  updatedAt: string;
}

function initAuth(): StoredAuth {
  if (fs.existsSync(AUTH_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
      if (data.username && data.passwordHash) return data;
    } catch {
      // Fallback to default
    }
  }

  const defaultUser = process.env.ADMIN_USERNAME || 'harish';
  const defaultPass = process.env.ADMIN_PASSWORD || 'vshn1996';
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(defaultPass, salt);

  const authData: StoredAuth = {
    username: defaultUser,
    salt,
    passwordHash,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2));
  return authData;
}

// In-memory active tokens session store
const activeSessions = new Map<string, { username: string; expiresAt: number }>();

// Login rate limiting: 5 failed attempts per IP / window
const loginAttempts = new Map<string, { attempts: number; lockedUntil: number }>();

export class DatabaseService {
  private content: WebsiteContent;
  private draftContent: WebsiteContent | null = null;
  private enquiries: ContactSubmission[] = [];
  private activityLogs: ActivityLog[] = [];
  private authData: StoredAuth;

  constructor() {
    this.authData = initAuth();
    this.content = this.loadContent();
    this.draftContent = this.loadDraft();
    this.enquiries = this.loadEnquiries();
    this.activityLogs = this.loadActivity();
  }

  private loadContent(): WebsiteContent {
    if (fs.existsSync(CONTENT_FILE)) {
      try {
        const raw = fs.readFileSync(CONTENT_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading content file, falling back to defaults', err);
      }
    }
    // Save defaults
    this.saveContentDirect(initialWebsiteContent);
    return initialWebsiteContent;
  }

  private loadDraft(): WebsiteContent | null {
    if (fs.existsSync(DRAFT_FILE)) {
      try {
        const raw = fs.readFileSync(DRAFT_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading draft file', err);
      }
    }
    return null;
  }

  private loadEnquiries(): ContactSubmission[] {
    if (fs.existsSync(ENQUIRIES_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(ENQUIRIES_FILE, 'utf-8'));
      } catch (err) {
        console.error('Error reading enquiries', err);
      }
    }
    return [
      {
        id: 'enq-sample-1',
        name: 'K. Venkatesan',
        phone: '98401 23456',
        email: 'venkat.k@gmail.com',
        plotLocation: 'Kolathur, Chennai',
        serviceNeeded: 'Complete residential construction',
        estimatedSqFt: 2400,
        preferredPackage: 'Deluxe',
        message: 'Looking to construct a G+1 independent house on a 30x40 site. Need 2D plan and estimate.',
        status: 'new',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ];
  }

  private loadActivity(): ActivityLog[] {
    if (fs.existsSync(ACTIVITY_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf-8'));
      } catch {
        // empty
      }
    }
    return [
      {
        id: 'act-1',
        action: 'System Initialized',
        details: 'Initial VSHN Builders website packages and projects loaded',
        timestamp: new Date().toISOString(),
        user: 'system',
      },
    ];
  }

  private saveContentDirect(content: WebsiteContent): void {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
  }

  // Auth methods
  public verifyCredentials(username: string, pass: string, clientIp: string): { success: boolean; token?: string; error?: string } {
    const now = Date.now();
    const rate = loginAttempts.get(clientIp);
    if (rate && rate.lockedUntil > now) {
      const waitSeconds = Math.ceil((rate.lockedUntil - now) / 1000);
      return { success: false, error: `Too many failed attempts. Please try again in ${waitSeconds} seconds.` };
    }

    if (username !== this.authData.username) {
      this.recordFailedAttempt(clientIp);
      return { success: false, error: 'Invalid username or password.' };
    }

    const testHash = hashPassword(pass, this.authData.salt);
    if (testHash !== this.authData.passwordHash) {
      this.recordFailedAttempt(clientIp);
      return { success: false, error: 'Invalid username or password.' };
    }

    // Success: clear rate limit
    loginAttempts.delete(clientIp);

    // Create session token (valid 7 days)
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, {
      username,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
    });

    this.logActivity('Admin Login', `Admin ${username} signed in successfully`, username);
    return { success: true, token };
  }

  private recordFailedAttempt(clientIp: string) {
    const record = loginAttempts.get(clientIp) || { attempts: 0, lockedUntil: 0 };
    record.attempts += 1;
    if (record.attempts >= 5) {
      record.lockedUntil = Date.now() + 60 * 1000; // 1 min lock
      record.attempts = 0;
    }
    loginAttempts.set(clientIp, record);
  }

  public validateToken(token?: string): boolean {
    if (!token) return false;
    const session = activeSessions.get(token);
    if (!session) return false;
    if (session.expiresAt < Date.now()) {
      activeSessions.delete(token);
      return false;
    }
    return true;
  }

  public logout(token?: string): void {
    if (token) activeSessions.delete(token);
  }

  public changePassword(oldPass: string, newPass: string, token: string): { success: boolean; error?: string } {
    if (!this.validateToken(token)) {
      return { success: false, error: 'Unauthorized' };
    }
    const testHash = hashPassword(oldPass, this.authData.salt);
    if (testHash !== this.authData.passwordHash) {
      return { success: false, error: 'Current password is incorrect.' };
    }
    if (newPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(newPass, newSalt);

    this.authData = {
      ...this.authData,
      salt: newSalt,
      passwordHash: newHash,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(AUTH_FILE, JSON.stringify(this.authData, null, 2));
    this.logActivity('Password Changed', 'Administrator updated account password', this.authData.username);
    return { success: true };
  }

  // Public content getter (only published items)
  public getPublicContent(): WebsiteContent {
    return {
      settings: this.content.settings,
      projects: this.content.projects.filter(p => p.isPublished),
      services: this.content.services.filter(s => s.isPublished).sort((a, b) => a.order - b.order),
      packages: this.content.packages.filter(pkg => pkg.isPublished),
      testimonials: this.content.testimonials.filter(t => t.isPublished),
      mediaLibrary: this.content.mediaLibrary,
      faqs: this.content.faqs,
    };
  }

  // Admin content getter (all items, including drafts)
  public getAdminData(): {
    published: WebsiteContent;
    draft: WebsiteContent | null;
    enquiries: ContactSubmission[];
    activities: ActivityLog[];
  } {
    return {
      published: this.content,
      draft: this.draftContent,
      enquiries: this.enquiries,
      activities: this.activityLogs,
    };
  }

  // Save content
  public saveContent(content: WebsiteContent, isPublish: boolean, user: string): void {
    if (isPublish) {
      this.content = content;
      this.draftContent = null;
      this.saveContentDirect(this.content);
      if (fs.existsSync(DRAFT_FILE)) {
        try { fs.unlinkSync(DRAFT_FILE); } catch {}
      }
      this.logActivity('Website Published', 'Administrator published live changes to the website', user);
    } else {
      this.draftContent = content;
      fs.writeFileSync(DRAFT_FILE, JSON.stringify(content, null, 2));
      this.logActivity('Draft Saved', 'Administrator saved work in progress draft', user);
    }
  }

  // Add media item
  public addMedia(item: { url: string; title: string; altText: string; category: any; sizeBytes?: number }): void {
    const newItem = {
      id: 'med-' + Date.now(),
      ...item,
      uploadedAt: new Date().toISOString(),
    };
    this.content.mediaLibrary = [newItem, ...(this.content.mediaLibrary || [])];
    this.saveContentDirect(this.content);
    this.logActivity('Image Uploaded', `New image added: ${item.title || 'Untitled'}`, 'admin');
  }

  // Delete media item
  public deleteMedia(id: string): boolean {
    const before = this.content.mediaLibrary.length;
    this.content.mediaLibrary = this.content.mediaLibrary.filter(m => m.id !== id);
    if (this.draftContent) {
      this.draftContent.mediaLibrary = this.draftContent.mediaLibrary.filter(m => m.id !== id);
    }
    this.saveContentDirect(this.content);
    return this.content.mediaLibrary.length < before;
  }

  // Enquiries
  public addEnquiry(data: Omit<ContactSubmission, 'id' | 'createdAt' | 'status'>): ContactSubmission {
    const newEnq: ContactSubmission = {
      id: 'enq-' + Date.now(),
      ...data,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    this.enquiries = [newEnq, ...this.enquiries];
    fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify(this.enquiries, null, 2));
    this.logActivity('New Customer Enquiry', `Consultation request from ${data.name} (${data.phone})`, 'visitor');
    return newEnq;
  }

  public updateEnquiryStatus(id: string, status: 'new' | 'contacted' | 'resolved', notes?: string): boolean {
    const item = this.enquiries.find(e => e.id === id);
    if (!item) return false;
    item.status = status;
    if (notes !== undefined) item.adminNotes = notes;
    fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify(this.enquiries, null, 2));
    return true;
  }

  public deleteEnquiry(id: string): boolean {
    const before = this.enquiries.length;
    this.enquiries = this.enquiries.filter(e => e.id !== id);
    fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify(this.enquiries, null, 2));
    return this.enquiries.length < before;
  }

  // Reset to initial authentic demo data
  public resetToDefault(user: string): WebsiteContent {
    this.content = JSON.parse(JSON.stringify(initialWebsiteContent));
    this.draftContent = null;
    this.saveContentDirect(this.content);
    if (fs.existsSync(DRAFT_FILE)) {
      try { fs.unlinkSync(DRAFT_FILE); } catch {}
    }
    this.logActivity('Reset Website Data', 'Reset all content to official VSHN Builders defaults', user);
    return this.content;
  }

  public logActivity(action: string, details: string, user: string): void {
    const entry: ActivityLog = {
      id: 'act-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      action,
      details,
      timestamp: new Date().toISOString(),
      user,
    };
    this.activityLogs = [entry, ...this.activityLogs].slice(0, 100);
    try {
      fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(this.activityLogs, null, 2));
    } catch {}
  }
}

export const db = new DatabaseService();
