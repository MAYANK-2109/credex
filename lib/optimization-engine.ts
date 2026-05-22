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

export type PricingFitAnswer = {
  question:
    | 'Right plan for usage'
    | 'Cheaper plan from same vendor'
    | 'Substantially cheaper alternative'
    | 'Paying retail vs credits';
  status: 'Yes' | 'No' | 'Unknown';
  evidence: string;
  recommendation: string;
};

export interface OptimizationResult {
  recommendations: Recommendation[];
  pricingFitAnswers: PricingFitAnswer[];
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
  if (config.toolName === 'Claude' && config.plan === 'Team' && config.seats < 5) {
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
  if (config.toolName === 'Cursor' && config.plan === 'Business' && config.seats < 10) {
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
      reason:
        primaryUseCase === 'coding'
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
    config.plan === 'APIdirect' && ['Claude', 'ChatGPT', 'Gemini'].includes(config.toolName);

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
  const pricingFitAnswers: PricingFitAnswer[] = [];
  const seenToolIds = new Set<string>();

  const currentMonthlySpend = tools.reduce((sum, tool) => sum + tool.monthlySpend, 0);
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

  // ==============================
  // Pricing Plan Fit & Alternatives
  // ==============================

  // 1) Right plan for usage (overkill) heuristic: seat floors / mis-sized tiers
  const overkillIssues: string[] = [];
  const anyClaudeTeamUnder5 = tools.some(
    (t) => t.toolName === 'Claude' && t.plan === 'Team' && t.seats < 5
  );
  const anyCursorBusinessUnder10 = tools.some(
    (t) => t.toolName === 'Cursor' && t.plan === 'Business' && t.seats < 10
  );

  if (anyClaudeTeamUnder5) overkillIssues.push('Claude Team has a strict 5-seat minimum billing floor.');
  if (anyCursorBusinessUnder10)
    overkillIssues.push('Cursor Business has a small-team economics floor; Pro is typically cheaper below 10 seats.');

  pricingFitAnswers.push({
    question: 'Right plan for usage',
    status: overkillIssues.length > 0 ? 'No' : 'Yes',
    evidence:
      overkillIssues.length > 0
        ? `Detected plan/seat overkill: ${overkillIssues.join(' ')}`
        : 'No plan/seat floor violations detected with the rules in this audit.',
    recommendation:
      overkillIssues.length > 0
        ? 'Adjust seats/plan tiers to meet vendor billing floors (e.g., downgrade to Pro where applicable).'
        : 'Your current plan selections align with the seat-floor rules used by this audit.',
  });

  // 2) Cheaper plan from same vendor
  const cheaperSameVendorFindings: string[] = [];
  for (const t of tools) {
    const toolPricing = TOOL_PLAN_PRICING[t.toolName];
    if (!toolPricing) continue;

    const candidatePlans = Object.keys(toolPricing);
    const candidates: { plan: string; expected: number }[] = [];

    for (const plan of candidatePlans) {
      const p = toolPricing[plan];
      if (!p) continue;
      if (p.flatPrice === undefined && p.seatPrice === undefined) continue;
      // Only compare compatible tiers.
      if (p.minSeats !== undefined && t.seats < p.minSeats) continue;

      const expected = p.flatPrice !== undefined ? p.flatPrice : t.seats * (p.seatPrice ?? 0);
      if (typeof expected === 'number' && isFinite(expected)) {
        candidates.push({ plan, expected });
      }
    }

    if (candidates.length === 0) continue;

    const cheapest = candidates.reduce((a, b) => (a.expected < b.expected ? a : b));
    if (cheapest.plan !== t.plan) {
      const currentExpected = estimateExpectedSpend(t);
      // If we can estimate, flag only if model suggests you’re paying more than ~5% over cheapest.
      if (currentExpected !== null && currentExpected > cheapest.expected * 1.05) {
        cheaperSameVendorFindings.push(
          `${t.toolName}: ${t.plan} → ${cheapest.plan} (cheapest expected tier ≈ $${cheapest.expected.toFixed(0)}/mo)`
        );
      }
    }
  }

  pricingFitAnswers.push({
    question: 'Cheaper plan from same vendor',
    status: cheaperSameVendorFindings.length > 0 ? 'No' : 'Yes',
    evidence:
      cheaperSameVendorFindings.length > 0
        ? `Cheaper same-vendor tiers detected: ${cheaperSameVendorFindings.join('; ')}`
        : 'No cheaper same-vendor tiers detected within the tier model used by this audit.',
    recommendation:
      cheaperSameVendorFindings.length > 0
        ? 'Downgrade/re-tier to the cheapest compatible plan tier, then re-run the audit with updated spend.'
        : 'Keep your current tier; it appears cost-competitive within modeled pricing.',
  });

  // 3) Substantially cheaper alternative tool (conservative)
  const cheapestPerTool: Record<string, number> = {};
  for (const toolName of Object.keys(TOOL_PLAN_PRICING)) {
    const toolPricing = TOOL_PLAN_PRICING[toolName];
    const anyToolConfig = tools.find((t) => t.toolName === toolName);
    const seats = anyToolConfig?.seats ?? 1;

    const candidates: number[] = [];
    for (const plan of Object.keys(toolPricing)) {
      const p = toolPricing[plan];
      if (!p) continue;
      if (p.flatPrice === undefined && p.seatPrice === undefined) continue;
      if (p.minSeats !== undefined && seats < p.minSeats) continue;

      const expected = p.flatPrice !== undefined ? p.flatPrice : seats * (p.seatPrice ?? 0);
      if (typeof expected === 'number' && isFinite(expected)) candidates.push(expected);
    }

    if (candidates.length > 0) {
      cheapestPerTool[toolName] = Math.min(...candidates);
    }
  }

  const lowestCurrentSpend = tools.reduce((min, t) => Math.min(min, t.monthlySpend), Infinity);

  let alternativeTool: string | null = null;
  let alternativeEvidence: string | null = null;

  for (const [toolName, cheapestExpected] of Object.entries(cheapestPerTool)) {
    // Only consider alternatives that are materially cheaper than your cheapest current spend
    if (cheapestExpected < lowestCurrentSpend * 0.7) {
      alternativeTool = toolName;
      alternativeEvidence = `Modeled cheapest tier for ${toolName} ≈ $${cheapestExpected.toFixed(0)}/mo vs your cheapest current spend $${lowestCurrentSpend.toFixed(0)}/mo.`;
      break;
    }
  }

  pricingFitAnswers.push({
    question: 'Substantially cheaper alternative',
    status: alternativeTool ? 'Yes' : 'Unknown',
    evidence:
      alternativeTool && alternativeEvidence
        ? `Cheaper alternative tool detected. ${alternativeEvidence}`
        : 'No substantially cheaper alternative detected with the limited modeled pricing and your provided spend values.',
    recommendation:
      alternativeTool
        ? `Evaluate replacing a portion of your ${tools[0]?.toolName ?? 'current'} usage with ${alternativeTool} at its lowest modeled tier, then re-run the audit.`
        : 'Provide more tools/spend inputs (and actual plan pricing details) to surface stronger cross-vendor alternatives.',
  });

  // 4) Paying retail vs credits (inputs don’t distinguish)
  const hasAPIDirect = tools.some((t) => t.plan === 'APIdirect' || t.plan === 'API');
  const anySpendEntered = tools.some((t) => t.monthlySpend > 0);

  pricingFitAnswers.push({
    question: 'Paying retail vs credits',
    status: hasAPIDirect && anySpendEntered ? 'Unknown' : 'Unknown',
    evidence:
      'This audit inputs include monthly spend, but do not indicate whether that spend is prepaid credits vs retail usage charges. The calculation cannot confirm the mechanism.',
    recommendation:
      'If your API usage supports prepaid credits, check whether you can switch from pay-as-you-go retail billing to credits/prepaid to reduce effective unit cost, then update monthly spend and re-run.',
  });

  const totalMonthlySavings = recommendations.reduce((sum, rec) => sum + rec.monthlySavings, 0);
  const totalAnnualSavings = totalMonthlySavings * 12;
  const isFullyOptimized = recommendations.length === 0;

  return {
    recommendations,
    pricingFitAnswers,
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

