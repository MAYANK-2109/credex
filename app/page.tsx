'use client';

import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import {
  TeamSizeInput,
  UseCaseSelect,
  ToolGrid,
  ResultsHeroBanner,
  RecommendationCard,
  OptimizedStateMessage,
  SavingsCTA,
  LeadCaptureForm,
  type LeadCaptureData,
} from '@/components/form-and-results';
import {
  optimizeToolStack,
  type UseCase,
  type ToolConfig,
} from '@/lib/optimization-engine';
import { generateOptimizationSummary } from '@/lib/llm-service';
import { storageUtils, type FormState } from '@/lib/storage-utils';

/**
 * Main optimizer page component
 * Handles multi-step form state, optimization engine, and results display
 */
export default function OptimizerPage() {
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

  // Load persisted state on mount
  useEffect(() => {
    const saved = storageUtils.loadState();
    if (saved) {
      setTeamSize(saved.teamSize);
      setPrimaryUseCase(saved.primaryUseCase);
      setSelectedTools(saved.selectedTools);
    }
  }, []);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    const state: FormState = {
      teamSize,
      primaryUseCase,
      selectedTools,
    };
    storageUtils.saveState(state);
  }, [teamSize, primaryUseCase, selectedTools]);

  // Tool management
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

  // Calculate optimization
  const handleCalculate = async () => {
    // Validation
    if (selectedTools.length === 0) {
      alert('Please select at least one tool');
      return;
    }

    setHasCalculated(true);
    setIsSummaryLoading(true);

    // Run optimization engine
    const result = optimizeToolStack(selectedTools);

    // Fetch LLM summary with fallback
    const summaryResponse = await generateOptimizationSummary(
      result,
      teamSize,
      primaryUseCase,
      5000 // 5 second timeout
    );

    setSummary(summaryResponse.text);
    setIsSummaryLoading(false);

    // Show lead capture if savings > $500
    if (result.totalMonthlySavings > 500) {
      setLeadCaptureVisible(true);
    }

    // Scroll to results
    setTimeout(() => {
      document
        .getElementById('results-section')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle lead capture submission
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

      // Show success
      alert('Thank you! We\'ll be in touch soon.');
      setLeadCaptureVisible(false);
    } catch (_error) {
      setLeadCaptureError('Failed to submit. Please try again.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Calculate optimization result
  const optimizationResult = hasCalculated
    ? optimizeToolStack(selectedTools)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Dev Tool Stack <span className="text-accent-600">Optimizer</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Analyze your development tooling costs and unlock savings opportunities
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-4xl">
        {/* Input Section */}
        {!hasCalculated ? (
          <div className="space-y-8">
            {/* Form Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-slate-900">
                1. Team Configuration
              </h2>

              <div className="grid gap-6 sm:grid-cols-2">
                <TeamSizeInput value={teamSize} onChange={setTeamSize} />
                <UseCaseSelect value={primaryUseCase} onChange={setPrimaryUseCase} />
              </div>
            </div>

            {/* Tools Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-slate-900">
                2. Select Active Tools & Plans
              </h2>

              <ToolGrid
                selectedTools={selectedTools}
                onAdd={handleAddTool}
                onRemove={handleRemoveTool}
                onUpdate={handleUpdateTool}
              />
            </div>

            {/* CTA Button */}
            <button
              onClick={handleCalculate}
              className="w-full rounded-xl bg-gradient-to-r from-accent-600 to-accent-700 px-6 py-4 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:from-accent-700 hover:to-accent-800 active:scale-95"
            >
              Analyze & Get Recommendations
            </button>
          </div>
        ) : null}

        {/* Results Section */}
        {hasCalculated && optimizationResult ? (
          <div id="results-section" className="space-y-8">
            {/* Hero Banner */}
            <ResultsHeroBanner
              monthlySavings={optimizationResult.totalMonthlySavings}
              annualSavings={optimizationResult.totalAnnualSavings}
            />

            {/* Summary Text */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 font-semibold text-slate-900">Your Summary</h3>
              {isSummaryLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-full rounded bg-slate-200" />
                  <div className="h-4 w-5/6 rounded bg-slate-200" />
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-slate-600">
                  {summary}
                </p>
              )}
            </div>

            {/* Optimized or Recommendations */}
            {optimizationResult.isFullyOptimized ? (
              <OptimizedStateMessage savings={optimizationResult.totalMonthlySavings} />
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Recommended Actions
                </h3>
                <div className="grid gap-4">
                  {optimizationResult.recommendations.map((rec) => (
                    <RecommendationCard
                      key={rec.toolId}
                      recommendation={rec}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* CTA Section */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <SavingsCTA
                savings={optimizationResult.totalMonthlySavings}
                onConsultationClick={() => setLeadCaptureVisible(true)}
                onNotifyClick={() => setLeadCaptureVisible(true)}
              />
            </div>

            {/* Lead Capture Form (Modal) */}
            {leadCaptureVisible && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-xl">
                  <h3 className="mb-4 text-xl font-bold text-slate-900">
                    {optimizationResult.totalMonthlySavings > 500
                      ? 'Book Your Consultation'
                      : 'Get Notified'}
                  </h3>
                  <p className="mb-6 text-sm text-slate-600">
                    {optimizationResult.totalMonthlySavings > 500
                      ? 'Our optimization experts will review your specific setup and help implement these savings.'
                      : 'We\'ll notify you when new optimizations become available for your tooling.'}
                  </p>

                  <LeadCaptureForm
                    onSubmit={handleLeadSubmit}
                    isLoading={isSubmittingLead}
                    errorMessage={leadCaptureError}
                  />

                  <button
                    onClick={() => setLeadCaptureVisible(false)}
                    className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => {
                setHasCalculated(false);
                setSummary('');
                setLeadCaptureVisible(false);
              }}
              className="w-full rounded-lg border-2 border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
            >
              ← Adjust Configuration & Recalculate
            </button>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="mx-auto mt-16 max-w-4xl border-t border-slate-200 pt-8 text-center">
        <p className="text-sm text-slate-500">
          Powered by Credex optimization intelligence
        </p>
      </div>
    </div>
  );
}
