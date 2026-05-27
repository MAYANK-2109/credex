import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const sharesFilePath = path.join(process.cwd(), 'data', 'shares.json');

/**
 * POST /api/shares – Store a shareable configuration and return a short id.
 * Expected body: { tools: ToolConfig[] }
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    if (!payload.tools) {
      return NextResponse.json({ error: 'tools payload missing' }, { status: 400 });
    }
    // Ensure the data directory exists
    try {
      await fs.mkdir(path.dirname(sharesFilePath), { recursive: true });
    } catch (_err) {
      // ignore mkdir errors when folder already exists
    }
    // Load existing shares
    let shares: any[] = [];
    try {
      const data = await fs.readFile(sharesFilePath, 'utf8');
      shares = JSON.parse(data);
    } catch {
      shares = [];
    }
    const id = crypto.randomBytes(4).toString('hex'); // short id like 8 chars
    shares.push({ id, tools: payload.tools, createdAt: new Date().toISOString() });
    await fs.writeFile(sharesFilePath, JSON.stringify(shares, null, 2), 'utf8');
    return NextResponse.json({ id }, { status: 200 });
  } catch (err) {
    console.error('Share API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
