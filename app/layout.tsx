import '@/styles/globals.css';
import React from 'react';
import Script from 'next/script';

export const metadata = {
  title: 'AI Spend Audit | Instant AI tooling cost review',
  description: 'Run a free audit of your AI tool stack, uncover redundant spend, and capture savings opportunities.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_ID}', { page_path: window.location.pathname });`,
              }}
            />
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
