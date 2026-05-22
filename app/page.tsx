'use client';

import './page.css';
import React, { useEffect, useMemo, useState } from 'react';
import {
  TeamSizeInput,
  UseCaseSelect,
  ToolGrid,
  LeadCaptureForm,
  type LeadCaptureData,
} from '@/components/form-and-results';
import { AnimatedResultsSequence } from '@/components/animated-results-sequence';
import {
  optimizeToolStack,
  type UseCase,
  type ToolConfig,
} from '@/lib/optimization-engine';
import { generateOptimizationSummary } from '@/lib/llm-service';
import { storageUtils, type FormState } from '@/lib/storage-utils';
import styles from '@/components/credex.module.css';

export default function OptimizerPage() {
  const [mounted, setMounted] = useState(false);

  // Form state
  const [teamSize, setTeamSize] = useState(5);
  const [primaryUseCase, setPrimaryUseCase] = useState<UseCase>('coding');
  const [selectedTools, setSelectedTools] = useState<ToolConfig[]>([]);

  // Results state
  const [hasCalculated, setHasCalculated] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [leadCaptureVisible, setLeadCaptureVisible] = useState(false);
  const [leadCaptureError, setLeadCaptureError] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const saved = storageUtils.loadState();
    if (saved) {
      setTeamSize(saved.teamSize);
      setPrimaryUseCase(saved.primaryUseCase);
      setSelectedTools(saved.selectedTools);
    }
  }, []);

  useEffect(() => {
    const state: FormState = {
      teamSize,
      primaryUseCase,
      selectedTools,
    };
    storageUtils.saveState(state);
  }, [teamSize, primaryUseCase, selectedTools]);

  const handleAddTool = (tool: ToolConfig) => {
    setSelectedTools([...selectedTools, tool]);
  };

  const handleRemoveTool = (toolId: string) => {
    setSelectedTools(selectedTools.filter((t) => t.toolId !== toolId));
  };

  const handleUpdateTool = (
    toolId: string,
    updates: Partial<ToolConfig>
  ) => {
    setSelectedTools(
      selectedTools.map((t) =>
        t.toolId === toolId ? { ...t, ...updates } : t
      )
    );
  };

  const handleCalculate = async () => {
    if (selectedTools.length === 0) {
      alert('Please select at least one tool');
      return;
    }

    setHasCalculated(true);
    setIsSummaryLoading(true);

    const result = optimizeToolStack(selectedTools, teamSize, primaryUseCase);

    const summaryResponse = await generateOptimizationSummary(
      result,
      teamSize,
      primaryUseCase,
      5000
    );

    setSummary(summaryResponse.text);
    setIsSummaryLoading(false);

    if (result.totalMonthlySavings > 500) {
      setLeadCaptureVisible(true);
    }

    setTimeout(() => {
      document
        .getElementById('results-section')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleLeadSubmit = async (data: LeadCaptureData) => {
    setIsSubmittingLead(true);
    setLeadCaptureError('');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          companyName: data.companyName,
          role: data.role,
          teamSize,
          primaryUseCase,
          toolCount: selectedTools.length,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: data.rating,
            teamSize,
            primaryUseCase,
            toolCount: selectedTools.length,
          }),
        });
      } catch (feedbackError) {
        console.warn('Feedback save failed', feedbackError);
      }

      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'lead_submitted', {
          teamSize,
          toolCount: selectedTools.length,
          primaryUseCase,
        });
        (window as any).gtag('event', 'audit_feedback_submitted', {
          score: data.rating,
        });
      }

      alert('Thank you! We\'ll be in touch soon.');
      setLeadCaptureVisible(false);
    } catch (_error) {
      setLeadCaptureError('Failed to submit. Please try again.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const optimizationResult = useMemo(
    () =>
      selectedTools.length > 0
        ? optimizeToolStack(selectedTools, teamSize, primaryUseCase)
        : null,
    [selectedTools, teamSize, primaryUseCase]
  );

  if (!mounted) {
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          AI Spend <span className="gradient-text">Audit</span>
        </h1>
        <p className={styles.subtitle}>
          Stop wasting money on redundant or sub-optimal AI tool plans. Instantly audit your stack for free.
        </p>
      </header>

      {!hasCalculated ? (
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
          <div className={styles.grid} style={{ marginBottom: '3rem' }}>
            <TeamSizeInput value={teamSize} onChange={setTeamSize} />
            <UseCaseSelect value={primaryUseCase} onChange={setPrimaryUseCase} />
          </div>

          <ToolGrid
            selectedTools={selectedTools}
            onAdd={handleAddTool}
            onRemove={handleRemoveTool}
            onUpdate={handleUpdateTool}
          />

          <button onClick={handleCalculate} className={styles.primaryButton} style={{ marginTop: '2rem' }}>
            Run Instant Audit
          </button>
        </div>
      ) : null}

      {hasCalculated && optimizationResult ? (
        <div id="results-section">
          {/* ANIMATED RESULTS SEQUENCE with GSAP ScrollTrigger */}
          <AnimatedResultsSequence
            optimizationResult={optimizationResult}
            savings={optimizationResult.totalMonthlySavings}
            onConsultationClick={() => setLeadCaptureVisible(true)}
            onNotifyClick={() => setLeadCaptureVisible(true)}
          />

          {/* BACK TO CONFIGURATION BUTTON - Fixed positioning for accessibility */}
          <button
            onClick={() => {
              setHasCalculated(false);
              setSummary('');
            }}
            className={styles.backButton}
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '2rem',
              zIndex: 20,
            }}
          >
            ← Back to Configuration
          </button>

          {/* LEAD CAPTURE MODAL */}
          {leadCaptureVisible && (
            <div className={styles.modalOverlay} style={{ zIndex: 100 }}>
              <div className={styles.modalContent}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>
                  {optimizationResult.totalMonthlySavings > 500
                    ? 'Unlock These Savings'
                    : 'Stay Optimized'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                  {optimizationResult.totalMonthlySavings > 500
                    ? 'Book a consultation with our optimization experts to implement these savings across your entire organization.'
                    : 'Get notified when new tools and plans launch that could save you money.'}
                </p>
                <LeadCaptureForm
                  onSubmit={handleLeadSubmit}
                  isLoading={isSubmittingLead}
                  errorMessage={leadCaptureError}
                />
                <button
                  onClick={() => setLeadCaptureVisible(false)}
                  style={{ width: '100%', padding: '1rem', marginTop: '1rem', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <footer style={{ textAlign: 'center', marginTop: '6rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        <p>Powered by Credex intelligence.</p>
      </footer>
    </div>
  );
}
