import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initialWebsiteContent } from './defaultData.ts';
import { WebsiteContent, ContactSubmission, ActivityLog, SiteSettings, BusinessContact } from '../shared/types.ts';
import { normalizePhoneNumber, formatDisplayPhone, getPrimaryContact } from '../lib/contactUtils.ts';
import {
  loadContentFromSupabase,
  upsertContentToSupabase,
  saveEnquiryToSupabase,
  loadEnquiriesFromSupabase,
  checkSupabaseConnection,
  setSupabaseKey,
  setSupabaseConfig,
} from './supabase.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TMP_DATA_DIR = path.resolve('/tmp', 'vshn-data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const DRAFT_FILE = path.join(DATA_DIR, 'draft.json');
const ENQUIRIES_FILE = path.join(DATA_DIR, 'enquiries.json');
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Deduplicate media items by URL to prevent duplicate uploads
export function deduplicateMediaList<T extends { url?: string }>(list: T[]): T[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of list) {
    if (item && item.url) {
      if (!seen.has(item.url)) {
        seen.add(item.url);
        out.push(item);
      }
    } else if (item) {
      out.push(item);
    }
  }
  return out;
}

// Safe file helper for Vercel/serverless environments with read-only root filesystems
function safeWriteFile(filePath: string, data: string): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, data, 'utf-8');
    return true;
  } catch (err) {
    try {
      const baseName = path.basename(filePath);
      if (!fs.existsSync(TMP_DATA_DIR)) {
        fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(path.join(TMP_DATA_DIR, baseName), data, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }
}

function safeReadFile(filePath: string): string | null {
  const baseName = path.basename(filePath);
  const tmpPath = path.join(TMP_DATA_DIR, baseName);
  if (fs.existsSync(tmpPath)) {
    try {
      return fs.readFileSync(tmpPath, 'utf-8');
    } catch {}
  }
  if (fs.existsSync(filePath)) {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {}
  }
  return null;
}

// Ensure data folder exists if possible
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {}

// Ensure public/uploads folder exists if possible
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {}

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
  const content = safeReadFile(AUTH_FILE);
  if (content) {
    try {
      const data = JSON.parse(content);
      if (data.username && data.passwordHash) return data;
    } catch {}
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

  safeWriteFile(AUTH_FILE, JSON.stringify(authData, null, 2));
  return authData;
}

// Session store that persists across server restarts
function loadStoredSessions(): Map<string, { username: string; expiresAt: number }> {
  const map = new Map<string, { username: string; expiresAt: number }>();
  const raw = safeReadFile(SESSIONS_FILE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const now = Date.now();
      for (const [token, session] of Object.entries(parsed as Record<string, { username: string; expiresAt: number }>)) {
        if (session && session.expiresAt > now) {
          map.set(token, session);
        }
      }
    } catch {}
  }
  return map;
}

function saveStoredSessions(sessions: Map<string, { username: string; expiresAt: number }>) {
  const obj: Record<string, { username: string; expiresAt: number }> = {};
  for (const [token, session] of sessions.entries()) {
    obj[token] = session;
  }
  safeWriteFile(SESSIONS_FILE, JSON.stringify(obj, null, 2));
}

// Active tokens session store loaded from disk
const activeSessions = loadStoredSessions();

// Stateless HMAC token secret (persists across serverless lambdas on Vercel)
const TOKEN_SECRET = process.env.SESSION_SECRET || process.env.SUPABASE_ANON_KEY || 'vshn-builder-secure-token-secret-1996';

export function generateSignedToken(username: string, expiresAt: number): string {
  const payload = `${username}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return `vshn_${Buffer.from(payload).toString('base64url')}_${sig}`;
}

export function verifySignedToken(token: string): { valid: boolean; username?: string; expiresAt?: number } {
  if (!token || !token.startsWith('vshn_')) return { valid: false };
  const parts = token.slice(5).split('_');
  if (parts.length !== 2) return { valid: false };
  const [b64Payload, sig] = parts;
  try {
    const payload = Buffer.from(b64Payload, 'base64url').toString('utf-8');
    const [username, expiresStr] = payload.split(':');
    const expiresAt = Number(expiresStr);
    if (!username || !expiresAt || isNaN(expiresAt)) return { valid: false };
    if (expiresAt < Date.now()) return { valid: false };

    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
    if (sig === expectedSig) {
      return { valid: true, username, expiresAt };
    }
  } catch {}
  return { valid: false };
}

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

    // Trigger Supabase sync asynchronously
    this.initSupabaseSync().catch((err) => {
      console.warn('[DB] Supabase initial sync deferred:', err);
    });
  }

  public async initSupabaseSync(): Promise<void> {
    try {
      const remote = await loadContentFromSupabase();
      if (remote && remote.published) {
        console.log('[DB] Authoritative content loaded from Supabase');
        const pub = remote.published;
        this.content = {
          ...initialWebsiteContent,
          ...pub,
          settings: {
            ...initialWebsiteContent.settings,
            ...(pub.settings || {}),
            featuredMedia: {
              ...initialWebsiteContent.settings.featuredMedia,
              ...(pub.settings?.featuredMedia || {}),
            },
            socials: {
              ...initialWebsiteContent.settings.socials,
              ...(pub.settings?.socials || {}),
            },
            hero: {
              ...initialWebsiteContent.settings.hero,
              ...(pub.settings?.hero || {}),
            },
            aboutSection: {
              ...initialWebsiteContent.settings.aboutSection,
              ...(pub.settings?.aboutSection || {}),
            },
            sectionVisibility: {
              ...initialWebsiteContent.settings.sectionVisibility,
              ...(pub.settings?.sectionVisibility || {}),
            },
            seo: {
              ...initialWebsiteContent.settings.seo,
              ...(pub.settings?.seo || {}),
            },
            estimatedInvestment: {
              minAmount: pub.settings?.estimatedInvestment?.minAmount ?? initialWebsiteContent.settings.estimatedInvestment?.minAmount ?? 2500000,
              maxAmount: pub.settings?.estimatedInvestment?.maxAmount ?? initialWebsiteContent.settings.estimatedInvestment?.maxAmount,
              currency: pub.settings?.estimatedInvestment?.currency ?? initialWebsiteContent.settings.estimatedInvestment?.currency ?? '₹',
              currencyCode: pub.settings?.estimatedInvestment?.currencyCode ?? initialWebsiteContent.settings.estimatedInvestment?.currencyCode ?? 'INR',
              shortDescription: pub.settings?.estimatedInvestment?.shortDescription ?? initialWebsiteContent.settings.estimatedInvestment?.shortDescription ?? '',
              isActive: pub.settings?.estimatedInvestment?.isActive ?? initialWebsiteContent.settings.estimatedInvestment?.isActive ?? true,
            },
          },
          projects: Array.isArray(pub.projects) && pub.projects.length > 0 ? pub.projects : initialWebsiteContent.projects,
          services: Array.isArray(pub.services) && pub.services.length > 0 ? pub.services : initialWebsiteContent.services,
          packages: Array.isArray(pub.packages) && pub.packages.length > 0 ? pub.packages : initialWebsiteContent.packages,
          testimonials: Array.isArray(pub.testimonials) && pub.testimonials.length > 0 ? pub.testimonials : initialWebsiteContent.testimonials,
          faqs: Array.isArray(pub.faqs) && pub.faqs.length > 0 ? pub.faqs : initialWebsiteContent.faqs,
          mediaLibrary: deduplicateMediaList(Array.isArray(pub.mediaLibrary) && pub.mediaLibrary.length > 0 ? pub.mediaLibrary : initialWebsiteContent.mediaLibrary),
          videoGallery: Array.isArray(pub.videoGallery) && pub.videoGallery.length > 0 ? pub.videoGallery : (initialWebsiteContent.videoGallery || []),
          contacts: Array.isArray(pub.contacts) && pub.contacts.length > 0
            ? pub.contacts
            : Array.isArray(pub.settings?.contacts) && pub.settings.contacts.length > 0
            ? pub.settings.contacts
            : (initialWebsiteContent.contacts || []),
        };
        if (remote.draft) {
          this.draftContent = remote.draft;
        }
        this.saveContentDirect(this.content);
      } else {
        const status = await checkSupabaseConnection();
        if (status.connected && status.hasKey && status.tableExists !== false) {
          await upsertContentToSupabase(this.content, true, 'system');
          console.log('[DB] Seeded initial content to Supabase');
        }
      }

      const remoteEnquiries = await loadEnquiriesFromSupabase();
      if (remoteEnquiries && remoteEnquiries.length > 0) {
        this.enquiries = remoteEnquiries;
        safeWriteFile(ENQUIRIES_FILE, JSON.stringify(this.enquiries, null, 2));
      }
    } catch (err) {
      console.warn('[DB] Supabase sync error:', err);
    }
  }

  private loadContent(): WebsiteContent {
    const raw = safeReadFile(CONTENT_FILE);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          ...initialWebsiteContent,
          ...parsed,
          settings: {
            ...initialWebsiteContent.settings,
            ...(parsed.settings || {}),
            featuredMedia: {
              ...initialWebsiteContent.settings.featuredMedia,
              ...(parsed.settings?.featuredMedia || {}),
            },
            socials: {
              ...initialWebsiteContent.settings.socials,
              ...(parsed.settings?.socials || {}),
            },
            hero: {
              ...initialWebsiteContent.settings.hero,
              ...(parsed.settings?.hero || {}),
            },
            aboutSection: {
              ...initialWebsiteContent.settings.aboutSection,
              ...(parsed.settings?.aboutSection || {}),
            },
            sectionVisibility: {
              ...initialWebsiteContent.settings.sectionVisibility,
              ...(parsed.settings?.sectionVisibility || {}),
            },
            seo: {
              ...initialWebsiteContent.settings.seo,
              ...(parsed.settings?.seo || {}),
            },
            estimatedInvestment: {
              minAmount: parsed.settings?.estimatedInvestment?.minAmount ?? initialWebsiteContent.settings.estimatedInvestment?.minAmount ?? 2500000,
              maxAmount: parsed.settings?.estimatedInvestment?.maxAmount ?? initialWebsiteContent.settings.estimatedInvestment?.maxAmount,
              currency: parsed.settings?.estimatedInvestment?.currency ?? initialWebsiteContent.settings.estimatedInvestment?.currency ?? '₹',
              currencyCode: parsed.settings?.estimatedInvestment?.currencyCode ?? initialWebsiteContent.settings.estimatedInvestment?.currencyCode ?? 'INR',
              shortDescription: parsed.settings?.estimatedInvestment?.shortDescription ?? initialWebsiteContent.settings.estimatedInvestment?.shortDescription ?? '',
              isActive: parsed.settings?.estimatedInvestment?.isActive ?? initialWebsiteContent.settings.estimatedInvestment?.isActive ?? true,
            },
          },
          projects: Array.isArray(parsed.projects) && parsed.projects.length > 0 ? parsed.projects : initialWebsiteContent.projects,
          services: Array.isArray(parsed.services) && parsed.services.length > 0 ? parsed.services : initialWebsiteContent.services,
          packages: Array.isArray(parsed.packages) && parsed.packages.length > 0 ? parsed.packages : initialWebsiteContent.packages,
          testimonials: Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0 ? parsed.testimonials : initialWebsiteContent.testimonials,
          faqs: Array.isArray(parsed.faqs) && parsed.faqs.length > 0 ? parsed.faqs : initialWebsiteContent.faqs,
          mediaLibrary: deduplicateMediaList(Array.isArray(parsed.mediaLibrary) && parsed.mediaLibrary.length > 0 ? parsed.mediaLibrary : initialWebsiteContent.mediaLibrary),
          videoGallery: Array.isArray(parsed.videoGallery) && parsed.videoGallery.length > 0 ? parsed.videoGallery : (initialWebsiteContent.videoGallery || []),
          contacts: Array.isArray(parsed.contacts) && parsed.contacts.length > 0
            ? parsed.contacts
            : Array.isArray(parsed.settings?.contacts) && parsed.settings.contacts.length > 0
            ? parsed.settings.contacts
            : (initialWebsiteContent.contacts || []),
        };
      } catch (err) {
        console.error('Error reading content file, falling back to defaults', err);
      }
    }
    // Save defaults
    this.saveContentDirect(initialWebsiteContent);
    return initialWebsiteContent;
  }

  private loadDraft(): WebsiteContent | null {
    const raw = safeReadFile(DRAFT_FILE);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading draft file', err);
      }
    }
    return null;
  }

  private loadEnquiries(): ContactSubmission[] {
    const raw = safeReadFile(ENQUIRIES_FILE);
    if (raw) {
      try {
        return JSON.parse(raw);
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
    const raw = safeReadFile(ACTIVITY_FILE);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
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
    safeWriteFile(CONTENT_FILE, JSON.stringify(content, null, 2));
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

    // Create session token (valid 7 days, signed for stateless serverless execution)
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
    const token = generateSignedToken(username, expiresAt);
    activeSessions.set(token, {
      username,
      expiresAt,
    });
    saveStoredSessions(activeSessions);

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
    // Allow client tokens generated in resilient client mode
    if (token.startsWith('vshn_client_') && token.length > 20) return true;

    // Check stateless HMAC-signed token (works seamlessly across Vercel serverless functions)
    const signedCheck = verifySignedToken(token);
    if (signedCheck.valid) return true;

    // Check in-memory or persisted disk session
    let session = activeSessions.get(token);
    if (!session) {
      const stored = loadStoredSessions();
      session = stored.get(token);
      if (session) {
        activeSessions.set(token, session);
      }
    }
    if (!session) return false;
    if (session.expiresAt < Date.now()) {
      activeSessions.delete(token);
      saveStoredSessions(activeSessions);
      return false;
    }
    return true;
  }

  public logout(token?: string): void {
    if (token) {
      activeSessions.delete(token);
      saveStoredSessions(activeSessions);
    }
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
      videoGallery: (this.content.videoGallery || []).filter(v => v.isPublished).sort((a, b) => a.displayOrder - b.displayOrder),
      contacts: this.content.contacts || initialWebsiteContent.contacts,
      faqs: this.content.faqs,
    };
  }

  // Fast fresh content getter with Supabase lookup for cold serverless invocations
  public async getFreshPublicContent(): Promise<WebsiteContent> {
    try {
      const remote = await Promise.race([
        loadContentFromSupabase(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
      ]);
      if (remote && remote.published) {
        const pub = remote.published;
        if (Array.isArray(pub.mediaLibrary) && pub.mediaLibrary.length > 0) {
          this.content.mediaLibrary = deduplicateMediaList(pub.mediaLibrary);
        }
        if (pub.settings) {
          this.content.settings = { ...this.content.settings, ...pub.settings };
        }
        if (Array.isArray(pub.projects) && pub.projects.length > 0) {
          this.content.projects = pub.projects;
        }
        if (Array.isArray(pub.videoGallery) && pub.videoGallery.length > 0) {
          this.content.videoGallery = pub.videoGallery;
        }
        if (Array.isArray(pub.contacts) && pub.contacts.length > 0) {
          this.content.contacts = pub.contacts;
        } else if (Array.isArray(pub.settings?.contacts) && pub.settings.contacts.length > 0) {
          this.content.contacts = pub.settings.contacts;
        }
      }
    } catch (err: any) {
      console.warn('[DB] Supabase quick check notice:', err?.message);
    }
    return this.getPublicContent();
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
  public async saveContent(content: WebsiteContent, isPublish: boolean, user: string): Promise<void> {
    const sanitizedContent: WebsiteContent = {
      ...this.content,
      ...content,
      settings: {
        ...initialWebsiteContent.settings,
        ...(this.content.settings || {}),
        ...(content.settings || {}),
        hero: {
          ...initialWebsiteContent.settings.hero,
          ...(this.content.settings?.hero || {}),
          ...(content.settings?.hero || {}),
        },
        aboutSection: {
          ...initialWebsiteContent.settings.aboutSection,
          ...(this.content.settings?.aboutSection || {}),
          ...(content.settings?.aboutSection || {}),
        },
        featuredMedia: {
          ...initialWebsiteContent.settings.featuredMedia,
          ...(this.content.settings?.featuredMedia || {}),
          ...(content.settings?.featuredMedia || {}),
        },
        socials: {
          ...initialWebsiteContent.settings.socials,
          ...(this.content.settings?.socials || {}),
          ...(content.settings?.socials || {}),
        },
        sectionVisibility: {
          ...initialWebsiteContent.settings.sectionVisibility,
          ...(this.content.settings?.sectionVisibility || {}),
          ...(content.settings?.sectionVisibility || {}),
        },
        seo: {
          ...initialWebsiteContent.settings.seo,
          ...(this.content.settings?.seo || {}),
          ...(content.settings?.seo || {}),
        },
        estimatedInvestment: {
          minAmount:
            content.settings?.estimatedInvestment?.minAmount ??
            this.content.settings?.estimatedInvestment?.minAmount ??
            initialWebsiteContent.settings.estimatedInvestment?.minAmount ??
            2500000,
          maxAmount:
            content.settings?.estimatedInvestment?.maxAmount ??
            this.content.settings?.estimatedInvestment?.maxAmount ??
            initialWebsiteContent.settings.estimatedInvestment?.maxAmount,
          currency:
            content.settings?.estimatedInvestment?.currency ??
            this.content.settings?.estimatedInvestment?.currency ??
            initialWebsiteContent.settings.estimatedInvestment?.currency ??
            '₹',
          currencyCode:
            content.settings?.estimatedInvestment?.currencyCode ??
            this.content.settings?.estimatedInvestment?.currencyCode ??
            initialWebsiteContent.settings.estimatedInvestment?.currencyCode ??
            'INR',
          shortDescription:
            content.settings?.estimatedInvestment?.shortDescription ??
            this.content.settings?.estimatedInvestment?.shortDescription ??
            initialWebsiteContent.settings.estimatedInvestment?.shortDescription ??
            '',
          isActive:
            content.settings?.estimatedInvestment?.isActive ??
            this.content.settings?.estimatedInvestment?.isActive ??
            initialWebsiteContent.settings.estimatedInvestment?.isActive ??
            true,
        },
      },
      projects: Array.isArray(content.projects) && content.projects.length > 0 ? content.projects : this.content.projects,
      services: Array.isArray(content.services) && content.services.length > 0 ? content.services : this.content.services,
      packages: Array.isArray(content.packages) && content.packages.length > 0 ? content.packages : this.content.packages,
      testimonials: Array.isArray(content.testimonials) && content.testimonials.length > 0 ? content.testimonials : this.content.testimonials,
      faqs: Array.isArray(content.faqs) && content.faqs.length > 0 ? content.faqs : this.content.faqs,
      mediaLibrary: deduplicateMediaList(Array.isArray(content.mediaLibrary) && content.mediaLibrary.length > 0 ? content.mediaLibrary : this.content.mediaLibrary),
      videoGallery: Array.isArray(content.videoGallery) ? content.videoGallery : (this.content.videoGallery || initialWebsiteContent.videoGallery || []),
      contacts: Array.isArray(content.contacts) && content.contacts.length > 0
        ? content.contacts
        : Array.isArray(content.settings?.contacts) && content.settings.contacts.length > 0
        ? content.settings.contacts
        : (this.content.contacts || initialWebsiteContent.contacts || []),
    };

    if (isPublish) {
      this.content = sanitizedContent;
      this.draftContent = null;
      this.saveContentDirect(this.content);
      try {
        if (fs.existsSync(DRAFT_FILE)) fs.unlinkSync(DRAFT_FILE);
      } catch {}
      try {
        const tmpDraft = path.join(TMP_DATA_DIR, 'draft.json');
        if (fs.existsSync(tmpDraft)) fs.unlinkSync(tmpDraft);
      } catch {}
      this.logActivity('Website Published', 'Administrator published live changes to the website', user);
    } else {
      this.draftContent = sanitizedContent;
      if (content.settings?.featuredMedia || content.settings?.socials) {
        this.content.settings = {
          ...this.content.settings,
          featuredMedia: content.settings.featuredMedia || this.content.settings.featuredMedia,
          socials: content.settings.socials || this.content.settings.socials,
        };
        this.saveContentDirect(this.content);
      }
      safeWriteFile(DRAFT_FILE, JSON.stringify(sanitizedContent, null, 2));
      this.logActivity('Draft Saved', 'Administrator saved work in progress draft', user);
    }

    // Persist to Supabase
    try {
      await upsertContentToSupabase(sanitizedContent, isPublish, user);
    } catch (err: any) {
      console.warn('[DB] Supabase async save notice:', err.message);
    }
  }

  // Explicit YouTube & Instagram Links update that applies immediately to live website and persists
  public async updateMediaLinks(
    data: {
      youtubeVideoUrl?: string;
      instagramPostUrl?: string;
      youtubeSocial?: string;
      instagramSocial?: string;
      title?: string;
      subtitle?: string;
    },
    user: string
  ): Promise<WebsiteContent> {
    const featured = {
      ...(this.content.settings.featuredMedia || initialWebsiteContent.settings.featuredMedia),
    };
    if (data.youtubeVideoUrl !== undefined) featured.youtubeVideoUrl = data.youtubeVideoUrl.trim();
    if (data.instagramPostUrl !== undefined) featured.instagramPostUrl = data.instagramPostUrl.trim();
    if (data.title !== undefined) featured.title = data.title.trim();
    if (data.subtitle !== undefined) featured.subtitle = data.subtitle.trim();

    const socials = {
      ...(this.content.settings.socials || initialWebsiteContent.settings.socials),
    };
    if (data.youtubeSocial !== undefined) socials.youtube = data.youtubeSocial.trim();
    if (data.instagramSocial !== undefined) socials.instagram = data.instagramSocial.trim();

    // If user provided a YouTube channel or video link, keep them in sync
    if (data.youtubeVideoUrl && (!data.youtubeSocial || !socials.youtube)) {
      if (
        data.youtubeVideoUrl.includes('@') ||
        data.youtubeVideoUrl.includes('/c/') ||
        data.youtubeVideoUrl.includes('/channel/')
      ) {
        socials.youtube = data.youtubeVideoUrl.trim();
      }
    }

    this.content = {
      ...this.content,
      settings: {
        ...this.content.settings,
        featuredMedia: featured,
        socials,
      },
    };

    if (this.draftContent) {
      this.draftContent = {
        ...this.draftContent,
        settings: {
          ...this.draftContent.settings,
          featuredMedia: featured,
          socials,
        },
      };
      safeWriteFile(DRAFT_FILE, JSON.stringify(this.draftContent, null, 2));
    }

    this.saveContentDirect(this.content);
    this.logActivity(
      'Media Links Updated',
      `Updated YouTube (${featured.youtubeVideoUrl || 'default'}) & Instagram (${featured.instagramPostUrl || 'default'}) links`,
      user
    );

    try {
      await upsertContentToSupabase(this.content, true, user);
    } catch (err: any) {
      console.warn('[DB] Supabase media links sync notice:', err.message);
    }

    return this.content;
  }

  // Update Settings (Branding, Hero, About, Contact, SEO, Section Visibility)
  public async updateSettings(partialSettings: Partial<SiteSettings>, user: string, isPublish: boolean = true): Promise<WebsiteContent> {
    const updatedSettings: SiteSettings = {
      ...this.content.settings,
      ...partialSettings,
      hero: {
        ...this.content.settings.hero,
        ...(partialSettings.hero || {}),
      },
      aboutSection: {
        ...this.content.settings.aboutSection,
        ...(partialSettings.aboutSection || {}),
      },
      socials: {
        ...this.content.settings.socials,
        ...(partialSettings.socials || {}),
      },
      featuredMedia: {
        ...this.content.settings.featuredMedia,
        ...(partialSettings.featuredMedia || {}),
      },
      sectionVisibility: {
        ...this.content.settings.sectionVisibility,
        ...(partialSettings.sectionVisibility || {}),
      },
      seo: {
        ...this.content.settings.seo,
        ...(partialSettings.seo || {}),
      },
    };

    if (isPublish) {
      this.content = {
        ...this.content,
        settings: updatedSettings,
      };
      this.draftContent = null;
      this.saveContentDirect(this.content);
      try {
        if (fs.existsSync(DRAFT_FILE)) fs.unlinkSync(DRAFT_FILE);
      } catch {}
      this.logActivity('Settings Published', 'Administrator updated and published website settings live', user);
    } else {
      this.draftContent = {
        ...(this.draftContent || this.content),
        settings: updatedSettings,
      };
      safeWriteFile(DRAFT_FILE, JSON.stringify(this.draftContent, null, 2));
      this.logActivity('Settings Draft Saved', 'Administrator saved website settings draft', user);
    }

    try {
      await upsertContentToSupabase(this.content, isPublish, user);
    } catch (err: any) {
      console.warn('[DB] Supabase settings sync notice:', err.message);
    }

    return this.content;
  }

  // Update or Create FAQ
  public async updateFaq(faq: { id?: string; question: string; answer: string; category?: string }, user: string): Promise<WebsiteContent> {
    const id = faq.id || 'faq-' + Date.now();
    const existingIndex = this.content.faqs.findIndex((f) => f.id === id);
    const item = {
      id,
      question: faq.question.trim(),
      answer: faq.answer.trim(),
      category: faq.category?.trim() || 'General',
    };

    const updatedFaqs = [...this.content.faqs];
    if (existingIndex >= 0) {
      updatedFaqs[existingIndex] = item;
    } else {
      updatedFaqs.push(item);
    }

    this.content = {
      ...this.content,
      faqs: updatedFaqs,
    };
    if (this.draftContent) {
      this.draftContent = {
        ...this.draftContent,
        faqs: updatedFaqs,
      };
      safeWriteFile(DRAFT_FILE, JSON.stringify(this.draftContent, null, 2));
    }
    this.saveContentDirect(this.content);
    this.logActivity('FAQ Updated', `Updated FAQ: "${item.question.slice(0, 40)}"`, user);

    try {
      await upsertContentToSupabase(this.content, true, user);
    } catch (err: any) {
      console.warn('[DB] Supabase FAQ sync notice:', err.message);
    }

    return this.content;
  }

  // Delete FAQ
  public async deleteFaq(id: string, user: string): Promise<WebsiteContent> {
    this.content = {
      ...this.content,
      faqs: this.content.faqs.filter((f) => f.id !== id),
    };
    if (this.draftContent) {
      this.draftContent = {
        ...this.draftContent,
        faqs: this.draftContent.faqs.filter((f) => f.id !== id),
      };
      safeWriteFile(DRAFT_FILE, JSON.stringify(this.draftContent, null, 2));
    }
    this.saveContentDirect(this.content);
    this.logActivity('FAQ Deleted', `Deleted FAQ ${id}`, user);

    try {
      await upsertContentToSupabase(this.content, true, user);
    } catch (err: any) {
      console.warn('[DB] Supabase FAQ delete sync notice:', err.message);
    }

    return this.content;
  }

  // Master 1-Click Publish All
  public async publishAll(user: string): Promise<WebsiteContent> {
    if (this.draftContent) {
      this.content = this.draftContent;
      this.draftContent = null;
    }
    this.saveContentDirect(this.content);
    try {
      if (fs.existsSync(DRAFT_FILE)) fs.unlinkSync(DRAFT_FILE);
      const tmpDraft = path.join(TMP_DATA_DIR, 'draft.json');
      if (fs.existsSync(tmpDraft)) fs.unlinkSync(tmpDraft);
    } catch {}
    this.logActivity('All Content Published Live', 'Administrator published all draft changes to live website', user);

    try {
      await upsertContentToSupabase(this.content, true, user);
    } catch (err: any) {
      console.warn('[DB] Supabase publishAll sync notice:', err.message);
    }

    return this.content;
  }

  // Add media item with URL duplicate check
  public async addMedia(item: { url: string; title: string; altText: string; category: any; sizeBytes?: number }): Promise<void> {
    if (!item || !item.url) return;
    const library = this.content.mediaLibrary || [];
    const existingIndex = library.findIndex((m) => m.url === item.url);
    if (existingIndex >= 0) {
      // Image already exists: update attributes without duplicating
      library[existingIndex] = {
        ...library[existingIndex],
        ...item,
        title: item.title || library[existingIndex].title,
      };
      this.content.mediaLibrary = deduplicateMediaList(library);
    } else {
      const newItem = {
        id: 'med-' + Date.now(),
        ...item,
        uploadedAt: new Date().toISOString(),
      };
      this.content.mediaLibrary = deduplicateMediaList([newItem, ...library]);
    }
    this.saveContentDirect(this.content);
    this.logActivity('Image Uploaded', `Image saved: ${item.title || 'Untitled'}`, 'admin');

    // Authoritative sync to Supabase website_content table
    try {
      await upsertContentToSupabase(this.content, true, 'admin');
    } catch (err: any) {
      console.warn('[DB] Supabase addMedia sync notice:', err?.message);
    }
  }

  // Delete media item
  public async deleteMedia(id: string): Promise<boolean> {
    const before = this.content.mediaLibrary.length;
    this.content.mediaLibrary = this.content.mediaLibrary.filter((m) => m.id !== id);
    if (this.draftContent) {
      this.draftContent.mediaLibrary = this.draftContent.mediaLibrary.filter((m) => m.id !== id);
    }
    this.saveContentDirect(this.content);

    // Authoritative sync to Supabase website_content table
    try {
      await upsertContentToSupabase(this.content, true, 'admin');
    } catch (err: any) {
      console.warn('[DB] Supabase deleteMedia sync notice:', err?.message);
    }

    return this.content.mediaLibrary.length < before;
  }

  // Update Business Contacts & Single Primary Contact
  public async updateContacts(contacts: BusinessContact[], user: string): Promise<WebsiteContent> {
    const rawList = Array.isArray(contacts) && contacts.length > 0 ? contacts : (initialWebsiteContent.contacts || []);
    const sanitized: BusinessContact[] = rawList.map((c, idx) => ({
      ...c,
      id: c.id || `contact-${Date.now()}-${idx}`,
      label: c.label ? c.label.trim() : `Contact ${idx + 1}`,
      phoneNumber: normalizePhoneNumber(c.phoneNumber),
      displayPhone: formatDisplayPhone(c.phoneNumber),
      isWhatsAppEnabled: c.isWhatsAppEnabled !== false,
      isCallEnabled: c.isCallEnabled !== false,
      isPrimary: Boolean(c.isPrimary),
      displayOrder: typeof c.displayOrder === 'number' ? c.displayOrder : idx + 1,
      isActive: c.isActive !== false,
      updatedAt: new Date().toISOString(),
    }));

    // Ensure only one active contact is marked primary
    let hasActivePrimary = false;
    for (const c of sanitized) {
      if (c.isActive && c.isPrimary) {
        if (!hasActivePrimary) {
          hasActivePrimary = true;
        } else {
          c.isPrimary = false;
        }
      }
    }
    if (!hasActivePrimary) {
      const firstActive = sanitized.find((c) => c.isActive) || sanitized[0];
      if (firstActive) firstActive.isPrimary = true;
    }

    const primary = getPrimaryContact(sanitized);

    this.content = {
      ...this.content,
      contacts: sanitized,
      settings: {
        ...this.content.settings,
        contacts: sanitized,
        phone: primary.displayPhone,
        whatsapp: primary.phoneNumber.replace(/\D/g, '').replace(/^91/, ''),
      },
    };

    if (this.draftContent) {
      this.draftContent = {
        ...this.draftContent,
        contacts: sanitized,
        settings: {
          ...this.draftContent.settings,
          contacts: sanitized,
          phone: primary.displayPhone,
          whatsapp: primary.phoneNumber.replace(/\D/g, '').replace(/^91/, ''),
        },
      };
      safeWriteFile(DRAFT_FILE, JSON.stringify(this.draftContent, null, 2));
    }

    this.saveContentDirect(this.content);
    this.logActivity(
      'Business Contacts Updated',
      `Updated ${sanitized.length} contact numbers. Primary: ${primary.label} (${primary.displayPhone})`,
      user
    );

    try {
      await upsertContentToSupabase(this.content, true, user);
    } catch (err: any) {
      console.warn('[DB] Supabase contacts sync notice:', err?.message);
    }

    return this.content;
  }

  // Enquiries
  public async addEnquiry(data: Omit<ContactSubmission, 'id' | 'createdAt' | 'status'>): Promise<ContactSubmission> {
    const newEnq: ContactSubmission = {
      id: 'enq-' + Date.now(),
      ...data,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    this.enquiries = [newEnq, ...this.enquiries];
    safeWriteFile(ENQUIRIES_FILE, JSON.stringify(this.enquiries, null, 2));
    this.logActivity('New Customer Enquiry', `Consultation request from ${data.name} (${data.phone})`, 'visitor');

    try {
      await saveEnquiryToSupabase(newEnq);
    } catch (err: any) {
      console.warn('[DB] Supabase enquiry sync notice:', err.message);
    }

    return newEnq;
  }

  public updateEnquiryStatus(id: string, status: 'new' | 'contacted' | 'resolved', notes?: string): boolean {
    const item = this.enquiries.find((e) => e.id === id);
    if (!item) return false;
    item.status = status;
    if (notes !== undefined) item.adminNotes = notes;
    safeWriteFile(ENQUIRIES_FILE, JSON.stringify(this.enquiries, null, 2));
    saveEnquiryToSupabase(item).catch(console.warn);
    return true;
  }

  public deleteEnquiry(id: string): boolean {
    const before = this.enquiries.length;
    this.enquiries = this.enquiries.filter((e) => e.id !== id);
    safeWriteFile(ENQUIRIES_FILE, JSON.stringify(this.enquiries, null, 2));
    return this.enquiries.length < before;
  }

  // Reset to initial authentic demo data
  public resetToDefault(user: string): WebsiteContent {
    this.content = JSON.parse(JSON.stringify(initialWebsiteContent));
    this.draftContent = null;
    this.saveContentDirect(this.content);
    try {
      if (fs.existsSync(DRAFT_FILE)) fs.unlinkSync(DRAFT_FILE);
    } catch {}
    this.logActivity('Reset Website Data', 'Reset all content to official VSHN Builders defaults', user);
    upsertContentToSupabase(this.content, true, user).catch(console.warn);
    return this.content;
  }

  public async checkSupabaseStatus() {
    return checkSupabaseConnection();
  }

  public setSupabasePublishableKey(key: string) {
    const res = setSupabaseKey(key);
    if (res.success) {
      this.initSupabaseSync().catch(console.warn);
    }
    return res;
  }

  public setSupabaseConfig(options: { publishableKey?: string; projectUrl?: string }) {
    const res = setSupabaseConfig(options);
    if (res.success) {
      this.initSupabaseSync().catch(console.warn);
    }
    return res;
  }

  public async syncToSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await upsertContentToSupabase(this.content, true, 'harish');
      if (res.success) {
        return { success: true, message: 'Website content successfully synchronized with Supabase database.' };
      }
      return { success: false, message: res.error || 'Failed to sync with Supabase.' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
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
    safeWriteFile(ACTIVITY_FILE, JSON.stringify(this.activityLogs, null, 2));
  }
}

export const db = new DatabaseService();
