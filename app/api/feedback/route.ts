import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const feedbackFilePath = path.join(process.cwd(), 'data', 'feedback.json');

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { score, teamSize, primaryUseCase, toolCount } = payload;

    if (typeof score !== 'number' || score < 1 || score > 5) {
      return NextResponse.json({ error: 'A rating from 1 to 5 is required.' }, { status: 400 });
    }

    const feedbackEntry = {
      score,
      teamSize: typeof teamSize === 'number' ? teamSize : null,
      primaryUseCase: typeof primaryUseCase === 'string' ? primaryUseCase : null,
      toolCount: typeof toolCount === 'number' ? toolCount : null,
      createdAt: new Date().toISOString(),
    };

    try {
      await fs.mkdir(path.dirname(feedbackFilePath), { recursive: true });
    } catch {
      // ignore mkdir errors when folder already exists
    }

    let feedbackData = [] as any[];
    try {
      const raw = await fs.readFile(feedbackFilePath, 'utf8');
      feedbackData = JSON.parse(raw);
      if (!Array.isArray(feedbackData)) {
        feedbackData = [];
      }
    } catch {
      feedbackData = [];
    }

    feedbackData.push(feedbackEntry);
    await fs.writeFile(feedbackFilePath, JSON.stringify(feedbackData, null, 2), 'utf8');

    return NextResponse.json({ message: 'Feedback saved' }, { status: 200 });
  } catch (err) {
    console.error('Feedback API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
