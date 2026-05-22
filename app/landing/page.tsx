import Link from 'next/link';
import styles from '@/components/credex.module.css';

/**
 * Landing page that serves as a marketing / GTM front‑door.
 * Includes a clear headline, short description, a CTA that navigates to the audit page,
 * and basic GA tracking.
 */
export const metadata = {
  title: 'AI Spend Audit – Instantly Find Savings in Your AI Tool Stack',
  description: 'Run a free, instant audit of your AI tooling spend and discover hidden savings.',
  openGraph: {
    title: 'AI Spend Audit – Free AI Tool Savings Calculator',
    description: 'Discover how much you can save on AI tools with a single click.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AI Spend Audit' }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'AI Spend Audit', description: 'Free AI tool spend audit' },
};

export default function LandingPage() {
  return (
    <div className={styles.container} style={{ paddingTop: '4rem' }}>
      <header className={styles.header} style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 className={styles.title} style={{ fontSize: '3rem', maxWidth: '900px', margin: '0 auto' }}>
          AI Spend <span className="gradient-text">Audit</span>
        </h1>
        <p className={styles.subtitle} style={{ fontSize: '1.25rem', maxWidth: '820px', margin: '1.5rem auto 0' }}>
          Instantly find hidden waste in your AI tooling stack and unlock real monthly savings with a founder-grade audit.
        </p>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <iframe
            width="100%"
            height="420"
            src="https://www.youtube.com/embed/ysz5S6PUM-U"
            title="AI Spend Audit explainer video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 'none', borderRadius: '1rem' }}
          />
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Why this audit is worth your time</h2>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', display: 'grid', gap: '0.75rem' }}>
              <li>Find overpaid seats, mis-matched plans, and duplicate AI tools in seconds.</li>
              <li>See monthly and annual savings with concrete recommendations.</li>
              <li>Capture feedback so we improve the audit for teams like yours.</li>
            </ul>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Get started with a free, no-risk audit</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              This is not a template form—this is a live tool that analyzes your actual AI stack and gives you actionable next steps.
            </p>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button className={styles.primaryButton} style={{ padding: '1rem 2.25rem', fontSize: '1rem' }}>
                Get my free audit
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
