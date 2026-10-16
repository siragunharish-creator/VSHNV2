// Vercel Serverless Function entry point for /api
import type { Request, Response } from 'express';
import express from 'express';
import dotenv from 'dotenv';
import { db } from '../src/server/db.ts';
import { uploadImageToSupabase } from '../src/server/supabase.ts';

dotenv.config();

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Auth Middleware
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token || !db.validateToken(token)) {
    res.status(401).json({ error: 'Unauthorized. Please log in as administrator.' });
    return;
  }
  next();
}

// 1. Authentication
app.post('/api/auth/login', (req: express.Request, res: express.Response) => {
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

app.get('/api/auth/me', (req: express.Request, res: express.Response) => {
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

app.post('/api/auth/logout', (req: express.Request, res: express.Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  db.logout(token);
  res.json({ success: true });
});

app.post('/api/auth/change-password', requireAdminAuth, (req: express.Request, res: express.Response) => {
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

// 2. Public Content
app.get('/api/content', (_req: express.Request, res: express.Response) => {
  try {
    const data = db.getPublicContent();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch content: ' + err.message });
  }
});

// 3. Contact Submissions (Public)
app.post('/api/contact', async (req: express.Request, res: express.Response) => {
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

// 4. Admin Data (Protected)
app.get('/api/admin/data', requireAdminAuth, (_req: express.Request, res: express.Response) => {
  try {
    const data = db.getAdminData();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin data: ' + err.message });
  }
});

app.post('/api/admin/save-content', requireAdminAuth, async (req: express.Request, res: express.Response) => {
  const { content, isPublish } = req.body;
  if (!content) {
    res.status(400).json({ error: 'Content payload is missing.' });
    return;
  }

  try {
    await db.saveContent(content, Boolean(isPublish), 'harish');
    const publicContent = db.getPublicContent();
    res.json({
      success: true,
      message: isPublish ? 'Website changes published successfully!' : 'Draft saved successfully.',
      content: publicContent,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save content: ' + err.message });
  }
});

// Dedicated Instant YouTube & Instagram Links Update (Immediate Persistence)
app.post('/api/admin/save-media-links', requireAdminAuth, async (req: express.Request, res: express.Response) => {
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
    res.json({
      success: true,
      message: 'YouTube and Instagram links saved and updated live successfully!',
      content: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update links: ' + err.message });
  }
});

// Supabase Database Management
app.get('/api/admin/supabase-status', requireAdminAuth, async (_req: express.Request, res: express.Response) => {
  try {
    const status = await db.checkSupabaseStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

app.post('/api/admin/supabase-config', requireAdminAuth, async (req: express.Request, res: express.Response) => {
  const { publishableKey, projectUrl } = req.body || {};
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

app.post('/api/admin/supabase-sync', requireAdminAuth, async (_req: express.Request, res: express.Response) => {
  try {
    const result = await db.syncToSupabase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Sync failed: ' + err.message });
  }
});

app.post('/api/admin/upload', requireAdminAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { base64, name, title, category = 'exterior', altText } = req.body || {};
    if (!base64) {
      res.status(400).json({ error: 'Missing image data. Please provide base64 payload.' });
      return;
    }

    const matches = String(base64).match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let mimeType = 'image/jpeg';
    const originalName = name || `upload-${Date.now()}.jpg`;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64, 'base64');
    }

    let finalUrl = '';
    const sbRes = await uploadImageToSupabase(originalName, buffer, mimeType);
    if (sbRes.success && sbRes.url) {
      finalUrl = sbRes.url;
    } else {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        fs.writeFileSync(path.join(uploadsDir, safeName), buffer);
        finalUrl = `/uploads/${safeName}`;
      } catch {
        res.status(502).json({ error: sbRes.error || 'Failed to upload image to Supabase Storage bucket (media).' });
        return;
      }
    }

    const finalTitle = title || originalName;
    const finalAltText = altText || finalTitle;

    db.addMedia({
      url: finalUrl,
      title: finalTitle,
      altText: finalAltText,
      category,
      sizeBytes: buffer.length,
    });

    res.json({
      success: true,
      url: finalUrl,
      title: finalTitle,
      category,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

app.post('/api/admin/media', requireAdminAuth, (req: express.Request, res: express.Response) => {
  const item = req.body;
  if (!item || !item.url) {
    res.status(400).json({ error: 'Media item url is required.' });
    return;
  }
  db.addMedia(item);
  res.json({ success: true, item });
});

app.delete('/api/admin/media/:id', requireAdminAuth, (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const deleted = db.deleteMedia(id);
  if (deleted) {
    res.json({ success: true, message: 'Media removed.' });
  } else {
    res.status(404).json({ error: 'Media not found.' });
  }
});

app.patch('/api/admin/enquiries/:id', requireAdminAuth, (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const updated = db.updateEnquiryStatus(id, status, notes);
  if (updated) {
    res.json({ success: true, message: 'Enquiry updated.' });
  } else {
    res.status(404).json({ error: 'Enquiry not found.' });
  }
});

app.delete('/api/admin/enquiries/:id', requireAdminAuth, (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const deleted = db.deleteEnquiry(id);
  if (deleted) {
    res.json({ success: true, message: 'Enquiry deleted.' });
  } else {
    res.status(404).json({ error: 'Enquiry not found.' });
  }
});

app.post('/api/admin/reset-demo', requireAdminAuth, (_req: express.Request, res: express.Response) => {
  try {
    const fresh = db.resetToDefault('harish');
    res.json({ success: true, message: 'All website content reset to initial VSHN Builders defaults.', content: fresh });
  } catch (err: any) {
    res.status(500).json({ error: 'Reset failed: ' + err.message });
  }
});

export default app;
