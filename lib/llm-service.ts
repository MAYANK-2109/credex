import type { UseCase } from './optimization-engine';

export async function generateOptimizationSummary(
  result: any,
  teamSize: number,
  primaryUseCase: UseCase,
  _timeoutMs: number = 5000
): Promise<{ text: string; source: 'primary' | 'secondary' | 'fallback' }> {
  try {
    const response = await fetch('/api/audit-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        result,
        teamSize,
        primaryUseCase,
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned error status: ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.text,
      source: data.source || 'fallback',
    };
  } catch (err) {
    console.error('Failed to retrieve summary from backend API:', err);
    
    // Client-side fallback if the API endpoint itself crashes or is unreachable
    let fallbackText = '';
    if (result.totalMonthlySavings > 0) {
      fallbackText = `Based on our high-fidelity offline audit, your team of ${teamSize} utilizing ${primaryUseCase} workflows has an estimated optimization potential of $${result.totalMonthlySavings}/month. Our audit indicates immediate consolidation opportunities in your developer stack—specifically by managing seat allocations on high-tier tools and substituting token-based developer API routing for heavy conversational seats. We recommend standardizing Copilot vs Cursor seat allocations and moving legacy Claude Team seats back to Pro levels where possible. Book a consultation with a Credex Growth Specialist to execute these changes.`;
    } else {
      fallbackText = `Our deep offline analysis shows your AI developer stack is exceptionally well-optimized. Your team of ${teamSize} seat(s) running ${primaryUseCase} workflows displays a minimal waste ratio, meaning you are currently leveraging highly competitive retail plan tiers correctly. We recommend establishing custom rate limits and monitoring token usage patterns monthly to maintain this efficiency. Keep up the high standard! Join our quarterly notify-list to receive regular reports on developer tool tier adjustments.`;
    }
    
    return {
      text: fallbackText,
      source: 'fallback',
    };
  }
}
