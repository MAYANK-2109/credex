import React from 'react';
import type { Metadata } from 'next';
import { optimizeToolStack, type ToolConfig } from '@/lib/optimization-engine';
import {
  ResultsHeroBanner,
  RecommendationCard,
  OptimizedStateMessage,
} from '@/components/form-and-results';
import styles from '@/components/credex.module.css';

interface Props {
  params: Promise<{ data: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await params;
  let decodedTools: ToolConfig[] = [];
  try {
    const jsonString = Buffer.from(data, 'base64').toString('utf-8');
    decodedTools = JSON.parse(jsonString);
  } catch (e) {
    // Error parsing, defaults to 0
  }

  const result = optimizeToolStack(decodedTools);
  const title = `AI Spend Audit: Saved $${result.totalMonthlySavings}/mo`;
  const description = `We analyzed our AI tooling stack and discovered $${result.totalAnnualSavings}/yr in potential savings. Audit your stack for free.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: '/og-image.png', // Ideally a generated image, assuming static fallback
          width: 1200,
          height: 630,
          alt: 'AI Spend Audit Results',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function SharedResultsPage({ params }: Props) {
  const { data } = await params;
  let decodedTools: ToolConfig[] = [];
  try {
    const jsonString = Buffer.from(data, 'base64').toString('utf-8');
    decodedTools = JSON.parse(jsonString);
  } catch (e) {
    return (
      <div className={styles.container}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>Invalid Link</h2>
          <p>This audit link appears to be broken or malformed.</p>
        </div>
      </div>
    );
  }

  const optimizationResult = optimizeToolStack(decodedTools);

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
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Actionable Insights</h3>
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

        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-neon)' }}>
            Want to audit your own AI stack?
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Find out how much your team could save on redundant or sub-optimal AI tools.
          </p>
          <a href="/" style={{ display: 'inline-block' }}>
            <button className={styles.primaryButton} style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
              Run Your Free Audit
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
