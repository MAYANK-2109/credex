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
  currentMonthlySpend: number;
  currentAnnualSpend: number;
  isFullyOptimized: boolean;
}

const TOOL_PLAN_PRICING: Record<
  string,
  Record<string, { seatPrice?: number; flatPrice?: number; minSeats?: number }>
> = {
  Cursor: {
    Hobby: { flatPrice: 35 },
    Pro: { seatPrice: 20 },
    Business: { seatPrice: 18, minSeats: 10 },
    Enterprise: { seatPrice: 16, minSeats: 25 },
  },
  'GitHub Copilot': {
    Individual: { flatPrice: 10 },
    Business: { seatPrice: 19 },
    Enterprise: { seatPrice: 21 },
  },
  Claude: {
    Free: { flatPrice: 0 },
    Pro: { seatPrice: 20 },
    Max: { seatPrice: 35 },
    Team: { seatPrice: 24, minSeats: 5 },
    Enterprise: { seatPrice: 35 },
    APIdirect: {},
  },
  ChatGPT: {
    Plus: { flatPrice: 20 },
    Team: { seatPrice: 20 },
    Enterprise: { seatPrice: 30 },
    APIdirect: {},
  },
  Gemini: {
    Pro: { seatPrice: 25 },
    Ultra: { seatPrice: 45 },
    API: {},
  },
};

function estimateExpectedSpend(config: ToolConfig): number | null {
  const planPricing = TOOL_PLAN_PRICING[config.toolName]?.[config.plan];
  if (!planPricing) return null;
  if (planPricing.flatPrice !== undefined) return planPricing.flatPrice;
  if (planPricing.seatPrice !== undefined) return config.seats * planPricing.seatPrice;
  return null;
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

function checkPricingMismatch(config: ToolConfig): Recommendation | null {
  const expectedSpend = estimateExpectedSpend(config);
  if (expectedSpend === null || config.monthlySpend <= expectedSpend * 1.1) {
    return null;
  }

  const monthlySavings = config.monthlySpend - expectedSpend;
  return {
    toolId: config.toolId,
    toolName: config.toolName,
    currentSpend: config.monthlySpend,
    recommendedAction: `Review ${config.toolName} ${config.plan} pricing and verify seats/plan details`,
    monthlySavings,
    reason: `The expected cost for ${config.plan} is about $${expectedSpend.toFixed(0)}/mo for ${config.seats} seat(s).`,
  };
}

/**
 * CROSS-TOOL REDUNDANCY CHECK
 * If tools include both 'Cursor' and 'GitHub Copilot' or both 'Claude' and 'ChatGPT',
 * identify overlap in core productivity tooling.
 */
function checkCrossToolRedundancy(
  configs: ToolConfig[],
  primaryUseCase: UseCase
): Recommendation | null {
  const hasCursor = configs.some((c) => c.toolName === 'Cursor');
  const copilotConfig = configs.find((c) => c.toolName === 'GitHub Copilot');
  const claudeConfig = configs.find((c) => c.toolName === 'Claude');
  const chatGptConfig = configs.find((c) => c.toolName === 'ChatGPT');

  if (hasCursor && copilotConfig && copilotConfig.monthlySpend > 0) {
    const suggestedSavings = Math.round(copilotConfig.monthlySpend * 0.75);
    return {
      toolId: copilotConfig.toolId,
      toolName: 'GitHub Copilot',
      currentSpend: copilotConfig.monthlySpend,
      recommendedAction: `Reduce Copilot spend or consolidate with Cursor`,
      monthlySavings: suggestedSavings,
      reason: primaryUseCase === 'coding'
        ? 'Development teams can often consolidate coding assistance into one primary tool and avoid overlapping seat costs.'
        : 'Multiple code completion assistants can create redundant spend for a single team workflow.',
    };
  }

  if (claudeConfig && chatGptConfig && primaryUseCase === 'research' && chatGptConfig.monthlySpend > 0) {
    const suggestedSavings = Math.round(chatGptConfig.monthlySpend * 0.5);
    return {
      toolId: chatGptConfig.toolId,
      toolName: 'ChatGPT',
      currentSpend: chatGptConfig.monthlySpend,
      recommendedAction: `Consolidate research workflows on one conversational AI`,
      monthlySavings: suggestedSavings,
      reason: 'Research teams frequently duplicate AI chat costs across both Claude and ChatGPT.',
    };
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
  tools: ToolConfig[],
  _teamSize: number = 1,
  primaryUseCase: UseCase = 'mixed'
): OptimizationResult {
  const recommendations: Recommendation[] = [];
  const seenToolIds = new Set<string>();

  const currentMonthlySpend = tools.reduce(
    (sum, tool) => sum + tool.monthlySpend,
    0
  );
  const currentAnnualSpend = currentMonthlySpend * 12;

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

    const pricingMismatch = checkPricingMismatch(config);
    if (pricingMismatch) {
      recommendations.push(pricingMismatch);
      seenToolIds.add(config.toolId);
    }

    const tokenOpt = checkTokenOptimization(config);
    if (tokenOpt) {
      recommendations.push(tokenOpt);
      seenToolIds.add(config.toolId);
    }
  });

  // Check cross-tool redundancy
  const crossRedundancy = checkCrossToolRedundancy(tools, primaryUseCase);
  if (crossRedundancy) {
    recommendations.push(crossRedundancy);
    seenToolIds.add(crossRedundancy.toolId);
  }

  // If no recommendations yet, check if any tools have $0 spend
  if (recommendations.length === 0) {
    const zeroSpendTool = tools.find((t) => t.monthlySpend === 0);
    if (zeroSpendTool) {
      recommendations.push({
        toolId: zeroSpendTool.toolId,
        toolName: zeroSpendTool.toolName,
        currentSpend: 0,
        recommendedAction: `Enter actual monthly spend for ${zeroSpendTool.toolName} ${zeroSpendTool.plan}`,
        monthlySavings: 0,
        reason: 'No spend detected. Enter your actual monthly spend to unlock optimization recommendations.',
      });
    }
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
    currentMonthlySpend,
    currentAnnualSpend,
    isFullyOptimized,
  };
}

/**
 * Helper: Get pricing tier display name
 */
export function getPricingTierName(toolName: string, plan: string): string {
  return `${toolName} ${plan}`;
}
