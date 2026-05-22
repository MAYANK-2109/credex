'use client';

import type { OptimizationResult } from '@/lib/optimization-engine';
import { ResultsHeroBanner, RecommendationCard, OptimizedStateMessage, SavingsCTA } from './form-and-results';
import React from 'react';

interface AnimatedResultsSequenceProps {
  optimizationResult: OptimizationResult;
  savings: number;
  onConsultationClick: () => void;
  onNotifyClick: () => void;
}

// NOTE: This file previously used GSAP + ScrollTrigger for a scroll-driven animation.
// Per request, the GSAP scroll effect has been removed.
export function AnimatedResultsSequence({
  optimizationResult,
  savings,
  onConsultationClick,
  onNotifyClick,
}: AnimatedResultsSequenceProps) {
  return (
    <div style={{ padding: '2.5rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <ResultsHeroBanner
            monthlySavings={optimizationResult.totalMonthlySavings}
            annualSavings={optimizationResult.totalAnnualSavings}
          />
        </div>

        <div style={{ width: '100%', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
              AI Stack Analysis
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Based on your team configuration, we've analyzed your tool stack for redundancies
              and optimization opportunities. The recommendations below highlight specific actions
              you can take to reduce costs while maintaining or improving productivity.
            </p>
          </div>
        </div>

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

        <div style={{ width: '100%', marginTop: '2rem' }}>
          <SavingsCTA
            savings={savings}
            onConsultationClick={onConsultationClick}
            onNotifyClick={onNotifyClick}
          />
        </div>
      </div>
    </div>
  );
}

