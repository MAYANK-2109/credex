import '@/styles/globals.css';

export const metadata = {
  title: 'Dev Tool Stack Optimizer',
  description: 'Analyze your development tooling costs and unlock savings opportunities.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
