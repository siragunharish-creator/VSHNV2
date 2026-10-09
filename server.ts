import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';
import { db } from './src/server/db.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
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

// 2. Public Content
app.get('/api/content', (_req: Request, res: Response) => {
  try {
    const data = db.getPublicContent();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch content: ' + err.message });
  }
});

// 3. Contact Submissions (Public)
app.post('/api/contact', (req: Request, res: Response) => {
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
    const submission = db.addEnquiry({
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
app.get('/api/admin/data', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const data = db.getAdminData();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin data: ' + err.message });
  }
});

app.post('/api/admin/save-content', requireAdminAuth, (req: Request, res: Response) => {
  const { content, isPublish } = req.body;
  if (!content) {
    res.status(400).json({ error: 'Content payload is missing.' });
    return;
  }

  try {
    db.saveContent(content, Boolean(isPublish), 'harish');
    res.json({
      success: true,
      message: isPublish ? 'Website changes published successfully!' : 'Draft saved successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save content: ' + err.message });
  }
});

// Image Upload (Multer file or base64) with robust error handling
app.post('/api/admin/upload', requireAdminAuth, (req: Request, res: Response) => {
  upload.single('image')(req, res, (err: any) => {
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

      if (req.file) {
        fileUrl = `/uploads/${req.file.filename}`;
        originalName = req.file.originalname;
        sizeBytes = req.file.size;
      } else if (req.body.base64) {
        // Base64 upload fallback
        const base64Data = req.body.base64;
        const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          res.status(400).json({ error: 'Invalid base64 image data' });
          return;
        }
        const ext = matches[1].split('/')[1] || 'jpg';
        const filename = `upload-${Date.now()}.${ext}`;
        const buffer = Buffer.from(matches[2], 'base64');
        fs.writeFileSync(path.join(uploadsDir, filename), buffer);
        fileUrl = `/uploads/${filename}`;
        originalName = req.body.name || filename;
        sizeBytes = buffer.length;
      } else {
        res.status(400).json({ error: 'No image file or base64 data provided.' });
        return;
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

// ======================== VITE INTEGRATION ========================
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VSHN Builders Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
