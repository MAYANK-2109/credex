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
    <div className={styles.container}>
      <header className={styles.header} style={{ paddingTop: 'clamp(2rem, 5vw, 4rem)' }}>
        <h1 className={styles.title} style={{ 
          fontSize: 'clamp(1.75rem, 8vw, 3.5rem)',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          AI Spend <span className="gradient-text">Audit</span>
        </h1>
        <p className={styles.subtitle} style={{ 
          fontSize: 'clamp(0.95rem, 2.5vw, 1.25rem)',
          maxWidth: '820px',
          margin: 'clamp(1rem, 3vw, 1.5rem) auto 0'
        }}>
          Instantly find hidden waste in your AI tooling stack and unlock real monthly savings with a founder-grade audit.
        </p>
      </header>

      <main style={{ 
        maxWidth: '1000px', 
        margin: '0 auto', 
        display: 'grid', 
        gap: 'clamp(1.5rem, 4vw, 2rem)',
        padding: '0 1rem'
      }}>
        <div className="glass-panel" style={{ 
          padding: 'clamp(1.5rem, 5vw, 2rem)',
          textAlign: 'center'
        }}>
          <div style={{
            position: 'relative',
            paddingBottom: '56.25%',
            height: 0,
            overflow: 'hidden',
            borderRadius: '1rem'
          }}>
            <iframe
              src="https://www.youtube.com/embed/h8F9lsw-qb4?si=A3O2h1U47-iTuw7M"
              title="AI Spend Audit explainer video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '1rem'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
          <div className="glass-panel" style={{ padding: 'clamp(1.5rem, 5vw, 2rem)' }}>
            <h2 style={{ 
              marginBottom: '1rem',
              fontSize: 'clamp(1.25rem, 4vw, 1.75rem)'
            }}>Why this audit is worth your time</h2>
            <ul style={{ 
              listStyle: 'disc', 
              paddingLeft: '1.5rem', 
              display: 'grid', 
              gap: '0.75rem'
            }}>
              <li>Find overpaid seats, mis-matched plans, and duplicate AI tools in seconds.</li>
              <li>See monthly and annual savings with concrete recommendations.</li>
              <li>Capture feedback so we improve the audit for teams like yours.</li>
            </ul>
          </div>

          <div className="glass-panel" style={{ padding: 'clamp(1.5rem, 5vw, 2rem)' }}>
            <h2 style={{ 
              marginBottom: '1rem',
              fontSize: 'clamp(1.25rem, 4vw, 1.75rem)'
            }}>Get started with a free, no-risk audit</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              This is not a template form—this is a live tool that analyzes your actual AI stack and gives you actionable next steps.
            </p>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button className={styles.primaryButton} style={{ 
                padding: 'clamp(0.875rem, 2vw, 1.25rem)',
                fontSize: 'clamp(1rem, 2vw, 1.125rem)'
              }}>
                Get my free audit
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
