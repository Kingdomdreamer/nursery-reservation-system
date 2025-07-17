import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * モーダルのサイズ
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'

/**
 * モーダルコンポーネントのプロパティ
 */
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: ModalSize
  centered?: boolean
  backdrop?: boolean | 'static'
  keyboard?: boolean
  scrollable?: boolean
  children: React.ReactNode
  className?: string
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
}

/**
 * モーダルヘッダーコンポーネント
 */
export const ModalHeader: React.FC<{
  title?: string
  onClose?: () => void
  className?: string
  children?: React.ReactNode
}> = ({ title, onClose, className = '', children }) => (
  <div className={`modal-header ${className}`}>
    {children || (
      <>
        <h5 className="modal-title">{title}</h5>
        {onClose && (
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
          />
        )}
      </>
    )}
  </div>
)

/**
 * モーダルボディコンポーネント
 */
export const ModalBody: React.FC<{
  className?: string
  children: React.ReactNode
}> = ({ className = '', children }) => (
  <div className={`modal-body ${className}`}>
    {children}
  </div>
)

/**
 * モーダルフッターコンポーネント
 */
export const ModalFooter: React.FC<{
  className?: string
  children: React.ReactNode
}> = ({ className = '', children }) => (
  <div className={`modal-footer ${className}`}>
    {children}
  </div>
)

/**
 * 再利用可能なモーダルコンポーネント
 * Bootstrap 5モーダルをベースとした実装
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  centered = false,
  backdrop = true,
  keyboard = true,
  scrollable = false,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null)

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (keyboard && event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, keyboard, onClose])

  // バックドロップクリックでモーダルを閉じる
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (backdrop === true && event.target === modalRef.current) {
      onClose()
    }
  }

  // モーダルが開いていない場合は何も表示しない
  if (!isOpen) return null

  // クラス名の生成
  const modalDialogClasses = [
    'modal-dialog',
    size !== 'md' ? `modal-${size}` : '',
    centered ? 'modal-dialog-centered' : '',
    scrollable ? 'modal-dialog-scrollable' : ''
  ].filter(Boolean).join(' ')

  // モーダルコンテンツ
  const modalContent = (
    <div
      ref={modalRef}
      className={`modal show d-block ${className}`}
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
    >
      <div className={modalDialogClasses}>
        <div className="modal-content">
          {title && (
            <ModalHeader
              title={title}
              onClose={onClose}
              className={headerClassName}
            />
          )}
          
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              // 子要素がModalHeader、ModalBody、ModalFooterの場合は適切なclassNameを適用
              if (child.type === ModalHeader) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  className: `${child.props.className || ''} ${headerClassName}`.trim()
                })
              }
              if (child.type === ModalBody) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  className: `${child.props.className || ''} ${bodyClassName}`.trim()
                })
              }
              if (child.type === ModalFooter) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  className: `${child.props.className || ''} ${footerClassName}`.trim()
                })
              }
            }
            return child
          })}
        </div>
      </div>
    </div>
  )

  // ポータルを使用してbody要素にモーダルを描画
  return createPortal(modalContent, document.body)
}

/**
 * 確認ダイアログモーダル
 */
export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '確認',
  message,
  confirmText = '実行',
  cancelText = 'キャンセル',
  variant = 'danger'
}) => {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" centered>
      <ModalHeader title={title} onClose={onClose} />
      <ModalBody>
        <p className="mb-0">{message}</p>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
        >
          {cancelText}
        </button>
        <button
          type="button"
          className={`btn btn-${variant}`}
          onClick={handleConfirm}
        >
          {confirmText}
        </button>
      </ModalFooter>
    </Modal>
  )
}

export default Modal