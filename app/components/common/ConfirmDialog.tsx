'use client'

import React from 'react'
import { AlertTriangle, CheckCircle, XCircle, Info, Trash2, AlertCircle, Loader } from 'lucide-react'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmButtonVariant?: 'danger' | 'warning' | 'primary' | 'success'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  icon?: string
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = '実行',
  cancelText = 'キャンセル',
  confirmButtonVariant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
  icon = 'warning'
}) => {
  if (!isOpen) return null

  const getConfirmButtonClasses = () => {
    const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    
    switch (confirmButtonVariant) {
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`
      case 'warning':
        return `${baseClasses} bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500`
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`
      case 'success':
        return `${baseClasses} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`
      default:
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`
    }
  }

  const getIconColor = () => {
    switch (confirmButtonVariant) {
      case 'danger':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      case 'primary':
        return 'text-blue-500'
      case 'success':
        return 'text-green-500'
      default:
        return 'text-red-500'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    } else if (e.key === 'Enter' && !isLoading) {
      onConfirm()
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        {/* ヘッダー */}
        <div className="p-6 pb-0">
          <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 ${getIconColor()}`}>
              {icon === 'delete' && <Trash2 size={24} />}
              {icon === 'warning' && <AlertTriangle size={24} />}
              {icon === 'success' && <CheckCircle size={24} />}
              {icon === 'error' && <XCircle size={24} />}
              {icon === 'info' && <Info size={24} />}
              {!['delete', 'warning', 'success', 'error', 'info'].includes(icon) && <AlertCircle size={24} />}
            </div>
            <div>
              <h3 id="dialog-title" className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            </div>
          </div>
        </div>

        {/* メッセージ */}
        <div className="p-6 pt-4">
          <p id="dialog-message" className="text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* ボタン */}
        <div className="p-6 pt-0 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={getConfirmButtonClasses()}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader size={16} className="animate-spin" />
                <span>処理中...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// 削除確認専用のヘルパーコンポーネント
export interface DeleteConfirmDialogProps {
  isOpen: boolean
  title?: string
  itemName?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  title = '削除の確認',
  itemName = 'この項目',
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={title}
      message={`${itemName}を削除しますか？この操作は取り消すことができません。`}
      confirmText="削除"
      cancelText="キャンセル"
      confirmButtonVariant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
      isLoading={isLoading}
      icon="delete"
    />
  )
}

// キャンセル/取り消し確認専用のヘルパーコンポーネント
export interface CancelConfirmDialogProps {
  isOpen: boolean
  title?: string
  message?: string
  onConfirm: () => void
  onCancel: () => void
}

export const CancelConfirmDialog: React.FC<CancelConfirmDialogProps> = ({
  isOpen,
  title = '変更の破棄',
  message = '変更内容が破棄されますが、よろしいですか？',
  onConfirm,
  onCancel
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={title}
      message={message}
      confirmText="破棄"
      cancelText="続行"
      confirmButtonVariant="warning"
      onConfirm={onConfirm}
      onCancel={onCancel}
      icon="warning"
    />
  )
}

export default ConfirmDialog