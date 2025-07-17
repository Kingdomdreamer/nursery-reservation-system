import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal/Modal'
import { AccessibleAlert } from '../ui/AccessibilityHelpers'

/**
 * PWA インストールプロンプトコンポーネント
 * ユーザーがアプリをホーム画面に追加できるようにする
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // PWAの実行状態をチェック
    checkPWAStatus()
    
    // インストールプロンプトイベントをリスン
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // 条件に応じてバナーを表示
      if (shouldShowInstallBanner()) {
        setShowBanner(true)
      }
    }
    
    // アプリインストール完了イベント
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowBanner(false)
      setShowModal(false)
      setDeferredPrompt(null)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const checkPWAStatus = () => {
    // スタンドアロンモードかチェック
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                            (window.navigator as any).standalone ||
                            document.referrer.includes('android-app://')
    
    setIsStandalone(isStandaloneMode)
    
    // 既にインストール済みかチェック
    if (isStandaloneMode) {
      setIsInstalled(true)
    }
  }

  const shouldShowInstallBanner = () => {
    // 既にインストール済みの場合は表示しない
    if (isInstalled || isStandalone) {
      return false
    }
    
    // 以前に拒否された場合は一定期間表示しない
    const lastDismissed = localStorage.getItem('pwa-install-dismissed')
    if (lastDismissed) {
      const dismissedTime = new Date(lastDismissed).getTime()
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      if (dismissedTime > weekAgo) {
        return false
      }
    }
    
    // 一定の使用頻度以上の場合のみ表示
    const visitCount = parseInt(localStorage.getItem('visit-count') || '0')
    return visitCount >= 3
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowModal(true)
      return
    }
    
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA インストールが承認されました')
        setShowBanner(false)
      } else {
        console.log('PWA インストールが拒否されました')
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
        setShowBanner(false)
      }
    } catch (error) {
      console.error('PWA インストールエラー:', error)
    }
    
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
  }

  const handleModalClose = () => {
    setShowModal(false)
  }

  // 既にインストール済みの場合は何も表示しない
  if (isInstalled || isStandalone) {
    return null
  }

  return (
    <>
      {/* インストールバナー */}
      {showBanner && (
        <div 
          className="alert alert-info alert-dismissible d-flex align-items-center"
          role="alert"
          aria-live="polite"
        >
          <i className="bi bi-phone me-3" style={{ fontSize: '1.5rem' }} aria-hidden="true"></i>
          <div className="flex-grow-1">
            <strong>アプリをインストール</strong>
            <p className="mb-0">
              ベジライス予約システムをホーム画面に追加して、すばやくアクセスできます。
            </p>
          </div>
          <div className="ms-3">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleInstallClick}
              className="me-2"
              aria-label="アプリをインストール"
            >
              <i className="bi bi-download me-1" aria-hidden="true"></i>
              インストール
            </Button>
            <button
              type="button"
              className="btn-close"
              aria-label="閉じる"
              onClick={handleDismiss}
            ></button>
          </div>
        </div>
      )}

      {/* インストール手順モーダル */}
      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title="アプリのインストール"
        size="md"
        centered
      >
        <ModalBody>
          <div className="text-center mb-4">
            <i className="bi bi-phone text-primary" style={{ fontSize: '3rem' }}></i>
            <h5 className="mt-2">ホーム画面に追加</h5>
            <p className="text-muted">
              ベジライス予約システムをアプリのように使用できます
            </p>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="bi bi-apple me-2"></i>
                    iOS (Safari)
                  </h6>
                  <ol className="list-unstyled">
                    <li className="mb-2">
                      <i className="bi bi-1-circle me-2 text-primary"></i>
                      画面下部の共有ボタン <i className="bi bi-share"></i> をタップ
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-2-circle me-2 text-primary"></i>
                      「ホーム画面に追加」をタップ
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-3-circle me-2 text-primary"></i>
                      「追加」をタップして完了
                    </li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="bi bi-android me-2"></i>
                    Android (Chrome)
                  </h6>
                  <ol className="list-unstyled">
                    <li className="mb-2">
                      <i className="bi bi-1-circle me-2 text-primary"></i>
                      画面右上のメニュー <i className="bi bi-three-dots-vertical"></i> をタップ
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-2-circle me-2 text-primary"></i>
                      「ホーム画面に追加」をタップ
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-3-circle me-2 text-primary"></i>
                      「追加」をタップして完了
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <AccessibleAlert type="info" className="mt-4">
            <i className="bi bi-info-circle me-2"></i>
            インストール後は、ホーム画面のアイコンからアプリを起動できます。
            オフライン時でも一部の機能が利用可能です。
          </AccessibleAlert>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={handleModalClose}
          >
            後で
          </Button>
          <Button
            variant="primary"
            onClick={handleInstallClick}
            disabled={!deferredPrompt}
          >
            <i className="bi bi-download me-2"></i>
            インストール
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

/**
 * PWA 更新通知コンポーネント
 */
export const PWAUpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg)
        
        // 更新があるかチェック
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true)
              }
            })
          }
        })
      })
    }
  }, [])

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // Service Worker が制御権を取得したらリロード
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  const handleDismiss = () => {
    setShowUpdate(false)
  }

  if (!showUpdate) {
    return null
  }

  return (
    <div 
      className="position-fixed bottom-0 end-0 p-3"
      style={{ zIndex: 1050 }}
    >
      <div className="toast show" role="alert" aria-live="assertive" aria-atomic="true">
        <div className="toast-header">
          <i className="bi bi-arrow-clockwise text-primary me-2"></i>
          <strong className="me-auto">アップデート</strong>
          <button 
            type="button" 
            className="btn-close" 
            aria-label="閉じる"
            onClick={handleDismiss}
          ></button>
        </div>
        <div className="toast-body">
          <p className="mb-2">新しいバージョンが利用可能です</p>
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdate}
            >
              更新
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleDismiss}
            >
              後で
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * PWA 機能初期化フック
 */
export const usePWA = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // PWA サポートチェック
    const checkPWASupport = () => {
      const hasServiceWorker = 'serviceWorker' in navigator
      const hasManifest = 'manifest' in document.createElement('link')
      
      setIsSupported(hasServiceWorker && hasManifest)
    }
    
    // インストール状態チェック
    const checkInstallStatus = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone ||
                              document.referrer.includes('android-app://')
      
      setIsInstalled(isStandaloneMode)
    }
    
    checkPWASupport()
    checkInstallStatus()
    
    // 訪問回数をカウント
    const visitCount = parseInt(localStorage.getItem('visit-count') || '0')
    localStorage.setItem('visit-count', String(visitCount + 1))
    
    // Service Worker 登録
    if (isSupported && !isInstalled) {
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker 登録成功:', registration)
      
      // 定期的な更新チェック
      setInterval(() => {
        registration.update()
      }, 60000) // 1分ごと
      
    } catch (error) {
      console.error('Service Worker 登録失敗:', error)
    }
  }

  return {
    isSupported,
    isInstalled
  }
}

export default {
  PWAInstallPrompt,
  PWAUpdateNotification,
  usePWA
}