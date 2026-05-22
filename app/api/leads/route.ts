import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Path to data directory (ensure it exists)
const leadsFilePath = path.join(process.cwd(), 'data', 'leads.json');

/**
 * POST /api/leads – Store a lead submission.
 * Expected body: { email, companyName, role, teamSize, primaryUseCase, toolCount }
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    // Basic validation
    const required = ['email', 'companyName', 'role', 'teamSize', 'primaryUseCase', 'toolCount'];
    for (const key of required) {
      if (!payload[key]) {
        return NextResponse.json({ error: `${key} is required` }, { status: 400 });
      }
    }
    // Read existing leads (or create file)
    let leads: any[] = [];
    try {
      const data = await fs.readFile(leadsFilePath, 'utf8');
      leads = JSON.parse(data);
    } catch {
      // If file does not exist, start with empty array
      leads = [];
    }
    leads.push({ ...payload, timestamp: new Date().toISOString() });
    await fs.writeFile(leadsFilePath, JSON.stringify(leads, null, 2), 'utf8');
    return NextResponse.json({ message: 'Lead saved' }, { status: 200 });
  } catch (err: any) {
    console.error('Lead API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
