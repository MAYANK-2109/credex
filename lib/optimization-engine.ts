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

type VolumeDiscount = {
  minSeats: number;
  seatPrice: number;
};

type PricingTier = {
  seatPrice?: number;
  flatPrice?: number;
  minSeats?: number;
  minPrice?: number;
  volumeDiscounts?: VolumeDiscount[];
};

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
  paybackMonths?: number;
}

export type PricingFitDetail = {
  toolName: string;
  currentPlan: string;
  currentCost: number;
  suggestedPlan?: string;
  suggestedCost?: number;
  savingsAmount?: number;
  explanation: string;
};

export type PricingFitAnswer = {
  question:
    | 'Right plan for usage'
    | 'Cheaper plan from same vendor'
    | 'Substantially cheaper alternative'
    | 'Paying retail vs credits';
  status: 'Yes' | 'No' | 'Unknown';
  evidence: string;
  recommendation: string;
  details: PricingFitDetail[];
};

export interface OptimizationResult {
  recommendations: Recommendation[];
  pricingFitAnswers: PricingFitAnswer[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  currentMonthlySpend: number;
  currentAnnualSpend: number;
  wasteScore: number;
  wasteCategory: string;
  wasteBreakdown: string;
  isFullyOptimized: boolean;
}

const TOOL_PLAN_PRICING: Record<string, Record<string, PricingTier>> = {
  Cursor: {
    Hobby: { flatPrice: 35 },
    Pro: { seatPrice: 20 },
    Business: { seatPrice: 18, minSeats: 10 },
    Enterprise: { seatPrice: 16, minSeats: 25 },
  },
  'GitHub Copilot': {
    Individual: { flatPrice: 10 },
    Business: {
      seatPrice: 19,
      volumeDiscounts: [{ minSeats: 50, seatPrice: 15 }],
    },
    Enterprise: {
      seatPrice: 21,
      volumeDiscounts: [{ minSeats: 50, seatPrice: 18 }],
    },
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
    Team: { seatPrice: 20, minPrice: 200 },
    Enterprise: { seatPrice: 30 },
    APIdirect: {},
  },
  Gemini: {
    Pro: { seatPrice: 25 },
    Ultra: { seatPrice: 45 },
    API: {},
  },
};

/**
 * Capability categories for cross-tool alternative comparison.
 * Each tool belongs to one or more categories.
 */
const TOOL_CATEGORIES: Record<string, string[]> = {
  Cursor: ['coding'],
  'GitHub Copilot': ['coding'],
  Claude: ['chat', 'writing', 'research'],
  ChatGPT: ['chat', 'writing', 'research'],
  Gemini: ['chat', 'research'],
  'Anthropic API': ['api'],
  'OpenAI API': ['api'],
};

function estimateExpectedSpend(config: ToolConfig): number | null {
  const planPricing = TOOL_PLAN_PRICING[config.toolName]?.[config.plan];
  if (!planPricing) return null;
  if (planPricing.flatPrice !== undefined) return planPricing.flatPrice;

  let seatPrice = planPricing.seatPrice;
  if (seatPrice === undefined) return null;

  if (planPricing.volumeDiscounts && planPricing.volumeDiscounts.length > 0) {
    const bestVolume = planPricing.volumeDiscounts
      .filter((discount) => config.seats >= discount.minSeats)
      .sort((a, b) => a.seatPrice - b.seatPrice)[0];
    if (bestVolume) {
      seatPrice = Math.min(seatPrice, bestVolume.seatPrice);
    }
  }

  let expected = config.seats * seatPrice;
  if (planPricing.minPrice !== undefined && expected < planPricing.minPrice) {
    expected = planPricing.minPrice;
  }

  return expected;
}

/**
 * CLAUDE TEAM FLOOR RULE
 * If tool === 'Claude' && plan === 'Team' && seats < 5
 * -> Recommend downgrade to Pro
 */
function checkClaudeTeamFloor(config: ToolConfig, isRegulatedIndustry: boolean): Recommendation | null {
  if (config.toolName === 'Claude' && config.plan === 'Team' && config.seats < 5) {
    const recommendedSpend = config.seats * 20; // Pro tier: $20/seat
    const monthlySavings = config.monthlySpend - recommendedSpend;

    if (isRegulatedIndustry) {
      return {
        toolId: config.toolId,
        toolName: 'Claude',
        currentSpend: config.monthlySpend,
        recommendedAction: 'Do not downgrade Claude Team in regulated environments',
        monthlySavings: 0,
        reason:
          'Claude Team provides audit logs, admin controls, and compliance reporting that Pro does not. Downgrading would introduce regulatory risk.',
      };
    }

    return {
      toolId: config.toolId,
      toolName: 'Claude',
      currentSpend: config.monthlySpend,
      recommendedAction: `Downgrade to Pro ($20/seat) for ${config.seats} seats`,
      monthlySavings,
      reason:
        'Claude Team tier has a strict 5-seat minimum billing floor. This plan is legacy and should be evaluated for compliance needs before downgrading.',
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
 * Cursor + Copilot overlap check with switching cost and payback reasoning.
 */
function assessCursorCopilotOverlap(
  configs: ToolConfig[],
  teamSize: number,
  primaryUseCase: UseCase
): Recommendation | null {
  const cursorConfig = configs.find((c) => c.toolName === 'Cursor');
  const copilotConfig = configs.find((c) => c.toolName === 'GitHub Copilot');
  if (!cursorConfig || !copilotConfig || cursorConfig.monthlySpend <= 0 || copilotConfig.monthlySpend <= 0) {
    return null;
  }

  const combinedSpend = cursorConfig.monthlySpend + copilotConfig.monthlySpend;
  if (combinedSpend <= 1000) {
    return {
      toolId: copilotConfig.toolId,
      toolName: 'GitHub Copilot',
      currentSpend: copilotConfig.monthlySpend,
      recommendedAction: 'Monitor Copilot and Cursor usage before consolidating',
      monthlySavings: 0,
      reason:
        'Total spend on Cursor + Copilot is under $1,000/mo. Verify usage patterns first — ID-based features and workflows may justify both tools.',
    };
  }

  const switchingCost = teamSize * 150;
  const monthlySavings = Math.round(copilotConfig.monthlySpend * 0.4);
  const paybackMonths = monthlySavings > 0 ? +(switchingCost / monthlySavings).toFixed(1) : Infinity;
  const sixMonthSavings = monthlySavings * 6;

  if (sixMonthSavings < switchingCost) {
    return {
      toolId: copilotConfig.toolId,
      toolName: 'GitHub Copilot',
      currentSpend: copilotConfig.monthlySpend,
      recommendedAction: 'Do not consolidate Copilot with Cursor yet',
      monthlySavings: 0,
      reason:
        'Switching cost exceeds six months of estimated savings. Copilot provides enterprise audit logs, IDE integrations, and security controls that may justify keeping both tools.',
    };
  }

  if (paybackMonths < 3) {
    return {
      toolId: copilotConfig.toolId,
      toolName: 'GitHub Copilot',
      currentSpend: copilotConfig.monthlySpend,
      recommendedAction: 'Consolidate Copilot functions into Cursor where possible',
      monthlySavings,
      paybackMonths,
      reason:
        'Assume ~40% of Copilot spend is redundant when both tools are deployed. Include switching risk, retraining, and feature gap review. This consolidation pays back in less than 3 months.',
    };
  }

  return {
    toolId: copilotConfig.toolId,
    toolName: 'GitHub Copilot',
    currentSpend: copilotConfig.monthlySpend,
    recommendedAction: 'Hold consolidation until usage proof supports it',
    monthlySavings: 0,
    reason:
      `Estimated payback is ${paybackMonths} months. Confirm whether Copilot is used for IDE-native workflow, audit logs, and enterprise controls before reducing spend.`,
  };
}

/**
 * Claude + ChatGPT redundancy check with spend-based guidance and audit recommendation.
 */
function assessClaudeChatGptOverlap(configs: ToolConfig[]): Recommendation | null {
  const claudeConfig = configs.find((c) => c.toolName === 'Claude');
  const chatGptConfig = configs.find((c) => c.toolName === 'ChatGPT');
  if (!claudeConfig || !chatGptConfig || chatGptConfig.monthlySpend <= 0) {
    return null;
  }

  const claudeSpend = claudeConfig.monthlySpend;
  const chatGptSpend = chatGptConfig.monthlySpend;
  const spendDiff = Math.abs(claudeSpend - chatGptSpend);
  const relativeDiff = spendDiff / Math.max(claudeSpend, chatGptSpend, 1);

  if (claudeSpend > chatGptSpend) {
    return {
      toolId: chatGptConfig.toolId,
      toolName: 'ChatGPT',
      currentSpend: chatGptConfig.monthlySpend,
      recommendedAction: 'Consolidate ChatGPT usage into Claude where possible',
      monthlySavings: chatGptSpend,
      reason:
        'Claude spend is higher than ChatGPT spend, suggesting Claude is the preferred chat platform. Consolidating ChatGPT can save the full ChatGPT cost, but verify whether real-time web search or browser-based information is required.',
    };
  }

  if (chatGptSpend > claudeSpend) {
    const potentialSavings = claudeConfig.plan !== 'Free' ? claudeSpend : 0;
    return {
      toolId: claudeConfig.toolId,
      toolName: 'Claude',
      currentSpend: claudeConfig.monthlySpend,
      recommendedAction: 'Keep ChatGPT for live search and downgrade Claude if usage is limited',
      monthlySavings: potentialSavings,
      reason:
        'ChatGPT appears to be the primary conversational tool. Downgrading Claude to Free can save the paid Claude cost, but preserve Claude for long-form analysis or compliance-heavy workflows if needed.',
    };
  }

  if (relativeDiff < 0.15) {
    return {
      toolId: claudeConfig.toolId,
      toolName: 'Claude',
      currentSpend: claudeConfig.monthlySpend + chatGptConfig.monthlySpend,
      recommendedAction: 'Run a 30-day usage audit before consolidating cross-platform chat tools',
      monthlySavings: 0,
      reason:
        'Claude and ChatGPT spend are similar. This is a tie-breaker case that requires usage data and capability mapping before recommending consolidation.',
    };
  }

  return null;
}

/**
 * CROSS-TOOL REDUNDANCY CHECK
 * If tools include both 'Cursor' and 'GitHub Copilot' or both 'Claude' and 'ChatGPT',
 * identify overlap in core productivity tooling.
 */
function checkCrossToolRedundancy(
  configs: ToolConfig[],
  primaryUseCase: UseCase,
  teamSize: number
): Recommendation | null {
  const cursorCopilot = assessCursorCopilotOverlap(configs, teamSize, primaryUseCase);
  if (cursorCopilot) {
    return cursorCopilot;
  }

  const claudeChatGpt = assessClaudeChatGptOverlap(configs);
  if (claudeChatGpt) {
    return claudeChatGpt;
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
    const repeatablePortion = 0.25;
    const cacheEligibleSpend = config.monthlySpend * repeatablePortion;
    const realisticSavings = Math.round(cacheEligibleSpend * 0.85); // 85% on repeated prompts
    const implementationCost = 1200;
    const paybackMonths = realisticSavings > 0 ? +(implementationCost / realisticSavings).toFixed(1) : Infinity;

    if (realisticSavings <= 40) {
      return {
        toolId: config.toolId,
        toolName: config.toolName,
        currentSpend: config.monthlySpend,
        recommendedAction: `Do not prioritize prompt caching yet`,
        monthlySavings: 0,
        reason:
          'Estimated prompt caching savings are too small relative to implementation effort. Only repetitive queries (top 10%) realize material discounts.',
      };
    }

    return {
      toolId: config.toolId,
      toolName: config.toolName,
      currentSpend: config.monthlySpend,
      recommendedAction: `Implement prompt caching for repeat API queries`,
      monthlySavings: realisticSavings,
      paybackMonths,
      reason:
        `Assume ~25% of spend is repeatable and up to 85% of that can be cached. Estimated savings: $${realisticSavings}/mo. Setup cost is ~$${implementationCost}, payback in ${paybackMonths} months. Verify your usage pattern before proceeding.`,
    };
  }
  return null;
}

function calculateWasteScore(tools: ToolConfig[]): { score: number; category: string; breakdown: string } {
  if (tools.length === 0) {
    return { score: 0, category: 'Optimized', breakdown: 'No tools provided.' };
  }

  const overspendRatios: number[] = [];
  let overlapCount = 0;
  let unusedPlans = 0;

  for (const tool of tools) {
    const expected = estimateExpectedSpend(tool);
    if (expected !== null && expected > 0 && tool.monthlySpend > expected) {
      overspendRatios.push((tool.monthlySpend - expected) / tool.monthlySpend);
    }
    if (tool.monthlySpend === 0) {
      unusedPlans += 1;
    }
  }

  const categoryPairs: Record<string, string[]> = {
    Cursor: ['coding'],
    'GitHub Copilot': ['coding'],
    Claude: ['chat', 'writing', 'research'],
    ChatGPT: ['chat', 'writing', 'research'],
    Gemini: ['chat', 'research'],
  };

  for (let i = 0; i < tools.length; i += 1) {
    for (let j = i + 1; j < tools.length; j += 1) {
      const a = tools[i];
      const b = tools[j];
      const categoriesA = categoryPairs[a.toolName] ?? [];
      const categoriesB = categoryPairs[b.toolName] ?? [];
      if (categoriesA.some((c) => categoriesB.includes(c))) {
        overlapCount += 1;
      }
    }
  }

  const overspendPct = overspendRatios.length > 0 ? overspendRatios.reduce((a, b) => a + b, 0) / overspendRatios.length : 0;
  const redundancyRatio = Math.min(1, overlapCount / Math.max(1, tools.length - 1));
  const unusedPct = unusedPlans / tools.length;
  const score = Math.min(1, overspendPct * 0.3 + redundancyRatio * 0.4 + unusedPct * 0.3);
  const category = score > 0.6 ? 'High Waste' : score >= 0.3 ? 'Moderate Waste' : 'Optimized';
  const breakdown = `waste score = (${(overspendPct * 100).toFixed(0)}% overspend * 0.3) + (${(redundancyRatio * 100).toFixed(0)}% redundancy * 0.4) + (${(unusedPct * 100).toFixed(0)}% unused * 0.3) = ${(score * 100).toFixed(0)}%`;

  return { score, category, breakdown };
}

// =========================================================================
// PRICING FIT QUESTION ENGINES
// =========================================================================

/**
 * Q1 — "Right plan for usage?"
 * Detect overkill: plans that are oversized for the user's actual seat count / usage.
 */
function evaluateRightPlanForUsage(tools: ToolConfig[]): PricingFitAnswer {
  const details: PricingFitDetail[] = [];
  const issues: string[] = [];

  for (const t of tools) {
    const expected = estimateExpectedSpend(t);

    // Claude Team with < 5 seats → overkill (5-seat billing floor)
    if (t.toolName === 'Claude' && t.plan === 'Team' && t.seats < 5) {
      const proCost = t.seats * 20;
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        suggestedPlan: 'Pro',
        suggestedCost: proCost,
        savingsAmount: t.monthlySpend - proCost,
        explanation: `Team plan bills a minimum of 5 seats ($120/mo) even for ${t.seats} user${t.seats > 1 ? 's' : ''}. Pro at $20/seat is right-sized.`,
      });
      issues.push(`Claude Team is overkill for ${t.seats} seat(s)`);
      continue;
    }

    // Cursor Business with < 10 seats → overkill
    if (t.toolName === 'Cursor' && t.plan === 'Business' && t.seats < 10) {
      const proCost = t.seats * 20;
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        suggestedPlan: 'Pro',
        suggestedCost: proCost,
        savingsAmount: t.monthlySpend - proCost,
        explanation: `Business plan economics start at 10+ seats. With ${t.seats} seat(s), Pro ($20/seat) is more cost-effective.`,
      });
      issues.push(`Cursor Business is overkill for ${t.seats} seat(s)`);
      continue;
    }

    // Cursor Enterprise with < 25 seats → overkill
    if (t.toolName === 'Cursor' && t.plan === 'Enterprise' && t.seats < 25) {
      const proCost = t.seats * 20;
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        suggestedPlan: 'Pro',
        suggestedCost: proCost,
        savingsAmount: t.monthlySpend - proCost,
        explanation: `Enterprise plan requires 25+ seats. With ${t.seats} seat(s), Pro ($20/seat) avoids overpaying.`,
      });
      issues.push(`Cursor Enterprise is overkill for ${t.seats} seat(s)`);
      continue;
    }

    // ChatGPT Team with 1 seat → overkill (Plus is $20 flat)
    if (t.toolName === 'ChatGPT' && t.plan === 'Team' && t.seats <= 1) {
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        suggestedPlan: 'Plus',
        suggestedCost: 20,
        savingsAmount: t.monthlySpend - 20,
        explanation: `Team plan is designed for collaborative use. A solo user gets the same models with Plus at $20/mo.`,
      });
      issues.push(`ChatGPT Team is overkill for a single user`);
      continue;
    }

    // ChatGPT Enterprise with ≤ 5 seats → overkill
    if (t.toolName === 'ChatGPT' && t.plan === 'Enterprise' && t.seats <= 5) {
      const teamCost = t.seats * 20;
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        suggestedPlan: 'Team',
        suggestedCost: teamCost,
        savingsAmount: t.monthlySpend - teamCost,
        explanation: `Enterprise plan ($30/seat) is designed for large orgs. For ${t.seats} seat(s), Team ($20/seat) provides similar capabilities.`,
      });
      issues.push(`ChatGPT Enterprise is overkill for ${t.seats} seat(s)`);
      continue;
    }

    // Copilot Enterprise with ≤ 5 seats → overkill
    if (t.toolName === 'GitHub Copilot' && t.plan === 'Enterprise' && t.seats <= 5) {
      const businessCost = t.seats * 19;
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        suggestedPlan: 'Business',
        suggestedCost: businessCost,
        savingsAmount: t.monthlySpend - businessCost,
        explanation: `Enterprise ($21/seat) adds fine-tuning and policy controls most small teams don't need. Business ($19/seat) covers core code completion.`,
      });
      issues.push(`Copilot Enterprise is overkill for ${t.seats} seat(s)`);
      continue;
    }

    // Gemini Ultra when Pro would suffice (low spend relative to seat count)
    if (t.toolName === 'Gemini' && t.plan === 'Ultra') {
      const proCost = t.seats * 25;
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        suggestedPlan: 'Pro',
        suggestedCost: proCost,
        savingsAmount: t.monthlySpend - proCost,
        explanation: `Ultra ($45/seat) provides higher rate limits and advanced features. Evaluate whether Pro ($25/seat) meets your actual needs.`,
      });
      issues.push(`Gemini Ultra may be overkill — evaluate Pro tier`);
      continue;
    }

    // Claude Max with 1 seat for light usage → Pro is cheaper
    if (t.toolName === 'Claude' && t.plan === 'Max' && t.seats <= 1) {
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        suggestedPlan: 'Pro',
        suggestedCost: 20,
        savingsAmount: t.monthlySpend - 20,
        explanation: `Max ($35/mo) adds higher usage limits. If you're not consistently hitting Pro's limits, Pro ($20/mo) saves $15/mo.`,
      });
      issues.push(`Claude Max may be overkill for a single user`);
      continue;
    }

    // Claude Enterprise with small team → Team may suffice
    if (t.toolName === 'Claude' && t.plan === 'Enterprise' && t.seats >= 5 && t.seats <= 15) {
      const teamCost = t.seats * 24;
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        suggestedPlan: 'Team',
        suggestedCost: teamCost,
        savingsAmount: t.monthlySpend - teamCost,
        explanation: `Enterprise ($35/seat) adds SSO, admin controls and higher limits. For ${t.seats} seats, Team ($24/seat) may cover your needs.`,
      });
      issues.push(`Claude Enterprise may be overkill for ${t.seats} seat(s)`);
      continue;
    }

    // General overspend detection: paying 50%+ more than expected list price
    if (expected !== null && expected > 0 && t.monthlySpend > expected * 1.5) {
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        suggestedPlan: t.plan,
        suggestedCost: expected,
        savingsAmount: t.monthlySpend - expected,
        explanation: `You're paying $${t.monthlySpend}/mo but the expected cost for ${t.plan} with ${t.seats} seat(s) is ~$${expected.toFixed(0)}/mo. Verify your billing.`,
      });
      issues.push(`${t.toolName} spend is 50%+ above expected list price`);
      continue;
    }

    // Plan is well-sized
    details.push({
      toolName: t.toolName,
      currentPlan: t.plan,
      currentCost: t.monthlySpend,
      explanation: expected !== null
        ? `${t.plan} at $${t.monthlySpend}/mo for ${t.seats} seat(s) is well-matched (expected ~$${expected.toFixed(0)}/mo).`
        : `${t.plan} appears appropriately sized for your usage.`,
    });
  }

  const hasIssues = issues.length > 0;
  return {
    question: 'Right plan for usage',
    status: hasIssues ? 'No' : 'Yes',
    evidence: hasIssues
      ? `${issues.length} plan(s) are over-sized for your actual usage: ${issues.join('; ')}.`
      : 'All selected plans are appropriately sized for your team and seat count.',
    recommendation: hasIssues
      ? 'Downgrade the flagged plans to save money without losing capabilities you actually use.'
      : 'No changes needed — your plans are right-sized.',
    details,
  };
}

/**
 * Q2 — "Cheaper plan from same vendor?"
 * For each tool, find the cheapest compatible tier from the same vendor.
 */
function evaluateCheaperSameVendor(tools: ToolConfig[]): PricingFitAnswer {
  const details: PricingFitDetail[] = [];
  const findings: string[] = [];

  for (const t of tools) {
    const toolPricing = TOOL_PLAN_PRICING[t.toolName];
    if (!toolPricing) {
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        explanation: 'No pricing data available for this tool — cannot compare tiers.',
      });
      continue;
    }

    const currentExpected = estimateExpectedSpend(t);
    // Use actual spend if expected is unknown (e.g. APIdirect)
    const currentCostRef = currentExpected ?? t.monthlySpend;

    // Build list of compatible alternative tiers
    const candidates: { plan: string; expected: number }[] = [];
    for (const [planName, p] of Object.entries(toolPricing)) {
      if (!p) continue;
      if (p.flatPrice === undefined && p.seatPrice === undefined) continue;
      // Only tiers that are compatible with this seat count
      if (p.minSeats !== undefined && t.seats < p.minSeats) continue;

      const expected = p.flatPrice !== undefined ? p.flatPrice : t.seats * (p.seatPrice ?? 0);
      if (typeof expected === 'number' && isFinite(expected)) {
        candidates.push({ plan: planName, expected });
      }
    }

    if (candidates.length === 0) {
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        explanation: 'API/usage-based pricing — no fixed-tier alternatives to compare.',
      });
      continue;
    }

    const cheapest = candidates.reduce((a, b) => (a.expected < b.expected ? a : b));

    if (cheapest.plan === t.plan || currentCostRef <= cheapest.expected * 1.05) {
      // Already on cheapest or within 5%
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        explanation: `Already on the most cost-effective tier. ${t.plan} at ~$${currentCostRef.toFixed(0)}/mo is optimal among ${candidates.length} available plan(s).`,
      });
    } else {
      const savings = currentCostRef - cheapest.expected;
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        suggestedPlan: cheapest.plan,
        suggestedCost: cheapest.expected,
        savingsAmount: Math.round(savings),
        explanation: `${t.plan} (~$${currentCostRef.toFixed(0)}/mo) is more expensive than ${cheapest.plan} (~$${cheapest.expected.toFixed(0)}/mo) for ${t.seats} seat(s). Switch to save ~$${savings.toFixed(0)}/mo.`,
      });
      findings.push(`${t.toolName}: ${t.plan} → ${cheapest.plan} (save ~$${savings.toFixed(0)}/mo)`);
    }
  }

  const hasFindings = findings.length > 0;
  return {
    question: 'Cheaper plan from same vendor',
    status: hasFindings ? 'No' : 'Yes',
    evidence: hasFindings
      ? `Cheaper tiers found: ${findings.join('; ')}.`
      : 'No cheaper same-vendor tiers detected — you are on the most cost-effective plans.',
    recommendation: hasFindings
      ? 'Downgrade to the suggested tiers to reduce cost while keeping the same vendor.'
      : 'Keep your current tiers — they are cost-competitive.',
    details,
  };
}

/**
 * Q3 — "Substantially cheaper alternative tool?"
 * Group tools by capability category (coding, chat, api) and find cheaper cross-vendor options.
 */
function evaluateCheaperAlternative(tools: ToolConfig[]): PricingFitAnswer {
  const details: PricingFitDetail[] = [];
  const findings: string[] = [];

  // For each tool the user selected, find alternatives in the same capability category
  for (const t of tools) {
    const toolCategories = TOOL_CATEGORIES[t.toolName];
    if (!toolCategories || toolCategories.length === 0) {
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        explanation: 'No category mapping available — cannot compare alternatives.',
      });
      continue;
    }

    const currentExpected = estimateExpectedSpend(t);
    const currentCostRef = currentExpected ?? t.monthlySpend;

    if (currentCostRef <= 0) {
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        explanation: 'No spend detected — enter actual spend to compare alternatives.',
      });
      continue;
    }

    // Find all alternative tools in the same category
    let cheapestAlt: { toolName: string; plan: string; cost: number } | null = null;

    for (const [altToolName, altPricing] of Object.entries(TOOL_PLAN_PRICING)) {
      if (altToolName === t.toolName) continue; // skip self
      const altCategories = TOOL_CATEGORIES[altToolName];
      if (!altCategories) continue;

      // Check if any category overlaps
      const hasOverlap = toolCategories.some((c) => altCategories.includes(c));
      if (!hasOverlap) continue;

      // Find cheapest plan for this alternative tool at the same seat count
      for (const [planName, p] of Object.entries(altPricing)) {
        if (!p) continue;
        if (p.flatPrice === undefined && p.seatPrice === undefined) continue;
        if (p.minSeats !== undefined && t.seats < p.minSeats) continue;

        const cost = p.flatPrice !== undefined ? p.flatPrice : t.seats * (p.seatPrice ?? 0);
        if (typeof cost === 'number' && isFinite(cost)) {
          if (!cheapestAlt || cost < cheapestAlt.cost) {
            cheapestAlt = { toolName: altToolName, plan: planName, cost };
          }
        }
      }
    }

    if (cheapestAlt && cheapestAlt.cost < currentCostRef * 0.7) {
      // ≥ 30% cheaper
      const savings = currentCostRef - cheapestAlt.cost;
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        suggestedPlan: `${cheapestAlt.toolName} ${cheapestAlt.plan}`,
        suggestedCost: cheapestAlt.cost,
        savingsAmount: Math.round(savings),
        explanation: `${cheapestAlt.toolName} (${cheapestAlt.plan}) at ~$${cheapestAlt.cost.toFixed(0)}/mo provides similar ${toolCategories[0]} capabilities and is ${Math.round((1 - cheapestAlt.cost / currentCostRef) * 100)}% cheaper.`,
      });
      findings.push(`${t.toolName} → ${cheapestAlt.toolName} ${cheapestAlt.plan} (save ~$${savings.toFixed(0)}/mo)`);
    } else if (cheapestAlt) {
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        explanation: `Cheapest alternative is ${cheapestAlt.toolName} (${cheapestAlt.plan}) at ~$${cheapestAlt.cost.toFixed(0)}/mo — not substantially cheaper (< 30% difference).`,
      });
    } else {
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        explanation: 'No alternative tools with comparable capabilities found in our pricing model.',
      });
    }
  }

  const hasFindings = findings.length > 0;
  return {
    question: 'Substantially cheaper alternative',
    status: hasFindings ? 'Yes' : (tools.length > 0 ? 'No' : 'Unknown'),
    evidence: hasFindings
      ? `Cheaper alternative tools found: ${findings.join('; ')}.`
      : 'No substantially cheaper alternatives detected (all alternatives are within 30% of current cost).',
    recommendation: hasFindings
      ? 'Evaluate the suggested alternatives — they provide similar capabilities at materially lower cost.'
      : 'Your current tools are price-competitive within their category.',
    details,
  };
}

/**
 * Q4 — "Paying retail when they could get the same thing through credits?"
 * Detect when seat-based retail plans could be replaced with API/credits for savings.
 */
function evaluateRetailVsCredits(tools: ToolConfig[]): PricingFitAnswer {
  const details: PricingFitDetail[] = [];
  const findings: string[] = [];

  for (const t of tools) {
    // Already on API/credits — no retail premium
    if (t.plan === 'APIdirect' || t.plan === 'API') {
      details.push({
        toolName: t.toolName,
        currentPlan: t.plan,
        currentCost: t.monthlySpend,
        explanation: 'Already on API/usage-based pricing — no retail markup detected.',
      });
      continue;
    }

    // Claude Pro/Max/Team with high spend → could use Claude Haiku API or Anthropic API with prompt caching
    if (t.toolName === 'Claude' && ['Pro', 'Max', 'Team', 'Enterprise'].includes(t.plan)) {
      if (t.monthlySpend >= 100) {
        const estimatedHaikuCost = Math.round(t.monthlySpend * 0.30);
        details.push({
          toolName: t.toolName,
          currentPlan: t.plan,
          currentCost: t.monthlySpend,
          suggestedPlan: 'Claude Haiku API + prompt caching',
          suggestedCost: estimatedHaikuCost,
          savingsAmount: t.monthlySpend - estimatedHaikuCost,
          explanation: `At $${t.monthlySpend}/mo on ${t.plan}, routing repeatable workloads through Claude Haiku API ($0.80/$4 per 1M tokens) can often cut effective costs significantly for low-complexity use cases.`,
        });
        findings.push(`${t.toolName} ${t.plan}: ~$${t.monthlySpend - estimatedHaikuCost}/mo savings via Claude Haiku API`);
      } else {
        details.push({
          toolName: t.toolName,
          currentPlan: t.plan,
          currentCost: t.monthlySpend,
          explanation: `At $${t.monthlySpend}/mo, seat plan convenience may outweigh API integration overhead unless you have highly repeatable queries.`,
        });
      }
      continue;
    }

    // ChatGPT Plus/Team with significant spend → could route via OpenAI API o1-preview
    if (t.toolName === 'ChatGPT' && ['Plus', 'Team', 'Enterprise'].includes(t.plan)) {
      if (t.monthlySpend >= 80) {
        const estimatedAPICost = Math.round(t.monthlySpend * 0.35);
        details.push({
          toolName: t.toolName,
          currentPlan: t.plan,
          currentCost: t.monthlySpend,
          suggestedPlan: 'OpenAI o1-preview API',
          suggestedCost: estimatedAPICost,
          savingsAmount: t.monthlySpend - estimatedAPICost,
          explanation: `With $${t.monthlySpend}/mo on ${t.plan}, token-based OpenAI o1-preview ($15/M input, $60/M output) may be cheaper for developer-facing workloads than seat-based retail pricing.`,
        });
        findings.push(`${t.toolName} ${t.plan}: ~$${t.monthlySpend - estimatedAPICost}/mo savings via OpenAI o1-preview`);
      } else {
        details.push({
          toolName: t.toolName,
          currentPlan: t.plan,
          currentCost: t.monthlySpend,
          explanation: `At $${t.monthlySpend}/mo, ${t.plan} provides non-API convenience that often outweighs the integration cost.`,
        });
      }
      continue;
    }

    // Gemini Pro/Ultra → Google Cloud committed-use discounts
    if (t.toolName === 'Gemini' && ['Pro', 'Ultra'].includes(t.plan)) {
      if (t.monthlySpend >= 50) {
        const estimatedCreditCost = Math.round(t.monthlySpend * 0.45);
        details.push({
          toolName: t.toolName,
          currentPlan: t.plan,
          currentCost: t.monthlySpend,
          suggestedPlan: 'Google Cloud AI credits',
          suggestedCost: estimatedCreditCost,
          savingsAmount: t.monthlySpend - estimatedCreditCost,
          explanation: `At $${t.monthlySpend}/mo on ${t.plan}, Google Cloud committed-use discounts or Vertex AI pricing could reduce costs to ~$${estimatedCreditCost}/mo.`,
        });
        findings.push(`${t.toolName} ${t.plan}: ~$${t.monthlySpend - estimatedCreditCost}/mo savings via Cloud credits`);
      } else {
        details.push({
          toolName: t.toolName,
          currentPlan: t.plan,
          currentCost: t.monthlySpend,
          explanation: `At $${t.monthlySpend}/mo, retail ${t.plan} pricing is reasonable for your usage level.`,
        });
      }
      continue;
    }

    // Tools without API alternatives (Cursor, Copilot, etc.)
    details.push({
      toolName: t.toolName,
      currentPlan: t.plan,
      currentCost: t.monthlySpend,
      explanation: `${t.toolName} doesn't offer an API/credit-based alternative — seat pricing is the standard model.`,
    });
  }

  const hasFindings = findings.length > 0;
  return {
    question: 'Paying retail vs credits',
    status: hasFindings ? 'Yes' : 'No',
    evidence: hasFindings
      ? `Retail-to-credits savings opportunities found: ${findings.join('; ')}.`
      : 'No significant retail-vs-credits savings detected — your current pricing models are appropriate.',
    recommendation: hasFindings
      ? 'Explore API/credit-based pricing for tools with high spend. This requires some integration work but can yield substantial savings.'
      : 'Your current plan types are appropriate for your spend levels.',
    details,
  };
}

// =========================================================================
// MAIN ENGINE
// =========================================================================

/**
 * Main optimization engine
 * Returns all recommendations and total savings
 */
export function optimizeToolStack(
  tools: ToolConfig[],
  teamSize: number = 1,
  primaryUseCase: UseCase = 'mixed',
  isRegulatedIndustry: boolean = false
): OptimizationResult {
  const recommendations: Recommendation[] = [];
  const seenToolIds = new Set<string>();

  const currentMonthlySpend = tools.reduce((sum, tool) => sum + tool.monthlySpend, 0);
  const currentAnnualSpend = currentMonthlySpend * 12;

  // Check individual tool rules
  tools.forEach((config) => {
    const claudeTeam = checkClaudeTeamFloor(config, isRegulatedIndustry);
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
  const crossRedundancy = checkCrossToolRedundancy(tools, primaryUseCase, teamSize);
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
  // Pricing Plan Fit & Alternatives — using dedicated evaluator functions
  // ==============================
  const pricingFitAnswers: PricingFitAnswer[] = [
    evaluateRightPlanForUsage(tools),
    evaluateCheaperSameVendor(tools),
    evaluateCheaperAlternative(tools),
    evaluateRetailVsCredits(tools),
  ];

  const totalMonthlySavings = recommendations.reduce((sum, rec) => sum + rec.monthlySavings, 0);
  const totalAnnualSavings = totalMonthlySavings * 12;
  const isFullyOptimized = recommendations.length === 0;
  const waste = calculateWasteScore(tools);

  return {
    recommendations,
    pricingFitAnswers,
    totalMonthlySavings,
    totalAnnualSavings,
    currentMonthlySpend,
    currentAnnualSpend,
    wasteScore: waste.score,
    wasteCategory: waste.category,
    wasteBreakdown: waste.breakdown,
    isFullyOptimized,
  };
}

/**
 * Helper: Get pricing tier display name
 */
export function getPricingTierName(toolName: string, plan: string): string {
  return `${toolName} ${plan}`;
}
