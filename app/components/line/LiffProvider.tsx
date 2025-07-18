'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// LIFF型定義
declare global {
  interface Window {
    liff: any
  }
}

interface LiffContextType {
  liff: any
  isLiffReady: boolean
  isInLineApp: boolean
  profile: {
    userId?: string
    displayName?: string
    pictureUrl?: string
    statusMessage?: string
  } | null
  error: string | null
  initializeLiff: (liffId: string) => Promise<void>
  closeLiff: () => void
  sendMessages: (messages: any[]) => Promise<void>
  shareTargetPicker: (messages: any[]) => Promise<void>
}

const LiffContext = createContext<LiffContextType | undefined>(undefined)

interface LiffProviderProps {
  children: ReactNode
  liffId?: string
  autoInit?: boolean
}

export const LiffProvider: React.FC<LiffProviderProps> = ({ 
  children, 
  liffId, 
  autoInit = true 
}) => {
  const [liff, setLiff] = useState<any>(null)
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [isInLineApp, setIsInLineApp] = useState(false)
  const [profile, setProfile] = useState<LiffContextType['profile']>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // LIFFライブラリの読み込み
    const script = document.createElement('script')
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
    script.async = true
    script.onload = () => {
      if (window.liff && autoInit && liffId) {
        initializeLiff(liffId)
      }
    }
    script.onerror = () => {
      setError('LIFFライブラリの読み込みに失敗しました')
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [liffId, autoInit])

  const initializeLiff = async (liffIdToUse: string) => {
    try {
      setError(null)
      if (!window.liff) {
        throw new Error('LIFFライブラリが読み込まれていません')
      }

      await window.liff.init({ liffId: liffIdToUse })
      setLiff(window.liff)
      setIsLiffReady(true)
      setIsInLineApp(window.liff.isInClient())

      // ユーザープロフィールの取得
      if (window.liff.isLoggedIn()) {
        try {
          const userProfile = await window.liff.getProfile()
          setProfile({
            userId: userProfile.userId,
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl,
            statusMessage: userProfile.statusMessage
          })
        } catch (profileError) {
          console.warn('プロフィールの取得に失敗しました:', profileError)
        }
      }
    } catch (initError) {
      console.error('LIFF初期化エラー:', initError)
      setError('LINEミニアプリの初期化に失敗しました')
    }
  }

  const closeLiff = () => {
    if (liff && liff.isInClient()) {
      liff.closeWindow()
    }
  }

  const sendMessages = async (messages: any[]) => {
    if (!liff || !liff.isInClient()) {
      throw new Error('LINEアプリ内でのみ利用可能です')
    }

    try {
      await liff.sendMessages(messages)
    } catch (error) {
      console.error('メッセージ送信エラー:', error)
      throw error
    }
  }

  const shareTargetPicker = async (messages: any[]) => {
    if (!liff) {
      throw new Error('LIFFが初期化されていません')
    }

    try {
      await liff.shareTargetPicker(messages)
    } catch (error) {
      console.error('シェア送信エラー:', error)
      throw error
    }
  }

  const contextValue: LiffContextType = {
    liff,
    isLiffReady,
    isInLineApp,
    profile,
    error,
    initializeLiff,
    closeLiff,
    sendMessages,
    shareTargetPicker
  }

  return (
    <LiffContext.Provider value={contextValue}>
      {children}
    </LiffContext.Provider>
  )
}

export const useLiff = (): LiffContextType => {
  const context = useContext(LiffContext)
  if (context === undefined) {
    throw new Error('useLiff must be used within a LiffProvider')
  }
  return context
}

// LINE共有用のメッセージテンプレート
export const createShareMessage = (
  formName: string,
  formUrl: string,
  businessName?: string
) => ({
  type: 'flex',
  altText: `${formName}のご予約`,
  contents: {
    type: 'bubble',
    hero: {
      type: 'image',
      url: 'https://example.com/hero-image.jpg', // 実際の画像URLに置き換え
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: businessName || '片桐商店 ベジライス',
          weight: 'bold',
          size: 'sm',
          color: '#999999'
        },
        {
          type: 'text',
          text: formName,
          weight: 'bold',
          size: 'xl',
          margin: 'md'
        },
        {
          type: 'text',
          text: 'こちらから簡単にご予約いただけます',
          size: 'sm',
          color: '#666666',
          margin: 'md'
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          action: {
            type: 'uri',
            label: '予約する',
            uri: formUrl
          }
        }
      ]
    }
  }
})

export const createReservationConfirmMessage = (
  customerName: string,
  reservationDate: string,
  products: Array<{ name: string; price: number; quantity?: number }>,
  totalAmount: number
) => ({
  type: 'flex',
  altText: 'ご予約確認',
  contents: {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'ご予約ありがとうございます',
          weight: 'bold',
          size: 'lg'
        },
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: `お名前: ${customerName}`,
              size: 'sm'
            },
            {
              type: 'text',
              text: `受取日: ${reservationDate}`,
              size: 'sm',
              margin: 'sm'
            }
          ]
        },
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: 'ご注文内容',
              weight: 'bold',
              size: 'sm'
            },
            ...products.map(product => ({
              type: 'box',
              layout: 'horizontal',
              margin: 'sm',
              contents: [
                {
                  type: 'text',
                  text: product.name,
                  size: 'sm',
                  flex: 3
                },
                {
                  type: 'text',
                  text: `¥${product.price.toLocaleString()}`,
                  size: 'sm',
                  align: 'end'
                }
              ]
            }))
          ]
        },
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: '合計金額',
              weight: 'bold',
              size: 'md',
              flex: 3
            },
            {
              type: 'text',
              text: `¥${totalAmount.toLocaleString()}`,
              weight: 'bold',
              size: 'md',
              align: 'end',
              color: '#ff5551'
            }
          ]
        }
      ]
    }
  }
})

export default LiffProvider