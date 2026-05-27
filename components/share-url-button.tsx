'use client';

import { useState } from 'react';
import styles from '@/components/credex.module.css';

export function ShareUrlButton() {
  const [status, setStatus] = useState('');

  const copyUrl = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setStatus('Share link copied to clipboard!');
    } catch (error) {
      setStatus('Copy failed. Please copy the URL manually.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
      <button type="button" className={styles.primaryButton} onClick={copyUrl}>
        Copy Share URL
      </button>
      {status ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>{status}</p>
      ) : null}
    </div>
  );
}
