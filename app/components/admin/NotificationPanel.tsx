'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  read: boolean
  created_at: string
  action_url?: string
}

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { showSuccess, showError } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      // システム通知を生成（実際の実装では通知テーブルから取得）
      const systemNotifications: Notification[] = [
        {
          id: '1',
          type: 'info',
          title: '今日の予約',
          message: '本日の予約が3件あります',
          read: false,
          created_at: new Date().toISOString(),
          action_url: '/admin/reservations'
        },
        {
          id: '2',
          type: 'warning',
          title: '在庫切れ商品',
          message: '2つの商品が在庫切れです',
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          action_url: '/admin/products'
        },
        {
          id: '3',
          type: 'success',
          title: '設定更新',
          message: 'システム設定が正常に更新されました',
          read: true,
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ]

      setNotifications(systemNotifications)
    } catch (error) {
      console.error('通知の取得に失敗:', error)
      showError('通知の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
    showSuccess('すべての通知を既読にしました')
  }

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    )
    showSuccess('通知を削除しました')
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return 'bi-info-circle text-primary'
      case 'warning':
        return 'bi-exclamation-triangle text-warning'
      case 'success':
        return 'bi-check-circle text-success'
      case 'error':
        return 'bi-x-circle text-danger'
      default:
        return 'bi-bell text-secondary'
    }
  }

  const handleActionClick = (notification: Notification) => {
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
    markAsRead(notification.id)
    onClose()
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!isOpen) return null

  return (
    <>
      {/* オーバーレイ */}
      <div 
        className="position-fixed w-100 h-100 top-0 start-0" 
        style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1040 }}
        onClick={onClose}
      />

      {/* 通知パネル */}
      <div 
        className="position-fixed bg-white border shadow-lg"
        style={{
          top: '70px',
          right: '20px',
          width: '400px',
          maxHeight: '600px',
          zIndex: 1050,
          borderRadius: '8px'
        }}
      >
        {/* ヘッダー */}
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <div className="d-flex align-items-center">
            <h5 className="mb-0 fw-bold">通知</h5>
            {unreadCount > 0 && (
              <span className="badge bg-danger ms-2">{unreadCount}</span>
            )}
          </div>
          <div className="d-flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn btn-outline-primary btn-sm"
                title="すべて既読にする"
              >
                <i className="bi bi-check2-all"></i>
              </button>
            )}
            <button
              onClick={onClose}
              className="btn btn-outline-secondary btn-sm"
              title="閉じる"
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
        </div>

        {/* 通知リスト */}
        <div className="overflow-auto" style={{ maxHeight: '500px' }}>
          {loading ? (
            <div className="d-flex justify-content-center p-4">
              <div className="spinner-border spinner-border-sm"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <i className="bi bi-bell-slash fs-2 d-block mb-2"></i>
              <p className="mb-0">通知はありません</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-3 border-bottom ${!notification.read ? 'bg-light' : ''}`}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-1">
                      <i className={`${getNotificationIcon(notification.type)} me-2`}></i>
                      <h6 className="mb-0 fw-medium">{notification.title}</h6>
                      {!notification.read && (
                        <span className="badge bg-primary ms-2">未読</span>
                      )}
                    </div>
                    <p className="mb-2 text-muted small">{notification.message}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {new Date(notification.created_at).toLocaleString('ja-JP')}
                      </small>
                      <div className="d-flex gap-1">
                        {notification.action_url && (
                          <button
                            onClick={() => handleActionClick(notification)}
                            className="btn btn-outline-primary btn-sm"
                          >
                            確認
                          </button>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="btn btn-outline-secondary btn-sm"
                          >
                            既読
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="btn btn-outline-danger btn-sm"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* フッター */}
        {notifications.length > 0 && (
          <div className="p-3 border-top bg-light">
            <div className="text-center">
              <button
                onClick={() => {
                  window.location.href = '/admin/notifications'
                  onClose()
                }}
                className="btn btn-outline-primary btn-sm"
              >
                すべての通知を表示
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}