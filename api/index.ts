// Vercel Serverless Function entry point for /api
import type { Request, Response } from 'express';
import express from 'express';
import dotenv from 'dotenv';
import { db } from '../src/server/db.ts';

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
