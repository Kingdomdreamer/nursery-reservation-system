import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from './contexts/ToastContext'
import { AuthProvider } from './contexts/AuthContext'
import { LiffProvider } from './components/line/LiffProvider'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '種苗店予約システム',
  description: 'LINE ミニアプリ対応の種苗店予約システム',
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
      </body>
    </html>
  )
}