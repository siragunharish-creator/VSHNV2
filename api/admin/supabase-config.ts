import type { Request, Response } from 'express';
import { db } from '../../src/server/db.ts';

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token || !db.validateToken(token)) {
    return res.status(401).json({ error: 'Unauthorized. Please log in as administrator.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { publishableKey, projectUrl } = req.body || {};
    if (!publishableKey && !projectUrl) {
      return res.status(400).json({ error: 'Publishable key or Project URL is required.' });
    }
    const result = db.setSupabaseConfig({ publishableKey, projectUrl });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const status = await db.checkSupabaseStatus();
    return res.status(200).json({ success: true, status });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
