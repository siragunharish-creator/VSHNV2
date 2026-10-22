import type { Request, Response } from 'express';
import { db } from '../../src/server/db.ts';
import { uploadImageToSupabase } from '../../src/server/supabase.ts';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req: Request, res: Response) {
  // CORS Headers for Vercel Serverless
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Authorization Check
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token || !db.validateToken(token)) {
    return res.status(401).json({ error: 'Unauthorized. Please log in as administrator.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { base64, name, title, category = 'exterior', altText } = req.body || {};

    if (!base64) {
      return res.status(400).json({ error: 'Missing image data. Please provide base64 payload.' });
    }

    // Parse base64 string
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

    // Upload directly to Supabase Storage bucket 'media'
    const sbRes = await uploadImageToSupabase(originalName, buffer, mimeType);
    let fileUrl: string;

    if (sbRes.success && sbRes.url) {
      fileUrl = sbRes.url;
    } else {
      // Graceful local fallback in public/uploads so the upload succeeds while Supabase RLS is configured
      try {
        const fs = await import('fs');
        const path = await import('path');
        const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        fs.writeFileSync(path.join(uploadsDir, safeName), buffer);
        fileUrl = `/uploads/${safeName}`;
      } catch {
        return res.status(502).json({
          success: false,
          error: sbRes.error || 'Failed to upload image to Supabase Storage bucket (media).',
        });
      }
    }

    const finalTitle = title || originalName;
    const finalAltText = altText || finalTitle;

    // Record to database
    await db.addMedia({
      url: fileUrl,
      title: finalTitle,
      altText: finalAltText,
      category,
      sizeBytes: buffer.length,
    });

    return res.status(200).json({
      success: true,
      url: fileUrl,
      title: finalTitle,
      category,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
}
