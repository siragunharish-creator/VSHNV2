import type { Request, Response } from 'express';
import { db } from '../../src/server/db.ts';

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token || !db.validateToken(token)) {
    return res.status(401).json({ error: 'Unauthorized. Please log in as administrator.' });
  }

  try {
    const status = await db.checkSupabaseStatus();
    return res.status(200).json(status);
  } catch (err: any) {
    return res.status(500).json({ connected: false, error: err.message });
  }
}
