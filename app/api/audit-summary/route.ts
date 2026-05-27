import { NextResponse } from 'next/server';
import { callGeminiAPI } from '@/lib/gemini-service';
import { isAllowed, getClientIp } from '@/lib/rate-limiter';

export async function POST(req: Request) {
  // Apply sliding-window rate limiting (max 10 requests per minute per IP)
  const ip = getClientIp(req);
  if (!isAllowed(ip, 10, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429 }
    );
  }

  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const { result, teamSize, primaryUseCase } = payload;
  if (!result) {
    return NextResponse.json({ error: 'Audit result is required' }, { status: 400 });
  }

  // Create the core prompt for the Gemini model
  const prompt = `Analyze this AI Spend Audit for a team of ${teamSize} using ${primaryUseCase} workflows.

Current Spend: $${result.currentMonthlySpend || 0}/mo
Potential Savings: $${result.totalMonthlySavings || 0}/mo
Waste Score: ${result.wasteScore || 0}/100

**Top Recommendations:**
${(result.recommendations || []).slice(0, 5).map((r: any) => `- ${r.toolName}: ${r.recommendedAction} (Save $${r.monthlySavings}/mo)`).join('\n')}

Provide a thorough, detailed executive summary. Address the founder directly. Include specific consolidation steps and financial impact. Be comprehensive and leave nothing out. With maximum response length of 100 words, prioritize the most impactful recommendations.`;

  try {
    // Call Gemini API with automatic retry logic
    const response = await callGeminiAPI(prompt, {
      model: 'gemini-2.5-flash',
      maxTokens: 4000,
      timeout: 30000,
    });

    console.log(`[audit-summary] Full response received (${response.text.length} chars): ${response.text.substring(0, 200)}...`);

    // Return response with source indicator
    return NextResponse.json(
      {
        text: response.text,
        source: response.source,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[audit-summary] Gemini API error:', err);

    // Fallback response if all APIs fail
    let fallbackText = '';
    if (result.totalMonthlySavings > 0) {
      fallbackText = `Your team of ${teamSize} has identified $${result.totalMonthlySavings}/month in AI tool optimization opportunities. Focus on consolidating overlapping seats on high-tier tools like Claude Team and GitHub Copilot. Moving legacy team plans to Pro tiers and evaluating cheaper alternatives can yield immediate savings. Start with the highest-impact recommendations above and consider booking a consultation to execute these changes systematically.`;
    } else {
      fallbackText = `Your AI tool stack is well-optimized for your team of ${teamSize} focused on ${primaryUseCase} work. Continue monitoring quarterly as team size and needs evolve. Keep audit logs to track whether tool usage justifies current spending, and revisit pricing tiers as new models and options emerge.`;
    }

    return NextResponse.json(
      {
        text: fallbackText,
        source: 'fallback',
      },
      { status: 200 }
    );
  }
}
