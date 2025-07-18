import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from './contexts/ToastContext'
import { AuthProvider } from './contexts/AuthContext'
import { LiffProvider } from './components/line/LiffProvider'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ベジライス予約システム',
  description: 'LINE ミニアプリ対応の種苗店予約システム - オフライン対応PWA',
  manifest: '/manifest.json',
  themeColor: '#0d6efd',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ベジライス',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 環境に応じたLIFF IDの選択
  const getLiffId = () => {
    // VERCELの環境変数から判定
    const vercelEnv = process.env.VERCEL_ENV
    
    if (vercelEnv === 'production') {
      return process.env.NEXT_PUBLIC_LIFF_ID_PROD
    }
    
    if (vercelEnv === 'preview') {
      return process.env.NEXT_PUBLIC_LIFF_ID_STAGING
    }
    
    // 開発環境（ローカル）
    return process.env.NEXT_PUBLIC_LIFF_ID_DEV
  }

  const liffId = getLiffId()

  return (
    <html lang="ja">
      <head>
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
          integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" 
          crossOrigin="anonymous"
        />
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.css" 
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#0d6efd" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ベジライス" />
      </head>
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider>
            <LiffProvider liffId={liffId} autoInit={true}>
              {children}
            </LiffProvider>
          </AuthProvider>
        </ToastProvider>
        <Script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" 
          strategy="afterInteractive"
        />
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('SW registered: ', registration);
                  })
                  .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}