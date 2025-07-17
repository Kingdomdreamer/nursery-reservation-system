import React from 'react'

/**
 * アクセシビリティヘルパーコンポーネント
 * スクリーンリーダー専用のテキストやアクセシビリティ関連のユーティリティ
 */

/**
 * スクリーンリーダー専用テキストコンポーネント
 * 視覚的には隠れているが、スクリーンリーダーには読み上げられるテキスト
 */
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="visually-hidden">{children}</span>
)

/**
 * スキップリンクコンポーネント
 * キーボードナビゲーション時にメインコンテンツにスキップするためのリンク
 */
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a
    href={href}
    className="visually-hidden-focusable bg-primary text-white p-2 position-absolute top-0 start-0 z-index-1050"
    style={{ zIndex: 1050 }}
  >
    {children}
  </a>
)

/**
 * ライブリージョンコンポーネント
 * 動的コンテンツの変更をスクリーンリーダーに通知
 */
export interface LiveRegionProps {
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  className?: string
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = false,
  relevant = 'additions text',
  className = ''
}) => (
  <div
    aria-live={politeness}
    aria-atomic={atomic}
    aria-relevant={relevant}
    className={className}
  >
    {children}
  </div>
)

/**
 * フォーカス管理フック
 * コンポーネントのマウント時に特定の要素にフォーカスを当てる
 */
export const useFocusManagement = (ref: React.RefObject<HTMLElement>, shouldFocus: boolean = true) => {
  React.useEffect(() => {
    if (shouldFocus && ref.current) {
      ref.current.focus()
    }
  }, [shouldFocus, ref])
}

/**
 * エスケープキーハンドラーフック
 * エスケープキーが押されたときのハンドラー
 */
export const useEscapeKey = (onEscape: () => void) => {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onEscape])
}

/**
 * アクセシブルなアイコンコンポーネント
 * アイコンに適切なaria属性を追加
 */
export interface AccessibleIconProps {
  children: React.ReactNode
  label?: string
  decorative?: boolean
  className?: string
}

export const AccessibleIcon: React.FC<AccessibleIconProps> = ({
  children,
  label,
  decorative = false,
  className = ''
}) => (
  <span
    className={className}
    aria-label={decorative ? undefined : label}
    aria-hidden={decorative}
    role={decorative ? 'presentation' : undefined}
  >
    {children}
  </span>
)

/**
 * アクセシブルなローディングインジケーター
 */
export const AccessibleLoadingIndicator: React.FC<{
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ label = '読み込み中', size = 'md', className = '' }) => (
  <div
    className={`d-flex align-items-center justify-content-center ${className}`}
    role="status"
    aria-live="polite"
    aria-label={label}
  >
    <span
      className={`spinner-border ${size !== 'md' ? `spinner-border-${size}` : ''} me-2`}
      aria-hidden="true"
    ></span>
    <ScreenReaderOnly>{label}</ScreenReaderOnly>
  </div>
)

/**
 * アクセシブルなアラートコンポーネント
 */
export interface AccessibleAlertProps {
  children: React.ReactNode
  type?: 'success' | 'warning' | 'error' | 'info'
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

export const AccessibleAlert: React.FC<AccessibleAlertProps> = ({
  children,
  type = 'info',
  dismissible = false,
  onDismiss,
  className = ''
}) => {
  const alertClasses = [
    'alert',
    `alert-${type === 'error' ? 'danger' : type}`,
    dismissible ? 'alert-dismissible' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div
      className={alertClasses}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {children}
      {dismissible && onDismiss && (
        <button
          type="button"
          className="btn-close"
          aria-label="閉じる"
          onClick={onDismiss}
        ></button>
      )}
    </div>
  )
}

/**
 * アクセシブルなタブコンポーネント用のキーボードナビゲーション
 */
export const useTabKeyboardNavigation = (
  tabRefs: React.RefObject<HTMLElement>[],
  activeIndex: number,
  onTabChange: (index: number) => void
) => {
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        const nextIndex = (activeIndex + 1) % tabRefs.length
        onTabChange(nextIndex)
        tabRefs[nextIndex]?.current?.focus()
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        const prevIndex = (activeIndex - 1 + tabRefs.length) % tabRefs.length
        onTabChange(prevIndex)
        tabRefs[prevIndex]?.current?.focus()
        break
      case 'Home':
        event.preventDefault()
        onTabChange(0)
        tabRefs[0]?.current?.focus()
        break
      case 'End':
        event.preventDefault()
        const lastIndex = tabRefs.length - 1
        onTabChange(lastIndex)
        tabRefs[lastIndex]?.current?.focus()
        break
    }
  }, [activeIndex, tabRefs, onTabChange])

  return { handleKeyDown }
}

export default {
  ScreenReaderOnly,
  SkipLink,
  LiveRegion,
  AccessibleIcon,
  AccessibleLoadingIndicator,
  AccessibleAlert,
  useFocusManagement,
  useEscapeKey,
  useTabKeyboardNavigation
}