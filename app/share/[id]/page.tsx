import React from 'react';
import type { Metadata } from 'next';
import path from 'path';
import { promises as fs } from 'fs';
import { optimizeToolStack, type ToolConfig } from '@/lib/optimization-engine';
import {
  ResultsHeroBanner,
  RecommendationCard,
  OptimizedStateMessage,
} from '@/components/form-and-results';
import styles from '@/components/credex.module.css';

/**
 * Shared Results Page – renders a public, privacy‑safe view of the audit.
 * URL pattern: /share/[id]
 */
interface SharePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  const sharesPath = path.join(process.cwd(), 'data', 'shares.json');
  try {
    const raw = await fs.readFile(sharesPath, 'utf8');
    const shares: { id: string; tools: ToolConfig[] }[] = JSON.parse(raw);
    const entry = shares.find((s) => s.id === id);
    if (!entry) throw new Error('Not found');
    const result = optimizeToolStack(entry.tools);
    const title = `AI Spend Audit: Saved $${result.totalMonthlySavings}/mo`; // SEO title
    const description = `Discover how much you could save on AI tooling – $${result.totalAnnualSavings} per year.`; // SEO description
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AI Spend Audit Results' }],
        type: 'website',
        url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/share/${id}`,
      },
      twitter: { card: 'summary_large_image', title, description },
    };
  } catch {
    // Fallback meta for an invalid link
    return {
      title: 'Invalid AI Spend Audit Link',
      description: 'The share link you followed is malformed or does not exist.',
    };
  }
}

export default async function SharedResultPage({ params }: SharePageProps) {
  const { id } = await params;
  const sharesPath = path.join(process.cwd(), 'data', 'shares.json');
  let tools: ToolConfig[] = [];
  try {
    const raw = await fs.readFile(sharesPath, 'utf8');
    const shares: { id: string; tools: ToolConfig[] }[] = JSON.parse(raw);
    const entry = shares.find((s) => s.id === id);
    if (!entry) throw new Error('Not found');
    tools = entry.tools;
  } catch {
    return (
      <div className={styles.container}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>Invalid Share Link</h2>
          <p>This audit link appears to be broken or does not exist.</p>
        </div>
      </div>
    );
  }

  const optimizationResult = optimizeToolStack(tools);

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ marginBottom: '2rem' }}>
        <h1 className={styles.title} style={{ fontSize: '2.5rem' }}>
          AI Spend <span className="gradient-text">Audit Results</span>
        </h1>
      </header>

      <div id="results-section" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <ResultsHeroBanner
          monthlySavings={optimizationResult.totalMonthlySavings}
          annualSavings={optimizationResult.totalAnnualSavings}
        />

        <div style={{ marginTop: '4rem', marginBottom: '4rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Actionable Insights
          </h3>
          {optimizationResult.isFullyOptimized ? (
            <OptimizedStateMessage savings={optimizationResult.totalMonthlySavings} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {optimizationResult.recommendations.map((rec) => (
                <RecommendationCard key={rec.toolId} recommendation={rec} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
