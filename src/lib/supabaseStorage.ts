import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://uohziuryqsvbdbryclff.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_mK278Ai4HDimimcP8nYkLw_4IXhQepC';

let clientInstance: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

/**
 * Sanitizes Supabase URL on the frontend:
 * Handles markdown links [https://...](https://...), quotes, brackets, trailing slashes, and spaces.
 * Validates with new URL() to ensure http: or https: protocol.
 */
export function sanitizeFrontendSupabaseUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();

  // Guard against literal keywords or empty strings
  if (str === 'undefined' || str === 'null' || str === '""' || str === "''") return '';

  // Handle markdown links: [label](https://...) or [https://...](https://...)
  const mdMatch = /\[.*?\]\((https?:\/\/[^\s\)]+)\)/i.exec(str);
  if (mdMatch && mdMatch[1]) {
    str = mdMatch[1];
  }

  // Strip wrapping brackets, quotes, angle brackets, whitespace
  str = str.replace(/^[\[\("<'\s]+|[\]\)">'\s]+$/g, '').trim();

  // Extract first valid http/https URL if embedded in text
  const urlMatch = /https?:\/\/[^\s"'<>[\])]+/i.exec(str);
  if (urlMatch && urlMatch[0]) {
    str = urlMatch[0];
  }

  // Remove trailing slashes
  str = str.replace(/\/+$/, '').trim();

  // Validate with URL constructor
  try {
    const parsed = new URL(str);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return str;
    }
  } catch {}

  return '';
}

/**
 * Sanitizes Supabase publishable/anon key on the frontend:
 * Strips quotes, brackets, and whitespace.
 */
export function sanitizeFrontendSupabaseKey(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();
  if (str === 'undefined' || str === 'null' || str === '""' || str === "''") return '';
  str = str.replace(/^[\[\("<'\s]+|[\]\)">'\s]+$/g, '').trim();
  return str;
}

/**
 * Reset cached client instance (e.g. after config update)
 */
export function resetFrontendSupabaseClient(): void {
  clientInstance = null;
  lastUrl = '';
  lastKey = '';
}

/**
 * Save new credentials to localStorage and reset client
 */
export function setFrontendSupabaseCredentials(url?: string, key?: string): void {
  const cleanUrl = sanitizeFrontendSupabaseUrl(url);
  const cleanKey = sanitizeFrontendSupabaseKey(key);

  try {
    if (cleanUrl) {
      localStorage.setItem('vshn_supabase_url', cleanUrl);
    }
    if (cleanKey) {
      localStorage.setItem('vshn_supabase_key', cleanKey);
    }
  } catch {}

  resetFrontendSupabaseClient();
}

/**
 * Get or create browser-safe Supabase client for frontend direct uploads.
 * Defensively cleans and validates all URLs and keys, and safely falls back
 * to verified defaults if environment variables or localStorage are malformed.
 */
export function getFrontendSupabase(): SupabaseClient {
  const envUrl = sanitizeFrontendSupabaseUrl((import.meta as any).env?.VITE_SUPABASE_URL);
  const envKey = sanitizeFrontendSupabaseKey((import.meta as any).env?.VITE_SUPABASE_ANON_KEY);

  let localUrl = '';
  let localKey = '';
  try {
    const rawLocalUrl = localStorage.getItem('vshn_supabase_url');
    localUrl = sanitizeFrontendSupabaseUrl(rawLocalUrl);
    // If local was corrupted or formatted in markdown brackets, repair it
    if (rawLocalUrl && rawLocalUrl !== localUrl) {
      if (localUrl) {
        localStorage.setItem('vshn_supabase_url', localUrl);
      } else {
        localStorage.removeItem('vshn_supabase_url');
      }
    }

    const rawLocalKey = localStorage.getItem('vshn_supabase_key');
    localKey = sanitizeFrontendSupabaseKey(rawLocalKey);
    if (rawLocalKey && rawLocalKey !== localKey) {
      if (localKey) {
        localStorage.setItem('vshn_supabase_key', localKey);
      } else {
        localStorage.removeItem('vshn_supabase_key');
      }
    }
  } catch {}

  // Choose the best valid URL and Key, falling back to verified defaults
  const url = envUrl || localUrl || DEFAULT_SUPABASE_URL;
  const key = (envKey && envKey.length > 20 ? envKey : '') ||
              (localKey && localKey.length > 20 ? localKey : '') ||
              DEFAULT_SUPABASE_ANON_KEY;

  if (!clientInstance || lastUrl !== url || lastKey !== key) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      lastUrl = url;
      lastKey = key;
    } catch (err: any) {
      console.warn('[Supabase Frontend] Init error, falling back to verified default:', err?.message);
      clientInstance = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      lastUrl = DEFAULT_SUPABASE_URL;
      lastKey = DEFAULT_SUPABASE_ANON_KEY;
    }
  }

  return clientInstance;
}

/**
 * Converts a base64 data string to a Blob for direct Supabase Storage upload
 */
function base64ToBlob(base64Data: string, defaultType: string = 'image/jpeg'): Blob {
  let cleanBase64 = base64Data;
  let mimeType = defaultType;

  if (base64Data.startsWith('data:')) {
    const parts = base64Data.split(',');
    const match = parts[0].match(/:(.*?);/);
    if (match) {
      mimeType = match[1];
    }
    cleanBase64 = parts[1] || '';
  }

  const byteCharacters = atob(cleanBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Uploads a file or base64 directly to Supabase Storage bucket 'media'
 * using the official @supabase/supabase-js client from the browser.
 */
export async function uploadDirectToSupabaseStorage(
  fileOrBase64: File | { base64: string; name: string; type?: string },
  preferredBucket: string = 'media'
): Promise<{ success: boolean; url?: string; sizeBytes?: number; error?: string }> {
  try {
    const supabase = getFrontendSupabase();

    let fileData: File | Blob;
    let rawFileName: string;
    let contentType: string;
    let sizeBytes: number = 0;

    if (fileOrBase64 instanceof File) {
      fileData = fileOrBase64;
      rawFileName = fileOrBase64.name;
      contentType = fileOrBase64.type || 'image/jpeg';
      sizeBytes = fileOrBase64.size;
    } else {
      rawFileName = fileOrBase64.name || `image-${Date.now()}.jpg`;
      contentType = fileOrBase64.type || 'image/jpeg';
      fileData = base64ToBlob(fileOrBase64.base64, contentType);
      sizeBytes = fileData.size;
    }

    // 1. File format validation (JPG, JPEG, PNG, WebP, SVG, GIF)
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    const lowerName = rawFileName.toLowerCase();
    const hasValidExt = validExtensions.some(ext => lowerName.endsWith(ext));
    const hasValidMime = validMimes.includes(contentType.toLowerCase());

    if (!hasValidExt && !hasValidMime) {
      return {
        success: false,
        error: 'Invalid file format. Please upload JPG, PNG, or WebP images.',
      };
    }

    // 2. Oversized file validation (20MB limit)
    const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
    if (sizeBytes > MAX_SIZE_BYTES) {
      const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
      return {
        success: false,
        error: `File is too large (${sizeMb}MB). Maximum allowed image upload size is 20MB.`,
      };
    }

    // 3. Generate unique path with timestamp, UUID, and safely sanitized filename
    // Preserves extension and safely replaces spaces, Tamil characters, and symbols
    const extMatch = lowerName.match(/\.([a-z0-9]+)$/);
    const ext = extMatch ? `.${extMatch[1]}` : (contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg');
    const baseWithoutExt = rawFileName.replace(/\.[^/.]+$/, '');
    const cleanBase = baseWithoutExt
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'upload';

    const randomUuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).substring(2, 10);

    const cleanFileName = `${Date.now()}-${randomUuid}-${cleanBase}${ext}`;

    // 4. Try uploading to preferred bucket 'media' (and 'vshn-media' as fallback)
    const targetBuckets = [preferredBucket, 'vshn-media'];
    let lastError: string | null = null;
    let successfulBucket: string | null = null;

    for (const bucket of targetBuckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(cleanFileName, fileData, {
            contentType,
            cacheControl: '3600',
            upsert: false, // Prevent accidental overwriting of existing assets
          });

        if (!error && data) {
          successfulBucket = bucket;
          break;
        }

        if (error) {
          lastError = error.message;
          // If error is RLS violation or non-bucket error, break early
          if (error.message.toLowerCase().includes('row-level security')) {
            lastError = `Storage RLS policy blocked the upload. Please allow public uploads for the '${bucket}' bucket in Supabase Dashboard > Storage > Policies, or run the SQL in Admin Console > Supabase Database.`;
            break;
          }
          if (!error.message.toLowerCase().includes('bucket not found')) {
            break;
          }
        }
      } catch (uploadErr: any) {
        lastError = uploadErr.message;
      }
    }

    if (!successfulBucket) {
      if (lastError && lastError.toLowerCase().includes('bucket not found')) {
        return {
          success: false,
          error: `Supabase Storage bucket '${preferredBucket}' does not exist yet. In your Supabase Dashboard > Storage, create a public bucket named '${preferredBucket}' (Public: ON), or run the SQL in Admin Console > Supabase Database.`,
        };
      }
      return {
        success: false,
        error: lastError || 'Failed to upload image directly to Supabase Storage.',
      };
    }

    // 5. Retrieve public URL
    const { data: publicData } = supabase.storage
      .from(successfulBucket)
      .getPublicUrl(cleanFileName);

    if (!publicData || !publicData.publicUrl) {
      return { success: false, error: 'Could not obtain public URL for uploaded file.' };
    }

    return {
      success: true,
      url: publicData.publicUrl,
      sizeBytes,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Direct Supabase upload encountered an exception.',
    };
  }
}

/**
 * Direct browser-to-Supabase synchronization for website content
 */
export async function syncContentDirectToSupabase(
  content: any
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getFrontendSupabase();
    const payload = {
      id: 'current',
      published_content: content,
      draft_content: content,
      version: 1,
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      updated_by: 'harish',
    };

    const { error } = await supabase.from('website_content').upsert(payload, { onConflict: 'id' });
    if (error) {
      return { success: false, message: 'Supabase sync failed: ' + error.message };
    }
    return { success: true, message: 'All website content successfully synchronized with Supabase!' };
  } catch (err: any) {
    return { success: false, message: 'Supabase direct sync error: ' + err.message };
  }
}

/**
 * Direct browser read of authoritative published content from Supabase
 * Allows every visitor on any device / network to immediately fetch live gallery photos
 * even if Vercel serverless functions are cold or cached.
 */
export async function loadContentDirectFromSupabase(): Promise<any | null> {
  try {
    const supabase = getFrontendSupabase();
    const { data, error } = await supabase
      .from('website_content')
      .select('published_content, updated_at')
      .eq('id', 'current')
      .maybeSingle();

    if (!error && data?.published_content) {
      return data.published_content;
    }
    if (error) {
      console.warn('[Supabase Frontend] Direct read notice:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Frontend] Direct load exception:', err);
  }
  return null;
}

/**
 * Direct browser-to-Supabase connection check
 */
export async function checkDirectSupabaseStatus(): Promise<{
  connected: boolean;
  projectUrl: string;
  hasKey: boolean;
  message: string;
  tableExists?: boolean;
}> {
  try {
    const supabase = getFrontendSupabase();
    const projectUrl = sanitizeFrontendSupabaseUrl(
      (import.meta as any).env?.VITE_SUPABASE_URL ||
      localStorage.getItem('vshn_supabase_url') ||
      DEFAULT_SUPABASE_URL
    );

    const { data, error } = await supabase
      .from('website_content')
      .select('id, version, updated_at')
      .eq('id', 'current')
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          connected: true,
          projectUrl,
          hasKey: true,
          message: 'Connected to Supabase! Table website_content is ready (click Sync to upload initial content).',
          tableExists: true,
        };
      }
      if (error.message?.includes('relation "public.website_content" does not exist') || error.code === '42P01') {
        return {
          connected: false,
          projectUrl,
          hasKey: true,
          message: 'Connected to Supabase, but website_content table is missing. Run the SQL Migration in the SQL tab below.',
          tableExists: false,
        };
      }
      return {
        connected: false,
        projectUrl,
        hasKey: true,
        message: 'Supabase returned: ' + error.message,
      };
    }

    return {
      connected: true,
      projectUrl,
      hasKey: true,
      message: `Connected & Active! Supabase database is online and synced (Version ${data?.version || 1}).`,
      tableExists: true,
    };
  } catch (err: any) {
    return {
      connected: false,
      projectUrl: DEFAULT_SUPABASE_URL,
      hasKey: true,
      message: 'Connection check failed: ' + err.message,
    };
  }
}
