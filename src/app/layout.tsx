import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SpendLens — See where your money actually goes',
  description:
    'Upload a bank CSV and instantly see anomalies, spending drift, subscriptions, and practical next steps.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
