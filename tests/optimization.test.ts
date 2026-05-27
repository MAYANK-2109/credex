import { optimizeToolStack } from '@/lib/optimization-engine';

describe('optimization engine', () => {
  test('Claude Team floor rule recommends downgrade for small team', () => {
    const result = optimizeToolStack([
      {
        toolId: 'claude-team',
        toolName: 'Claude',
        plan: 'Team',
        monthlySpend: 200,
        seats: 3,
      },
    ]);

    // Engine may return both the floor rule and a pricing mismatch; ensure a floor rule exists
    const claudeRecs = result.recommendations.filter((r) => r.toolName === 'Claude');
    expect(claudeRecs.length).toBeGreaterThanOrEqual(1);
    expect(claudeRecs.some((r) => r.recommendedAction.includes('Downgrade to Pro'))).toBe(true);
  });

  test('Cursor Business floor rule recommends downgrade for small teams', () => {
    const result = optimizeToolStack([
      {
        toolId: 'cursor-business',
        toolName: 'Cursor',
        plan: 'Business',
        monthlySpend: 180,
        seats: 5,
      },
    ]);

    const cursorRecs = result.recommendations.filter((r) => r.toolName === 'Cursor');
    expect(cursorRecs.length).toBeGreaterThanOrEqual(1);
    expect(cursorRecs.some((r) => r.recommendedAction.includes('Downgrade to Pro'))).toBe(true);
  });

  test('pricing mismatch rule identifies high spend against expected plan cost', () => {
    const result = optimizeToolStack([
      {
        toolId: 'chatgpt-team',
        toolName: 'ChatGPT',
        plan: 'Team',
        monthlySpend: 260,
        seats: 3,
      },
    ]);

    expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(result.recommendations[0].toolName).toBe('ChatGPT');
    expect(result.recommendations[0].reason).toContain('expected cost');
  });

  test('cross-tool redundancy rule detects Cursor and GitHub Copilot overlap and calculates payback', () => {
    const result = optimizeToolStack(
      [
        {
          toolId: 'cursor',
          toolName: 'Cursor',
          plan: 'Pro',
          monthlySpend: 320,
          seats: 3,
        },
        {
          toolId: 'copilot',
          toolName: 'GitHub Copilot',
          plan: 'Business',
          monthlySpend: 2000,
          seats: 12,
        },
      ],
      12
    );

    const copilotRecs = result.recommendations.filter((r) => r.toolName === 'GitHub Copilot');
    expect(copilotRecs.length).toBeGreaterThanOrEqual(1);
    expect(copilotRecs.some((r) => r.recommendedAction.includes('Consolidate'))).toBe(true);
    expect(copilotRecs.some((r) => r.paybackMonths !== undefined)).toBe(true);
  });

  test('API token optimization returns realistic savings and payback', () => {
    const result = optimizeToolStack([
      {
        toolId: 'claude-api',
        toolName: 'Claude',
        plan: 'APIdirect',
        monthlySpend: 400,
        seats: 0,
      },
    ]);

    const apiRecs = result.recommendations.filter((r) => r.toolName === 'Claude');
    expect(apiRecs.length).toBeGreaterThanOrEqual(1);
    expect(apiRecs.some((r) => r.reason.includes('payback'))).toBe(true);
    expect(apiRecs.some((r) => r.monthlySavings > 0)).toBe(true);
  });

  test('full optimization result includes current spend, savings values, and waste score', () => {
    const result = optimizeToolStack([
      {
        toolId: 'cursor-best',
        toolName: 'Cursor',
        plan: 'Pro',
        monthlySpend: 100,
        seats: 3,
      },
    ]);

    expect(result.currentMonthlySpend).toBe(100);
    expect(result.currentAnnualSpend).toBe(1200);
    expect(result.wasteScore).toBeGreaterThanOrEqual(0);
    expect(result.wasteScore).toBeLessThanOrEqual(1);
    expect(result.wasteCategory).toBeDefined();
    expect(result.wasteBreakdown).toContain('waste score');
  });
});
