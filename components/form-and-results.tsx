'use client';

import React, { useRef } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import type { UseCase, ToolConfig, Recommendation, OptimizationResult } from '@/lib/optimization-engine';
import { generateAuditPDF } from '@/lib/generate-pdf-report';
import styles from './credex.module.css';

/* ============================================================================
   INPUT COMPONENTS
   ============================================================================ */

interface TeamSizeInputProps {
  value: number;
  onChange: (value: number) => void;
}

export function TeamSizeInput({ value, onChange }: TeamSizeInputProps) {
  return (
    <div className={styles.formGroup}>
      <label htmlFor="team-size" className={styles.label}>Team Size</label>
      <input
        id="team-size"
        type="number"
        min="1"
        max="500"
        value={value}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        className={styles.input}
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
    <div className={styles.formGroup}>
      <label htmlFor="usecase" className={styles.label}>Primary Use Case</label>
      <div style={{ position: 'relative' }}>
        <select
          id="usecase"
          value={value}
          onChange={(e) => onChange(e.target.value as UseCase)}
          className={styles.input}
          style={{ appearance: 'none', paddingRight: '2rem' }}
        >
          {usecases.map((uc) => (
            <option key={uc} value={uc}>
              {uc.charAt(0).toUpperCase() + uc.slice(1)}
            </option>
          ))}
        </select>
        <ChevronDown
          style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }}
          size={16}
        />
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
  { name: 'Cursor', plans: ['Hobby', 'Pro', 'Business', 'Enterprise'] },
  { name: 'GitHub Copilot', plans: ['Individual', 'Business', 'Enterprise'] },
  { name: 'Claude', plans: ['Free', 'Pro', 'Max', 'Team', 'Enterprise', 'APIdirect'] },
  { name: 'ChatGPT', plans: ['Plus', 'Team', 'Enterprise', 'APIdirect'] },
  { name: 'Anthropic API', plans: ['APIdirect'] },
  { name: 'OpenAI API', plans: ['APIdirect'] },
  { name: 'Gemini', plans: ['Pro', 'Ultra', 'API'] },
  { name: 'Windsurf', plans: ['Standard'] },
  { name: 'v0', plans: ['Free', 'Premium', 'Enterprise'] },
];

export function ToolGrid({ selectedTools, onAdd, onRemove, onUpdate }: ToolGridProps) {
  const selectedToolNames = new Set(selectedTools.map((t) => t.toolName));

  return (
    <div>
      <div className={styles.label} style={{ marginBottom: '1rem' }}>Active Tools & Plans</div>

      {/* Available tools grid */}
      <div className={styles.toolGrid}>
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
              className={`${styles.toolButton} ${isSelected ? styles.toolButtonActive : ''}`}
            >
              {tool.name}
            </button>
          );
        })}
      </div>

      {/* Selected tools config cards */}
      <div style={{ marginTop: '2rem' }}>
        {selectedTools.map((tool) => {
          const toolDef = TOOL_OPTIONS.find((t) => t.name === tool.toolName);
          return (
            <div key={tool.toolId} className={styles.toolConfigCard}>
              <div className={styles.toolConfigHeader}>
                <span className={styles.toolConfigTitle}>{tool.toolName}</span>
                <button onClick={() => onRemove(tool.toolId)} className={styles.removeBtn}>
                  <Trash2 size={18} />
                </button>
              </div>

              <div className={styles.configGrid}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label htmlFor={`plan-${tool.toolId}`} className={styles.label} style={{ fontSize: '0.75rem' }}>Plan</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id={`plan-${tool.toolId}`}
                      value={tool.plan}
                      onChange={(e) => onUpdate(tool.toolId, { plan: e.target.value })}
                      className={styles.input}
                      style={{ padding: '0.5rem', appearance: 'none', paddingRight: '1.5rem' }}
                      aria-label={`Plan for ${tool.toolName}`}
                    >
                      {toolDef?.plans.map((plan) => (
                        <option key={plan} value={plan}>{plan}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label htmlFor={`spend-${tool.toolId}`} className={styles.label} style={{ fontSize: '0.75rem' }}>Monthly Spend ($)</label>
                  <input
                    id={`spend-${tool.toolId}`}
                    type="number"
                    min="0"
                    value={tool.monthlySpend}
                    onChange={(e) => onUpdate(tool.toolId, { monthlySpend: Math.max(0, parseInt(e.target.value) || 0) })}
                    className={styles.input}
                    style={{ padding: '0.5rem' }}
                    aria-label={`Monthly spend for ${tool.toolName}`}
                  />
                </div>

                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label htmlFor={`seats-${tool.toolId}`} className={styles.label} style={{ fontSize: '0.75rem' }}>Seats</label>
                  <input
                    id={`seats-${tool.toolId}`}
                    type="number"
                    min="1"
                    value={tool.seats}
                    onChange={(e) => onUpdate(tool.toolId, { seats: Math.max(1, parseInt(e.target.value) || 1) })}
                    className={styles.input}
                    style={{ padding: '0.5rem' }}
                    aria-label={`Seats for ${tool.toolName}`}
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

export function ResultsHeroBanner({ monthlySavings, annualSavings }: ResultsHeroBannerProps) {
  return (
    <div className={styles.heroBanner}>
      <h2 className={styles.heroLabel}>Total Potential Savings</h2>
      <div className={styles.metricsGrid}>
        <div>
          <p className={styles.metricLabel}>Monthly</p>
          <p className={`${styles.metricValue} ${monthlySavings > 500 ? styles.highlight : ''}`}>
            ${monthlySavings.toLocaleString()}
          </p>
        </div>
        <div>
          <p className={styles.metricLabel}>Annually</p>
          <p className={`${styles.metricValue} ${annualSavings > 6000 ? styles.highlight : ''}`}>
            ${annualSavings.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  index?: number;
}

export function RecommendationCard({ recommendation, index = 0 }: RecommendationCardProps) {
  return (
    <div className={styles.recCard}>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{recommendation.toolName}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Current Spend: ${recommendation.currentSpend.toLocaleString()}/mo
        </p>
        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{recommendation.recommendedAction}</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{recommendation.reason}</p>
        {recommendation.paybackMonths !== undefined ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Payback: {recommendation.paybackMonths} months
          </p>
        ) : null}
      </div>
      <div style={{ textAlign: 'right', paddingLeft: '2rem' }}>
        <p className={styles.recSaveLabel}>Save</p>
        <p className={styles.recSaveAmount}>${recommendation.monthlySavings.toLocaleString()}</p>
      </div>
    </div>
  );
}

export function OptimizedStateMessage({ savings }: { savings: number }) {
  if (savings > 100) return null;
  return (
    <div className={styles.optimizedMessage}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        ✨ You're spending well
      </h3>
      <p>Your AI tooling stack is currently optimized. Continue monitoring quarterly as your team evolves.</p>
    </div>
  );
}

/* ============================================================================
   PRICING FIT CARD — Expandable question card with per-tool details
   ============================================================================ */

import type { PricingFitAnswer } from '@/lib/optimization-engine';

interface PricingFitCardProps {
  answer: PricingFitAnswer;
}

const QUESTION_LABELS: Record<PricingFitAnswer['question'], string> = {
  'Right plan for usage': 'Are you on the right plan for your usage?',
  'Cheaper plan from same vendor': 'Is there a cheaper plan from the same vendor?',
  'Substantially cheaper alternative': 'Is there a substantially cheaper alternative tool?',
  'Paying retail vs credits': 'Are you paying retail when you could use credits?',
};

const STATUS_ICONS: Record<PricingFitAnswer['status'], string> = {
  Yes: '✅',
  No: '❌',
  Unknown: '❓',
};

const STATUS_LABELS: Record<string, Record<PricingFitAnswer['question'], string>> = {
  Yes: {
    'Right plan for usage': 'Properly Sized',
    'Cheaper plan from same vendor': 'Already Cheapest',
    'Substantially cheaper alternative': 'Cheaper Option Available',
    'Paying retail vs credits': 'No Savings Available',
  },
  No: {
    'Right plan for usage': 'Over-Sized Plans Detected',
    'Cheaper plan from same vendor': 'Cheaper Tiers Available',
    'Substantially cheaper alternative': 'No Cheaper Alternatives',
    'Paying retail vs credits': 'Retail Pricing Is Fine',
  },
  Unknown: {
    'Right plan for usage': 'Insufficient Data',
    'Cheaper plan from same vendor': 'Insufficient Data',
    'Substantially cheaper alternative': 'Insufficient Data',
    'Paying retail vs credits': 'Insufficient Data',
  },
};

export function PricingFitCard({ answer }: PricingFitCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const statusClass =
    answer.status === 'Yes'
      ? styles.pricingFitCardYes
      : answer.status === 'No'
        ? styles.pricingFitCardNo
        : styles.pricingFitCardUnknown;

  const badgeClass =
    answer.status === 'Yes'
      ? styles.statusYes
      : answer.status === 'No'
        ? styles.statusNo
        : styles.statusUnknown;

  // Determine if the status is "good" or "bad" depending on the question
  // For Q1, Q2: "Yes" = good, "No" = bad
  // For Q3: "Yes" = there IS a cheaper alternative (bad for current choice, good for savings)
  // For Q4: "Yes" = you ARE paying retail when you could use credits (bad)
  const isActionable =
    (answer.question === 'Right plan for usage' && answer.status === 'No') ||
    (answer.question === 'Cheaper plan from same vendor' && answer.status === 'No') ||
    (answer.question === 'Substantially cheaper alternative' && answer.status === 'Yes') ||
    (answer.question === 'Paying retail vs credits' && answer.status === 'Yes');

  const hasDetails = answer.details && answer.details.length > 0;
  const hasSavingsDetails = answer.details?.some((d) => d.savingsAmount && d.savingsAmount > 0);

  const statusLabel = STATUS_LABELS[answer.status]?.[answer.question] ?? answer.status;

  return (
    <div className={`${styles.pricingFitCard} ${statusClass}`}>
      <div
        className={styles.pricingFitHeader}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            hasDetails && setIsExpanded(!isExpanded);
          }
        }}
      >
        <h4 className={styles.pricingFitQuestion}>
          {QUESTION_LABELS[answer.question] ?? answer.question}
        </h4>
        <span className={`${styles.statusBadge} ${badgeClass}`}>
          {STATUS_ICONS[answer.status]} {statusLabel}
        </span>
        {hasDetails && (
          <button
            className={styles.expandToggle}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? 'Hide' : 'Details'}
            <ChevronDown
              size={12}
              className={`${styles.expandToggleIcon} ${isExpanded ? styles.expandToggleIconOpen : ''}`}
            />
          </button>
        )}
      </div>

      {/* Evidence summary — always visible */}
      <p className={styles.pricingFitEvidence}>{answer.evidence}</p>

      {/* Recommendation callout — always visible if actionable */}
      {isActionable && (
        <div className={styles.pricingFitRecommendation}>
          💡 {answer.recommendation}
        </div>
      )}

      {/* Expandable per-tool details */}
      {hasDetails && (
        <div
          className={`${styles.pricingFitDetailsWrapper} ${isExpanded ? styles.pricingFitDetailsWrapperOpen : ''}`}
        >
          <table className={styles.detailsTable}>
            <thead>
              <tr>
                <th>Tool</th>
                <th>Current</th>
                {hasSavingsDetails && <th>Suggested</th>}
                {hasSavingsDetails && <th>Savings</th>}
                <th>Analysis</th>
              </tr>
            </thead>
            <tbody>
              {answer.details.map((detail, idx) => (
                <tr key={`${detail.toolName}-${idx}`}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{detail.toolName}</td>
                  <td>
                    <div>{detail.currentPlan}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      ${detail.currentCost.toLocaleString()}/mo
                    </div>
                  </td>
                  {hasSavingsDetails && (
                    <td>
                      {detail.suggestedPlan ? (
                        <>
                          <div>{detail.suggestedPlan}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                            ${detail.suggestedCost?.toLocaleString()}/mo
                          </div>
                        </>
                      ) : (
                        <span className={styles.arrowIcon}>—</span>
                      )}
                    </td>
                  )}
                  {hasSavingsDetails && (
                    <td>
                      {detail.savingsAmount && detail.savingsAmount > 0 ? (
                        <span className={styles.savingsChip}>
                          ↓ ${detail.savingsAmount.toLocaleString()}/mo
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                  )}
                  <td className={styles.detailExplanation}>{detail.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   CTA COMPONENTS
   ============================================================================ */

export function SavingsCTA({ savings, optimizationResult, teamSize, selectedToolNames, onConsultationClick, onNotifyClick }: {
  savings: number;
  optimizationResult: OptimizationResult;
  teamSize: number;
  selectedToolNames: string[];
  onConsultationClick: () => void;
  onNotifyClick: () => void;
}) {
  // Handler to share the current tool configuration via /api/shares
  const handleShare = async () => {
    try {
      const toolsPayload: ToolConfig[] = optimizationResult?.tools
        ? optimizationResult.tools
        : selectedToolNames.map((toolName) => ({
            toolId: toolName.toLowerCase().replace(/\s+/g, '-'),
            toolName,
            plan: 'Pro',
            monthlySpend: 0,
            seats: 1,
          }));

      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tools: toolsPayload }),
      });

      if (!res.ok) {
        throw new Error(`Share request failed: ${res.status}`);
      }

      const data = (await res.json()) as { id?: string };
      if (!data?.id) {
        throw new Error('Share id missing from response');
      }

      const shareUrl = new URL(`/share/${data.id}`, window.location.origin).toString();
      await navigator.clipboard.writeText(shareUrl);
      alert('Result URL copied to clipboard!');
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  // Handler to generate and download a professionally formatted PDF report
  const handleDownloadReport = () => {
    generateAuditPDF(optimizationResult, teamSize, selectedToolNames);
  };

  if (savings > 500) {
    return (
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-neon)' }}>
          Stop overpaying for AI tooling.
        </h3>
        <button onClick={onConsultationClick} className={styles.primaryButton}>
          Book a Credex Consultation
        </button>
        {/* Secondary actions */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={handleShare} className={styles.secondaryButton}>
            Share Result URL
          </button>
          <button onClick={handleDownloadReport} className={styles.secondaryButton}>
            Download Report
          </button>
        </div>
      </div>
    );
  }

  if (savings <= 100) {
    return (
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <button onClick={onNotifyClick} className={styles.primaryButton} style={{ background: 'rgba(255, 255, 255, 0.1)', boxShadow: 'none' }}>
          Notify me when new optimizations apply
        </button>
        {/* Secondary actions */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={handleShare} className={styles.secondaryButton}>
            Share Result URL
          </button>
          <button onClick={handleDownloadReport} className={styles.secondaryButton}>
            Download Report
          </button>
        </div>
      </div>
    );
  }

  // For savings between 100 and 500, still show share/download
  return (
    <div style={{ marginTop: '3rem', textAlign: 'center' }}>
      <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={handleShare} className={styles.secondaryButton}>
          Share Result URL
        </button>
        <button onClick={handleDownloadReport} className={styles.secondaryButton}>
          Download Report
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   LEAD CAPTURE FORM
   ============================================================================ */

export interface LeadCaptureData {
  email: string;
  companyName: string;
  role: string;
  rating: number;
  honeypot: string;
}

/* Star Rating Sub-Component */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div style={{ display: 'flex', gap: '0.25rem', cursor: 'pointer' }} role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          role="radio"
          aria-checked={value === star}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px',
            cursor: 'pointer',
            fontSize: '2rem',
            lineHeight: 1,
            transition: 'transform 0.15s ease',
            transform: hovered === star ? 'scale(1.2)' : 'scale(1)',
            filter: star <= display
              ? 'drop-shadow(0 1px 2px rgba(234,179,8,0.4))'
              : 'none',
          }}
        >
          {star <= display ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );
}

export function LeadCaptureForm({ onSubmit, isLoading, errorMessage }: {
  onSubmit: (data: LeadCaptureData) => void;
  isLoading: boolean;
  errorMessage?: string;
}) {
  const [formData, setFormData] = React.useState<LeadCaptureData>({
    email: '',
    companyName: '',
    role: '',
    rating: 4,
    honeypot: '',
  });
  const [showBreakdown, setShowBreakdown] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.honeypot) return;
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Star Rating Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          className={styles.label}
          style={{
            marginBottom: '0.75rem',
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 800,
            fontSize: '0.8rem',
          }}
        >
          How useful was this audit?
        </label>
        <StarRating
          value={formData.rating}
          onChange={(v) => setFormData({ ...formData, rating: v })}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.5rem',
        }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {formData.rating} / 5 Stars
          </span>
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: 0,
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
            View Detailed Breakdown
          </button>
        </div>

        {/* Optional breakdown tooltip */}
        {showBreakdown && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: '0.75rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}>
            Your rating helps us improve the audit engine. Detailed feedback breakdown is included in the optimization blueprint sent after submission.
          </div>
        )}
      </div>

      {/* Role Field */}
      <div className={styles.formGroup}>
        <label htmlFor="role" className={styles.label} style={{ fontWeight: 700, marginBottom: '0.4rem' }}>
          Role <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(Optional)</span>
        </label>
        <input
          id="role"
          type="text"
          placeholder="e.g. CTO, Finance Manager"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className={styles.input}
          aria-label="Role"
        />
      </div>

      {/* Email Field */}
      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label} style={{ fontWeight: 700, marginBottom: '0.4rem' }}>
          Email Address
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            left: '0.875rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-secondary)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
          </div>
          <input
            id="email"
            type="email"
            placeholder="name@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className={styles.input}
            style={{ paddingLeft: '2.75rem' }}
            aria-label="Email Address"
          />
        </div>
      </div>

      {/* Company Name Field */}
      <div className={styles.formGroup}>
        <label htmlFor="company" className={styles.label} style={{ fontWeight: 700, marginBottom: '0.4rem' }}>
          Company Name <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(Optional)</span>
        </label>
        <input
          id="company"
          type="text"
          placeholder="e.g. Acme Corp"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          className={styles.input}
          aria-label="Company Name"
        />
      </div>

      {/* Honeypot */}
      <input
        type="text"
        name="website"
        style={{ display: 'none' }}
        value={formData.honeypot}
        onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
        tabIndex={-1}
      />

      {errorMessage && (
        <p style={{ color: 'var(--accent-pink)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {errorMessage}
        </p>
      )}

      {/* Submit Button — cyan-to-blue gradient matching screenshot */}
      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
          color: 'white',
          border: 'none',
          borderRadius: '14px',
          padding: '1rem',
          fontSize: '1.05rem',
          fontWeight: 700,
          cursor: isLoading ? 'wait' : 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: '0 6px 24px -4px rgba(0, 119, 182, 0.35)',
          minHeight: '52px',
          opacity: isLoading ? 0.7 : 1,
          letterSpacing: '0.01em',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 32px -4px rgba(0, 119, 182, 0.45)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 24px -4px rgba(0, 119, 182, 0.35)';
        }}
      >
        {isLoading ? 'Submitting...' : 'Submit & Book Consultation'}
      </button>
    </form>
  );
}
