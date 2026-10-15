import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { WebsiteContent, ContactSubmission, ActivityLog } from '../shared/types.ts';

// File where admin-entered key & url can be cached
const KEY_CACHE_FILE = path.resolve(process.cwd(), 'data', 'supabase-config.json');

/**
 * Sanitizes Supabase URL, stripping markdown links like [url](url), brackets, quotes, and trailing slashes.
 */
export function sanitizeSupabaseUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();

  // Handle markdown links: [label](https://...) or [https://...](https://...)
  const mdMatch = /\[.*?\]\((https?:\/\/[^\s\)]+)\)/i.exec(str);
  if (mdMatch && mdMatch[1]) {
    str = mdMatch[1];
  }

  // Strip wrapping brackets, quotes, angle brackets
  str = str.replace(/^[\[\("<'\s]+|[\]\)">'\s]+$/g, '').trim();

  // Extract valid http or https URL
  const urlMatch = /https?:\/\/[^\s"'<>[\])]+/i.exec(str);
  if (urlMatch && urlMatch[0]) {
    str = urlMatch[0];
  }

  // Remove trailing slashes
  str = str.replace(/\/+$/, '');

  if (!str.startsWith('http://') && !str.startsWith('https://')) {
    return '';
  }

  return str;
}

/**
 * Sanitizes Supabase publishable/anon key
 */
export function sanitizeSupabaseKey(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();
  str = str.replace(/^[\[\("<'\s]+|[\]\)">'\s]+$/g, '').trim();
  return str;
}

/**
 * Retrieve the active Supabase project URL
 */
export function getSupabaseProjectUrl(): string {
  try {
    if (fs.existsSync(KEY_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(KEY_CACHE_FILE, 'utf-8'));
      if (data.projectUrl) {
        const cleaned = sanitizeSupabaseUrl(data.projectUrl);
        if (cleaned) return cleaned;
      }
    }
  } catch {}

  const envUrl = sanitizeSupabaseUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  if (envUrl) {
    return envUrl;
  }

  return 'https://uohziuryqsvbdbryclff.supabase.co';
}

function getStoredKey(): string {
  try {
    if (fs.existsSync(KEY_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(KEY_CACHE_FILE, 'utf-8'));
      if (data.publishableKey && typeof data.publishableKey === 'string') {
        const clean = sanitizeSupabaseKey(data.publishableKey);
        if (clean.length > 20) return clean;
      }
    }
  } catch {}

  const envKey = sanitizeSupabaseKey(
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  if (envKey && envKey.length > 20) {
    return envKey;
  }

  return '';
}

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl: string = '';
let lastUsedKey: string = '';

export function setSupabaseConfig(options: {
  publishableKey?: string;
  projectUrl?: string;
}): { success: boolean; error?: string } {
  try {
    let existingConfig: { publishableKey?: string; projectUrl?: string } = {};
    if (fs.existsSync(KEY_CACHE_FILE)) {
      try {
        existingConfig = JSON.parse(fs.readFileSync(KEY_CACHE_FILE, 'utf-8'));
      } catch {}
    }

    const newKey = options.publishableKey
      ? sanitizeSupabaseKey(options.publishableKey)
      : existingConfig.publishableKey || getStoredKey();

    const newUrl = options.projectUrl
      ? sanitizeSupabaseUrl(options.projectUrl)
      : existingConfig.projectUrl || getSupabaseProjectUrl();

    if (!newUrl) {
      return { success: false, error: 'A valid Supabase HTTP or HTTPS URL is required.' };
    }
    if (!newKey || newKey.length < 20) {
      return { success: false, error: 'Publishable key must be a valid Supabase key.' };
    }

    const dir = path.dirname(KEY_CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(
      KEY_CACHE_FILE,
      JSON.stringify(
        {
          publishableKey: newKey,
          projectUrl: newUrl,
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      ),
      'utf-8'
    );

    lastUsedUrl = newUrl;
    lastUsedKey = newKey;
    cachedClient = createClient(newUrl, newKey, {
      auth: { persistSession: false },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function setSupabaseKey(newKey: string): { success: boolean; error?: string } {
  return setSupabaseConfig({ publishableKey: newKey });
}

export function getSupabaseClient(): SupabaseClient | null {
  const key = getStoredKey();
  const url = getSupabaseProjectUrl();
  if (!key || !url) return null;

  if (!cachedClient || lastUsedUrl !== url || lastUsedKey !== key) {
    try {
      cachedClient = createClient(url, key, {
        auth: { persistSession: false },
      });
      lastUsedUrl = url;
      lastUsedKey = key;
    } catch (err: any) {
      console.error('[Supabase] Client instantiation error:', err.message);
      return null;
    }
  }
  return cachedClient;
}

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  projectUrl: string;
  hasKey: boolean;
  message: string;
  tableExists?: boolean;
}> {
  const projectUrl = getSupabaseProjectUrl();
  const key = getStoredKey();

  if (!key) {
    return {
      connected: false,
      projectUrl,
      hasKey: false,
      message: 'Supabase publishable key is not configured yet. Add it in environment or Admin Console.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      projectUrl,
      hasKey: true,
      message: 'Failed to create Supabase client. Please check the Project URL and key.',
    };
  }

  try {
    const { data, error } = await client.from('website_content').select('id, version, updated_at').limit(1);
    if (error) {
      // If table doesn't exist yet, connection is still valid, but migration is needed
      if (error.code === '42P01') {
        return {
          connected: true,
          projectUrl,
          hasKey: true,
          tableExists: false,
          message: 'Connected to Supabase, but "website_content" table needs migration (run supabase-migration.sql).',
        };
      }
      return {
        connected: false,
        projectUrl,
        hasKey: true,
        message: `Supabase returned: ${error.message} (code: ${error.code})`,
      };
    }
    return {
      connected: true,
      projectUrl,
      hasKey: true,
      tableExists: true,
      message: 'Supabase database is connected and active.',
    };
  } catch (err: any) {
    return {
      connected: false,
      projectUrl,
      hasKey: true,
      message: `Failed to reach Supabase: ${err.message}`,
    };
  }
}

/**
 * Load authoritative website content from Supabase
 */
export async function loadContentFromSupabase(): Promise<{
  published: WebsiteContent | null;
  draft: WebsiteContent | null;
  version?: number;
} | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('website_content')
      .select('published_content, draft_content, version')
      .eq('id', 'current')
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.warn('[Supabase] Read warning:', error.message);
      }
      return null;
    }

    if (data && data.published_content) {
      return {
        published: data.published_content as WebsiteContent,
        draft: data.draft_content as WebsiteContent | null,
        version: data.version,
      };
    }
  } catch (err) {
    console.warn('[Supabase] Read error:', err);
  }
  return null;
}

/**
 * Upsert website content to Supabase
 */
export async function upsertContentToSupabase(
  content: WebsiteContent,
  isPublish: boolean,
  userName: string = 'harish'
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not initialized (missing publishable key)' };
  }

  try {
    // Check existing record to avoid clobbering draft or published
    const { data: existing } = await client
      .from('website_content')
      .select('published_content, draft_content, version')
      .eq('id', 'current')
      .single();

    const currentPublished = existing?.published_content || content;
    const nextVersion = (existing?.version || 1) + 1;

    const payload: any = {
      id: 'current',
      version: nextVersion,
      updated_at: new Date().toISOString(),
      updated_by: userName,
    };

    if (isPublish) {
      payload.published_content = content;
      payload.draft_content = null;
      payload.published_at = new Date().toISOString();
    } else {
      payload.published_content = currentPublished;
      payload.draft_content = content;
    }

    const { error } = await client.from('website_content').upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] Upsert error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Upsert exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Record customer lead enquiry in Supabase
 */
export async function saveEnquiryToSupabase(enquiry: ContactSubmission): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('contact_submissions').upsert({
      id: enquiry.id,
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email || null,
      plot_location: enquiry.plotLocation || null,
      service_needed: enquiry.serviceNeeded || null,
      estimated_sq_ft: enquiry.estimatedSqFt || null,
      preferred_package: enquiry.preferredPackage || null,
      budget_range: enquiry.budgetRange || null,
      message: enquiry.message || null,
      status: enquiry.status || 'new',
      notes: enquiry.adminNotes || null,
      created_at: enquiry.createdAt || new Date().toISOString(),
    });
    if (error) {
      console.warn('[Supabase] Enquiry save warning:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Load enquiries from Supabase
 */
export async function loadEnquiriesFromSupabase(): Promise<ContactSubmission[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      email: d.email || undefined,
      plotLocation: d.plot_location || '',
      serviceNeeded: d.service_needed || '',
      estimatedSqFt: d.estimated_sq_ft ? Number(d.estimated_sq_ft) : undefined,
      preferredPackage: d.preferred_package || undefined,
      budgetRange: d.budget_range || undefined,
      message: d.message || '',
      status: d.status || 'new',
      adminNotes: d.notes || undefined,
      createdAt: d.created_at || new Date().toISOString(),
    }));
  } catch {
    return null;
  }
}

/**
 * Upload image buffer to Supabase Storage bucket 'vshn-media'
 */
export async function uploadImageToSupabase(
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    const cleanName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data, error } = await client.storage
      .from('vshn-media')
      .upload(cleanName, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn('[Supabase Storage] Upload warning:', error.message);
      return { success: false, error: error.message };
    }

    const { data: publicData } = client.storage.from('vshn-media').getPublicUrl(cleanName);
    return { success: true, url: publicData.publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
