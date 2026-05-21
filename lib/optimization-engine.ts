/**
 * Deterministic vanilla TypeScript optimization engine
 * Implements exact business rules for tool cost optimization
 */

export type UseCase = 'coding' | 'writing' | 'data' | 'research' | 'mixed';
export type CursorPlan = 'Hobby' | 'Pro' | 'Business' | 'Enterprise';
export type CopilotPlan = 'Individual' | 'Business' | 'Enterprise';
export type ClaudePlan = 'Free' | 'Pro' | 'Max' | 'Team' | 'Enterprise' | 'APIdirect';
export type ChatGPTPlan = 'Plus' | 'Team' | 'Enterprise' | 'APIdirect';
export type GeminiPlan = 'Pro' | 'Ultra' | 'API';

export interface ToolConfig {
  toolId: string;
  toolName: string;
  plan: string;
  monthlySpend: number;
  seats: number;
}

export interface Recommendation {
  toolId: string;
  toolName: string;
  currentSpend: number;
  recommendedAction: string;
  monthlySavings: number;
  reason: string;
}

export interface OptimizationResult {
  recommendations: Recommendation[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  isFullyOptimized: boolean;
}

/**
 * CLAUDE TEAM FLOOR RULE
 * If tool === 'Claude' && plan === 'Team' && seats < 5
 * -> Recommend downgrade to Pro
 */
function checkClaudeTeamFloor(config: ToolConfig): Recommendation | null {
  if (
    config.toolName === 'Claude' &&
    config.plan === 'Team' &&
    config.seats < 5
  ) {
    const recommendedSpend = config.seats * 20; // Pro tier: $20/seat
    const monthlySavings = config.monthlySpend - recommendedSpend;
    return {
      toolId: config.toolId,
      toolName: 'Claude',
      currentSpend: config.monthlySpend,
      recommendedAction: `Downgrade to Pro ($20/seat) for ${config.seats} seats`,
      monthlySavings,
      reason: 'Claude Team tier has a strict 5-seat minimum billing floor.',
    };
  }
  return null;
}

/**
 * CURSOR BUSINESS FLOOR RULE
 * If tool === 'Cursor' && plan === 'Business' && seats < 10
 * -> Recommend downgrade to Pro
 */
function checkCursorBusinessFloor(config: ToolConfig): Recommendation | null {
  if (
    config.toolName === 'Cursor' &&
    config.plan === 'Business' &&
    config.seats < 10
  ) {
    const recommendedSpend = config.seats * 20; // Pro tier: $20/seat
    const monthlySavings = config.monthlySpend - recommendedSpend;
    return {
      toolId: config.toolId,
      toolName: 'Cursor',
      currentSpend: config.monthlySpend,
      recommendedAction: `Downgrade to Pro ($20/seat) for ${config.seats} seats`,
      monthlySavings,
      reason: 'Small teams (<10 seats) optimize better on Cursor Pro.',
    };
  }
  return null;
}

/**
 * CROSS-TOOL REDUNDANCY CHECK
 * If tools include both 'Cursor' and 'GitHub Copilot'
 * -> Recommend dropping Copilot
 */
function checkCrossToolRedundancy(
  configs: ToolConfig[]
): Recommendation | null {
  const hasCursor = configs.some((c) => c.toolName === 'Cursor');
  const hasCopilot = configs.some((c) => c.toolName === 'GitHub Copilot');

  if (hasCursor && hasCopilot) {
    const copilotConfig = configs.find((c) => c.toolName === 'GitHub Copilot');
    if (copilotConfig) {
      return {
        toolId: copilotConfig.toolId,
        toolName: 'GitHub Copilot',
        currentSpend: copilotConfig.monthlySpend,
        recommendedAction: `Discontinue GitHub Copilot`,
        monthlySavings: copilotConfig.monthlySpend,
        reason: 'High seat redundancy detected between Cursor and Copilot.',
      };
    }
  }
  return null;
}

/**
 * TOKEN OPTIMIZATION CHECK
 * If API direct tools have spend > $200/mo, note missing optimizations
 */
function checkTokenOptimization(config: ToolConfig): Recommendation | null {
  const isAPITool =
    config.plan === 'APIdirect' &&
    ['Claude', 'ChatGPT', 'Gemini'].includes(config.toolName);

  if (isAPITool && config.monthlySpend > 200) {
    const potentialSavings = config.monthlySpend * 0.9; // 90% potential discount
    return {
      toolId: config.toolId,
      toolName: config.toolName,
      currentSpend: config.monthlySpend,
      recommendedAction: `Implement Prompt Caching & context window optimization`,
      monthlySavings: potentialSavings,
      reason: 'Unmanaged context windows or missing Prompt Caching (90% potential discount on base prompts).',
    };
  }
  return null;
}

/**
 * Main optimization engine
 * Returns all recommendations and total savings
 */
export function optimizeToolStack(
  tools: ToolConfig[]
): OptimizationResult {
  const recommendations: Recommendation[] = [];
  const seenToolIds = new Set<string>();

  // Check individual tool rules
  tools.forEach((config) => {
    const claudeTeam = checkClaudeTeamFloor(config);
    if (claudeTeam) {
      recommendations.push(claudeTeam);
      seenToolIds.add(config.toolId);
    }

    const cursorBusiness = checkCursorBusinessFloor(config);
    if (cursorBusiness) {
      recommendations.push(cursorBusiness);
      seenToolIds.add(config.toolId);
    }

    const tokenOpt = checkTokenOptimization(config);
    if (tokenOpt) {
      recommendations.push(tokenOpt);
      seenToolIds.add(config.toolId);
    }
  });

  // Check cross-tool redundancy
  const crossRedundancy = checkCrossToolRedundancy(tools);
  if (crossRedundancy) {
    recommendations.push(crossRedundancy);
    seenToolIds.add(crossRedundancy.toolId);
  }

  const totalMonthlySavings = recommendations.reduce(
    (sum, rec) => sum + rec.monthlySavings,
    0
  );
  const totalAnnualSavings = totalMonthlySavings * 12;
  const isFullyOptimized = recommendations.length === 0;

  return {
    recommendations,
    totalMonthlySavings,
    totalAnnualSavings,
    isFullyOptimized,
  };
}

/**
 * Helper: Get pricing tier display name
 */
export function getPricingTierName(toolName: string, plan: string): string {
  return `${toolName} ${plan}`;
}
