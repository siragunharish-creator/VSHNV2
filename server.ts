import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';
import { db } from './src/server/db.ts';
import { uploadImageToSupabase } from './src/server/supabase.ts';

dotenv.config();

// Crash protection
process.on('uncaughtException', (err) => {
  console.error('[Server Uncaught Exception]:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server Unhandled Rejection]:', reason);
});

function resolvePort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const val = parseInt(process.argv[portArgIdx + 1], 10);
    if (!isNaN(val) && val > 0) return val;
  }
  const envPort = Number(process.env.PORT);
  if (!isNaN(envPort) && envPort > 0) return envPort;
  return 3000;
}

const app = express();
const PORT = resolvePort();
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers with generous limit for images/payloads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure public/uploads exists
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploads statically
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 30);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg|gif/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype;
    if (allowed.test(ext) || allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP, SVG, GIF) are allowed'));
    }
  },
});

// Auth Middleware
function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token || !db.validateToken(token)) {
    res.status(401).json({ error: 'Unauthorized. Please log in as administrator.' });
    return;
  }
  next();
}

// ======================== API ROUTES ========================

// 1. Authentication
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  const result = db.verifyCredentials(String(username).trim(), String(password), clientIp);
  if (!result.success) {
    res.status(401).json({ error: result.error });
    return;
  }

  res.json({
    success: true,
    token: result.token,
    user: {
      username: String(username).trim(),
      name: 'Harish (VSHN Administrator)',
      role: 'admin',
    },
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token || !db.validateToken(token)) {
    res.status(401).json({ authenticated: false });
    return;
  }

  res.json({
    authenticated: true,
    user: {
      username: 'harish',
      name: 'Harish (VSHN Administrator)',
      role: 'admin',
    },
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  db.logout(token);
  res.json({ success: true });
});

app.post('/api/auth/change-password', requireAdminAuth, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization!;
  const token = authHeader.slice(7);
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Both current and new passwords are required.' });
    return;
  }

  const result = db.changePassword(currentPassword, newPassword, token);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ success: true, message: 'Password updated successfully.' });
});

// ======================== REAL-TIME BROADCAST ENGINE ========================
const sseClients = new Set<Response>();

export function broadcastContentUpdate(updatedContent: any) {
  const payload = JSON.stringify({ content: updatedContent, timestamp: Date.now() });
  for (const client of sseClients) {
    try {
      client.write(`event: content_update\ndata: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// 2. Real-Time SSE Stream for Instant Global Synchronization Across Devices
app.get('/api/content/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send immediate initial authoritative state
  const current = db.getPublicContent();
  res.write(`event: init\ndata: ${JSON.stringify({ content: current, timestamp: Date.now() })}\n\n`);

  sseClients.add(res);

  // Keep connection alive with periodic heartbeats
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// 3. Public Content with Zero-Cache Headers (Single Source of Truth)
app.get('/api/content', (_req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const data = db.getPublicContent();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch content: ' + err.message });
  }
});

// 4. Contact Submissions (Public)
app.post('/api/contact', async (req: Request, res: Response) => {
  const { name, phone, email, plotLocation, serviceNeeded, estimatedSqFt, preferredPackage, message } = req.body;

  if (!name || !phone) {
    res.status(400).json({ error: 'Name and Phone number are required to submit an enquiry.' });
    return;
  }

  const cleanPhone = String(phone).trim();
  if (cleanPhone.length < 8) {
    res.status(400).json({ error: 'Please enter a valid phone number.' });
    return;
  }

  try {
    const submission = await db.addEnquiry({
      name: String(name).trim(),
      phone: cleanPhone,
      email: email ? String(email).trim() : undefined,
      plotLocation: String(plotLocation || 'Chennai').trim(),
      serviceNeeded: String(serviceNeeded || 'Complete residential construction'),
      estimatedSqFt: estimatedSqFt ? Number(estimatedSqFt) : undefined,
      preferredPackage: preferredPackage ? String(preferredPackage) : undefined,
      message: String(message || 'Requesting consultation').trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your enquiry has been received. Our senior engineer will contact you shortly.',
      enquiryId: submission.id,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record enquiry: ' + err.message });
  }
});

// 5. Admin Data (Protected)
app.get('/api/admin/data', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const data = db.getAdminData();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin data: ' + err.message });
  }
});

app.post('/api/admin/save-content', requireAdminAuth, async (req: Request, res: Response) => {
  const { content, isPublish } = req.body;
  if (!content) {
    res.status(400).json({ error: 'Content payload is missing.' });
    return;
  }

  try {
    await db.saveContent(content, Boolean(isPublish), 'harish');
    const publicContent = db.getPublicContent();
    if (isPublish) {
      broadcastContentUpdate(publicContent);
    }
    res.json({
      success: true,
      message: isPublish ? 'Website changes published successfully!' : 'Draft saved successfully.',
      content: publicContent,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save content: ' + err.message });
  }
});

// Dedicated Settings Update (Branding, Hero, About, Contact, SEO, Section Visibility)
app.post('/api/admin/update-settings', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { settings, isPublish = true } = req.body;
    if (!settings) {
      res.status(400).json({ error: 'Settings payload is required' });
      return;
    }
    const updated = await db.updateSettings(settings, 'harish', Boolean(isPublish));
    const publicContent = db.getPublicContent();
    if (isPublish) {
      broadcastContentUpdate(publicContent);
    }
    res.json({
      success: true,
      message: isPublish ? 'Settings published live!' : 'Settings draft saved.',
      content: publicContent,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings: ' + err.message });
  }
});

// Dedicated Instant YouTube & Instagram Links Update (Immediate Persistence)
app.post('/api/admin/save-media-links', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { youtubeVideoUrl, instagramPostUrl, youtubeSocial, instagramSocial, title, subtitle } = req.body;
    const updated = await db.updateMediaLinks(
      {
        youtubeVideoUrl,
        instagramPostUrl,
        youtubeSocial,
        instagramSocial,
        title,
        subtitle,
      },
      'harish'
    );
    const publicContent = db.getPublicContent();
    broadcastContentUpdate(publicContent);
    res.json({
      success: true,
      message: 'YouTube and Instagram links saved and updated live successfully!',
      content: publicContent,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update links: ' + err.message });
  }
});

// FAQ Management Endpoints
app.post('/api/admin/save-faq', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id, question, answer, category } = req.body;
    if (!question || !answer) {
      res.status(400).json({ error: 'Question and Answer are required' });
      return;
    }
    await db.updateFaq({ id, question, answer, category }, 'harish');
    const publicContent = db.getPublicContent();
    broadcastContentUpdate(publicContent);
    res.json({
      success: true,
      message: 'FAQ saved and published live!',
      content: publicContent,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save FAQ: ' + err.message });
  }
});

app.delete('/api/admin/faq/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    await db.deleteFaq(req.params.id, 'harish');
    const publicContent = db.getPublicContent();
    broadcastContentUpdate(publicContent);
    res.json({
      success: true,
      message: 'FAQ removed from website.',
      content: publicContent,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete FAQ: ' + err.message });
  }
});

// Master 1-Click Publish All
app.post('/api/admin/publish-all', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    await db.publishAll('harish');
    const publicContent = db.getPublicContent();
    broadcastContentUpdate(publicContent);
    res.json({
      success: true,
      message: 'All changes published live to website!',
      content: publicContent,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Publish failed: ' + err.message });
  }
});

// Image Upload (Multer file or base64) with Supabase Storage integration
app.post('/api/admin/upload', requireAdminAuth, (req: Request, res: Response) => {
  upload.single('image')(req, res, async (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'Image exceeds 15MB file size limit. Please upload a smaller image.' });
          return;
        }
        res.status(400).json({ error: `Upload error: ${err.message}` });
        return;
      }
      res.status(400).json({ error: err.message || 'Image upload error' });
      return;
    }

    try {
      let fileUrl = '';
      let originalName = 'uploaded-image';
      let sizeBytes = 0;
      let buffer: Buffer | null = null;
      let mimeType = 'image/jpeg';

      if (req.file) {
        fileUrl = `/uploads/${req.file.filename}`;
        originalName = req.file.originalname;
        sizeBytes = req.file.size;
        mimeType = req.file.mimetype || 'image/jpeg';
        buffer = fs.readFileSync(req.file.path);
      } else if (req.body.base64) {
        const base64Data = req.body.base64;
        const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          res.status(400).json({ error: 'Invalid base64 image data' });
          return;
        }
        const ext = matches[1].split('/')[1] || 'jpg';
        mimeType = matches[1] || 'image/jpeg';
        const filename = `upload-${Date.now()}.${ext}`;
        buffer = Buffer.from(matches[2], 'base64');
        fs.writeFileSync(path.join(uploadsDir, filename), buffer);
        fileUrl = `/uploads/${filename}`;
        originalName = req.body.name || filename;
        sizeBytes = buffer.length;
      } else {
        res.status(400).json({ error: 'No image file or base64 data provided.' });
        return;
      }

      // Try uploading to Supabase Storage bucket 'vshn-media' for permanent cross-deployment storage
      if (buffer) {
        try {
          const sbRes = await uploadImageToSupabase(originalName, buffer, mimeType);
          if (sbRes.success && sbRes.url) {
            fileUrl = sbRes.url;
          }
        } catch (sbErr) {
          console.warn('[Server] Supabase storage upload fallback to local URL:', sbErr);
        }
      }

      const title = req.body.title || originalName;
      const category = req.body.category || 'exterior';
      const altText = req.body.altText || title;

      db.addMedia({
        url: fileUrl,
        title,
        altText,
        category,
        sizeBytes,
      });

      res.json({
        success: true,
        url: fileUrl,
        title,
        category,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Upload failed: ' + err.message });
    }
  });
});

// ======================== SUPABASE DATABASE MANAGEMENT ROUTES ========================
app.get('/api/admin/supabase-status', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const status = await db.checkSupabaseStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

app.post('/api/admin/supabase-config', requireAdminAuth, async (req: Request, res: Response) => {
  const { publishableKey, projectUrl } = req.body;
  if (!publishableKey && !projectUrl) {
    res.status(400).json({ error: 'Publishable key or Project URL is required.' });
    return;
  }
  const result = db.setSupabaseConfig({ publishableKey, projectUrl });
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  const status = await db.checkSupabaseStatus();
  res.json({ success: true, status });
});

app.post('/api/admin/supabase-sync', requireAdminAuth, async (_req: Request, res: Response) => {
  const result = await db.syncToSupabase();
  res.json(result);
});

app.post('/api/admin/media', requireAdminAuth, (req: Request, res: Response) => {
  const item = req.body;
  if (!item || !item.url) {
    res.status(400).json({ error: 'Media item url is required.' });
    return;
  }
  db.addMedia(item);
  res.json({ success: true, item });
});

app.delete('/api/admin/media/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteMedia(id);
  if (deleted) {
    res.json({ success: true, message: 'Media removed.' });
  } else {
    res.status(404).json({ error: 'Media not found.' });
  }
});

app.patch('/api/admin/enquiries/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const updated = db.updateEnquiryStatus(id, status, notes);
  if (updated) {
    res.json({ success: true, message: 'Enquiry updated.' });
  } else {
    res.status(404).json({ error: 'Enquiry not found.' });
  }
});

app.delete('/api/admin/enquiries/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteEnquiry(id);
  if (deleted) {
    res.json({ success: true, message: 'Enquiry deleted.' });
  } else {
    res.status(404).json({ error: 'Enquiry not found.' });
  }
});

app.post('/api/admin/reset-demo', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const fresh = db.resetToDefault('harish');
    res.json({ success: true, message: 'All website content reset to initial VSHN Builders defaults.', content: fresh });
  } catch (err: any) {
    res.status(500).json({ error: 'Reset failed: ' + err.message });
  }
});

// Explicit 404 JSON response for any unhandled /api/* routes (prevents Vite serving index.html)
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// ======================== VITE INTEGRATION ========================
let viteMiddleware: any = null;
let vitePromise: Promise<any> | null = null;

if (!isProduction) {
  vitePromise = (async () => {
    try {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      viteMiddleware = vite.middlewares;
      console.log('[Vite] Middleware initialized successfully');
      return vite;
    } catch (err) {
      console.error('[Vite] Failed to initialize middleware:', err);
      return null;
    }
  })();

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    // Skip Vite for API, SSE, and static uploads
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    try {
      if (!viteMiddleware && vitePromise) {
        await vitePromise;
      }
      if (viteMiddleware) {
        return viteMiddleware(req, res, next);
      }
    } catch (err) {
      console.error('[Vite Handler Error]:', err);
    }
    next();
  });
} else {
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Bind TCP port immediately so dev server health-check and reverse proxy never timeout
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[VSHN Builders Server] running on http://0.0.0.0:${PORT}`);
});
