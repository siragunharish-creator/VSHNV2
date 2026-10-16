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
    let fileName: string;
    let contentType: string;
    let sizeBytes: number = 0;

    if (fileOrBase64 instanceof File) {
      fileData = fileOrBase64;
      fileName = fileOrBase64.name;
      contentType = fileOrBase64.type || 'image/jpeg';
      sizeBytes = fileOrBase64.size;
    } else {
      fileName = fileOrBase64.name || `image-${Date.now()}.jpg`;
      contentType = fileOrBase64.type || 'image/jpeg';
      fileData = base64ToBlob(fileOrBase64.base64, contentType);
      sizeBytes = fileData.size;
    }

    // Sanitize file name with timestamp
    const cleanFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // 1. Try uploading to preferred bucket 'media' (and 'vshn-media' as fallback)
    const targetBuckets = [preferredBucket, 'vshn-media'];
    let lastError: string | null = null;
    let successfulBucket: string | null = null;

    for (const bucket of targetBuckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(cleanFileName, fileData, {
            contentType,
            upsert: true,
          });

        if (!error && data) {
          successfulBucket = bucket;
          break;
        }

        if (error) {
          lastError = error.message;
          // If error is not "Bucket not found", don't loop needlessly
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

    // 2. Retrieve public URL
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
