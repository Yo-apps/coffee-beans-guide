import './globals.css'
import Script from 'next/script'
import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://coffee-beans-selector.vercel.app'),
  title: 'Coffee Beans Guide',
  description: 'コーヒー豆選びをサポートするガイドアプリ',
  keywords: 'コーヒー豆,スペシャルティコーヒー,京都,SOMA COFFEE,AI,アプリ,豆選び,焙煎,通販',
  authors: [{ name: 'SOMA COFFEE KYOTO' }],
  openGraph: {
    title: 'Coffee Beans Guide | コーヒー専門店のAI豆選びガイドアプリ',
    description: '京都のイベント出店専門コーヒー店「SOMA COFFEE KYOTO」が提供する、AI搭載の豆選びガイドアプリ。あなたの好みや味わいの好みに合ったコーヒー豆をAIバリスタが提案します。',
    url: 'https://coffee-beans-selector.vercel.app/',
    siteName: 'SOMA COFFEE KYOTO',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Coffee Beans Guide - AIがあなたに合うコーヒー豆を提案',
      }
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coffee Beans Guide | コーヒー専門店のAI豆選びガイドアプリ',
    description: '京都のイベント出店専門コーヒー店「SOMA COFFEE KYOTO」が提供する、AI搭載の豆選びガイドアプリ',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code-here',
  },
  alternates: {
    canonical: 'https://coffee-beans-selector.vercel.app/',
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning>
        <div id="app">
          {children}
        </div>
        {/* Google Analytics - クライアントサイドでのみ実行 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXXXXX', {
                page_path: window.location.pathname,
              });
            `
          }}
        />
      </body>
    </html>
  )
} 