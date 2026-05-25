'use client';

import type { OptimizationResult } from '@/lib/optimization-engine';
import {
  ResultsHeroBanner,
  RecommendationCard,
  OptimizedStateMessage,
  SavingsCTA,
  PricingFitCard,
} from './form-and-results';
import React from 'react';
import { Activity, Loader2 } from 'lucide-react';

interface AnimatedResultsSequenceProps {
  optimizationResult: OptimizationResult;
  savings: number;
  teamSize: number;
  selectedToolNames: string[];
  onConsultationClick: () => void;
  onNotifyClick: () => void;
  summary: string;
  summarySource: 'primary' | 'secondary' | 'fallback' | '';
  isSummaryLoading: boolean;
}

export function AnimatedResultsSequence({
  optimizationResult,
  savings,
  teamSize,
  selectedToolNames,
  onConsultationClick,
  onNotifyClick,
  summary,
  summarySource,
  isSummaryLoading,
}: AnimatedResultsSequenceProps) {
  return (
    <div style={{ padding: '2.5rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
        {/* 1. SAVINGS HERO BANNER */}
        <div style={{ marginBottom: '2rem' }}>
          <ResultsHeroBanner
            monthlySavings={optimizationResult.totalMonthlySavings}
            annualSavings={optimizationResult.totalAnnualSavings}
          />
        </div>

        {/* 2. PRICING FIT QUESTION CARDS */}
        <div style={{ width: '100%', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Pricing Plan Fit &amp; Alternatives
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              We analyzed your tool stack against four key questions to find savings opportunities.
              Click &quot;Details&quot; on any card to see the per-tool breakdown.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {optimizationResult.pricingFitAnswers?.map((answer) => (
                <PricingFitCard key={answer.question} answer={answer} />
              ))}
            </div>
          </div>
        </div>

        {/* 3. AI STACK ANALYSIS SUMMARY */}
        <div style={{ width: '100%', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity className="w-5 h-5 text-[var(--accent-primary)] animate-pulse" />
              AI Personalized Stack Analysis
            </h3>
            
            {isSummaryLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '1rem' }}>
                <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                  Analyzing stack and generating personalized summary via Gemini API...
                </p>
              </div>
            ) : (
              <>
                {summarySource === 'fallback' && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    color: '#f87171',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                  }}>
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚠️</span>
                    <div>
                      <strong>Offline Fallback State Triggered:</strong> Primary cloud AI channels did not respond. Rendered premium offline local analysis. Full stack audit math remains 100% active.
                    </div>
                  </div>
                )}
                {summarySource && summarySource !== 'fallback' && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    marginBottom: '1.25rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#34d399',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                    Gemini Live Summary Active ({summarySource} Channel)
                  </div>
                )}
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, fontSize: '0.95rem', fontStyle: 'italic' }}>
                  {summary || "Run an audit above to generate your customized, AI-driven stack efficiency analysis."}
                </p>
              </>
            )}
          </div>
        </div>

        {/* 4. ACTIONABLE INSIGHTS / RECOMMENDATIONS */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Actionable Insights
          </h3>

          {optimizationResult.isFullyOptimized ? (
            <div>
              <OptimizedStateMessage savings={optimizationResult.totalMonthlySavings} />
            </div>
          ) : (
            optimizationResult.recommendations.map((rec, index) => (
              <div key={`${rec.toolId ?? 'tool'}-${index}`}>
                <RecommendationCard recommendation={rec} index={index} />
              </div>
            ))
          )}
        </div>

        {/* 5. CTA */}
        <div style={{ width: '100%', marginTop: '2rem' }}>
          <SavingsCTA
            savings={savings}
            optimizationResult={optimizationResult}
            teamSize={teamSize}
            selectedToolNames={selectedToolNames}
            onConsultationClick={onConsultationClick}
            onNotifyClick={onNotifyClick}
          />
        </div>
      </div>
    </div>
  );
}
