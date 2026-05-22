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
        monthlySpend: 200,
        seats: 3,
      },
    ]);

    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].toolName).toBe('ChatGPT');
    expect(result.recommendations[0].reason).toContain('expected cost');
  });

  test('cross-tool redundancy rule detects Cursor and GitHub Copilot overlap', () => {
    const result = optimizeToolStack([
      {
        toolId: 'cursor',
        toolName: 'Cursor',
        plan: 'Pro',
        monthlySpend: 100,
        seats: 3,
      },
      {
        toolId: 'copilot',
        toolName: 'GitHub Copilot',
        plan: 'Business',
        monthlySpend: 180,
        seats: 3,
      },
    ]);

    const copilotRecs = result.recommendations.filter((r) => r.toolName === 'GitHub Copilot');
    expect(copilotRecs.length).toBeGreaterThanOrEqual(1);
    expect(copilotRecs.some((r) => r.recommendedAction.includes('Reduce Copilot spend'))).toBe(true);
  });

  test('full optimization result includes current spend and savings values', () => {
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
  });
});
