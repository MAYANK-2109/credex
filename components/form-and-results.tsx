'use client';

import React from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import type { UseCase, ToolConfig, Recommendation } from '@/lib/optimization-engine';

/* ============================================================================
   INPUT COMPONENTS
   ============================================================================ */

interface TeamSizeInputProps {
  value: number;
  onChange: (value: number) => void;
}

export function TeamSizeInput({ value, onChange }: TeamSizeInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-900">
        Team Size
      </label>
      <input
        type="number"
        min="1"
        max="500"
        value={value}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-100"
      />
    </div>
  );
}

interface UseCaseSelectProps {
  value: UseCase;
  onChange: (value: UseCase) => void;
}

export function UseCaseSelect({ value, onChange }: UseCaseSelectProps) {
  const usecases: UseCase[] = ['coding', 'writing', 'data', 'research', 'mixed'];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-900">
        Primary Use Case
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as UseCase)}
          className="w-full appearance-none rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-100"
        >
          {usecases.map((uc) => (
            <option key={uc} value={uc}>
              {uc.charAt(0).toUpperCase() + uc.slice(1)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  );
}

/* ============================================================================
   TOOL GRID COMPONENT
   ============================================================================ */

interface ToolGridProps {
  selectedTools: ToolConfig[];
  onAdd: (tool: ToolConfig) => void;
  onRemove: (toolId: string) => void;
  onUpdate: (toolId: string, updates: Partial<ToolConfig>) => void;
}

const TOOL_OPTIONS = [
  {
    name: 'Cursor',
    plans: ['Hobby', 'Pro', 'Business', 'Enterprise'],
  },
  {
    name: 'GitHub Copilot',
    plans: ['Individual', 'Business', 'Enterprise'],
  },
  {
    name: 'Claude',
    plans: ['Free', 'Pro', 'Max', 'Team', 'Enterprise', 'APIdirect'],
  },
  {
    name: 'ChatGPT',
    plans: ['Plus', 'Team', 'Enterprise', 'APIdirect'],
  },
  {
    name: 'Anthropic API',
    plans: ['APIdirect'],
  },
  {
    name: 'OpenAI API',
    plans: ['APIdirect'],
  },
  {
    name: 'Gemini',
    plans: ['Pro', 'Ultra', 'API'],
  },
  {
    name: 'Windsurf',
    plans: ['Standard'],
  },
];

export function ToolGrid({
  selectedTools,
  onAdd,
  onRemove,
  onUpdate,
}: ToolGridProps) {
  const selectedToolNames = new Set(selectedTools.map((t) => t.toolName));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">
        Active Tools & Plans
      </h3>

      {/* Available tools grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {TOOL_OPTIONS.map((tool) => {
          const isSelected = selectedToolNames.has(tool.name);
          return (
            <button
              key={tool.name}
              onClick={() => {
                if (isSelected) {
                  onRemove(tool.name.toLowerCase().replace(/\s+/g, '-'));
                } else {
                  onAdd({
                    toolId: tool.name.toLowerCase().replace(/\s+/g, '-'),
                    toolName: tool.name,
                    plan: tool.plans[0],
                    monthlySpend: 0,
                    seats: 1,
                  });
                }
              }}
              className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                isSelected
                  ? 'border-accent-600 bg-accent-50 text-accent-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
              }`}
            >
              {tool.name}
            </button>
          );
        })}
      </div>

      {/* Selected tools config cards */}
      <div className="space-y-3">
        {selectedTools.map((tool) => {
          const toolDef = TOOL_OPTIONS.find((t) => t.name === tool.toolName);
          return (
            <div
              key={tool.toolId}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">
                  {tool.toolName}
                </h4>
                <button
                  onClick={() => onRemove(tool.toolId)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {/* Plan selector */}
                <div>
                  <label className="text-xs text-slate-600">Plan</label>
                  <div className="relative">
                    <select
                      value={tool.plan}
                      onChange={(e) =>
                        onUpdate(tool.toolId, { plan: e.target.value })
                      }
                      className="mt-1 w-full appearance-none rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:border-accent-600 focus:outline-none"
                    >
                      {toolDef?.plans.map((plan) => (
                        <option key={plan} value={plan}>
                          {plan}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                {/* Monthly spend */}
                <div>
                  <label className="text-xs text-slate-600">
                    Monthly Spend ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tool.monthlySpend}
                    onChange={(e) =>
                      onUpdate(tool.toolId, {
                        monthlySpend: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-accent-600 focus:outline-none"
                  />
                </div>

                {/* Seats */}
                <div>
                  <label className="text-xs text-slate-600">Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={tool.seats}
                    onChange={(e) =>
                      onUpdate(tool.toolId, {
                        seats: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-accent-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   RESULTS COMPONENTS
   ============================================================================ */

interface ResultsHeroBannerProps {
  monthlySavings: number;
  annualSavings: number;
}

export function ResultsHeroBanner({
  monthlySavings,
  annualSavings,
}: ResultsHeroBannerProps) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-accent-600 to-accent-700 p-8 text-white shadow-lg sm:p-12">
      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide opacity-90">
        Total Potential Savings
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm opacity-75">Monthly</p>
          <p className="text-4xl font-bold sm:text-5xl">
            ${monthlySavings.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm opacity-75">Annually</p>
          <p className="text-4xl font-bold sm:text-5xl">
            ${annualSavings.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">
            {recommendation.toolName}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Current: ${recommendation.currentSpend.toLocaleString()}/mo
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
            Save
          </p>
          <p className="text-2xl font-bold text-green-600">
            ${recommendation.monthlySavings.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mb-3 space-y-1">
        <p className="text-sm font-medium text-slate-700">
          {recommendation.recommendedAction}
        </p>
      </div>

      <p className="text-xs text-slate-500">{recommendation.reason}</p>
    </div>
  );
}

interface OptimizedStateMessageProps {
  savings: number;
}

export function OptimizedStateMessage({ savings }: OptimizedStateMessageProps) {
  if (savings > 100) return null; // Show only when optimized

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
      <p className="font-semibold text-green-900">
        ✓ You&apos;re spending well. Your stack is fully optimized.
      </p>
      <p className="mt-2 text-sm text-green-700">
        Continue to monitor quarterly as your team evolves.
      </p>
    </div>
  );
}

/* ============================================================================
   CTA COMPONENTS
   ============================================================================ */

interface SavingsCTAProps {
  savings: number;
  onConsultationClick: () => void;
  onNotifyClick: () => void;
}

export function SavingsCTA({
  savings,
  onConsultationClick,
  onNotifyClick,
}: SavingsCTAProps) {
  if (savings > 500) {
    return (
      <button
        onClick={onConsultationClick}
        className="w-full rounded-lg bg-accent-600 px-6 py-3 font-semibold text-white transition-all hover:bg-accent-700 hover:shadow-lg active:scale-95"
      >
        Book a Credex Consultation
      </button>
    );
  }

  if (savings < 100) {
    return (
      <button
        onClick={onNotifyClick}
        className="w-full rounded-lg border-2 border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
      >
        Notify me when new optimizations apply
      </button>
    );
  }

  return null;
}

/* ============================================================================
   LEAD CAPTURE FORM
   ============================================================================ */

interface LeadCaptureFormProps {
  onSubmit: (data: LeadCaptureData) => void;
  isLoading: boolean;
  errorMessage?: string;
}

export interface LeadCaptureData {
  email: string;
  companyName: string;
  role: string;
  honeypot: string;
}

export function LeadCaptureForm({
  onSubmit,
  isLoading,
  errorMessage,
}: LeadCaptureFormProps) {
  const [formData, setFormData] = React.useState<LeadCaptureData>({
    email: '',
    companyName: '',
    role: '',
    honeypot: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check
    if (formData.honeypot) {
      console.log('Honeypot triggered');
      return;
    }

    // Email validation
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Full Name"
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-accent-600 focus:outline-none"
      />

      <input
        type="email"
        placeholder="Email (required)"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-accent-600 focus:outline-none"
      />

      <input
        type="text"
        placeholder="Company Name"
        value={formData.companyName}
        onChange={(e) =>
          setFormData({ ...formData, companyName: e.target.value })
        }
        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-accent-600 focus:outline-none"
      />

      {/* Honeypot field */}
      <input
        type="text"
        name="website"
        style={{ display: 'none' }}
        value={formData.honeypot}
        onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
        tabIndex={-1}
      />

      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
      >
        {isLoading ? 'Submitting...' : 'Download Full Report'}
      </button>
    </form>
  );
}
