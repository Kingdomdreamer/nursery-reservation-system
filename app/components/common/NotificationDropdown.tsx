'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Icons, Icon } from '../icons/Icons'
import { supabase } from '../../../lib/supabase'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
    
    // 外部クリックでドロップダウンを閉じる
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      // 実際のSupabaseクエリを後で実装
      // 今はモックデータを使用
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: '新しい予約',
          message: '田中様から新しい予約が入りました',
          type: 'info',
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/admin?page=reservation-list'
        },
        {
          id: '2',
          title: '在庫不足警告',
          message: 'トマトの苗の在庫が少なくなっています',
          type: 'warning',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          actionUrl: '/admin?page=product-list'
        },
        {
          id: '3',
          title: 'システム更新',
          message: 'システムが正常に更新されました',
          type: 'success',
          isRead: true,
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ]
      
      setNotifications(mockNotifications)
    } catch (error) {
      console.error('通知の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      // 実際のSupabaseクエリを後で実装
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      )
    } catch (error) {
      console.error('通知の既読化に失敗しました:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // 実際のSupabaseクエリを後で実装
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      )
    } catch (error) {
      console.error('全通知の既読化に失敗しました:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info': return Icons.info
      case 'success': return Icons.success
      case 'warning': return Icons.warning
      case 'error': return Icons.error
      default: return Icons.notification
    }
  }

  const getNotificationBadgeColor = (type: Notification['type']) => {
    switch (type) {
      case 'info': return 'bg-primary'
      case 'success': return 'bg-success'
      case 'warning': return 'bg-warning'
      case 'error': return 'bg-danger'
      default: return 'bg-secondary'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMinutes < 60) {
      return `${diffMinutes}分前`
    } else if (diffHours < 24) {
      return `${diffHours}時間前`
    } else {
      return `${diffDays}日前`
    }
  }

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* 通知ベルボタン */}
      <button
        className="btn btn-outline-secondary position-relative"
        onClick={() => setIsOpen(!isOpen)}
        title="通知"
      >
        <Icon icon={Icons.notification} size="sm" />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div 
          className="position-absolute end-0 mt-2 bg-white border border-secondary rounded shadow-lg"
          style={{ width: '320px', zIndex: 1000 }}
        >
          {/* ヘッダー */}
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
            <h6 className="mb-0 fw-bold">通知</h6>
            {unreadCount > 0 && (
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={markAllAsRead}
              >
                すべて既読
              </button>
            )}
          </div>

          {/* 通知リスト */}
          <div className="notification-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div className="d-flex align-items-center justify-content-center p-4">
                <Icon icon={Icons.loading} size="sm" className="animate-spin me-2" />
                <span>読み込み中...</span>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-bottom cursor-pointer ${
                    !notification.isRead ? 'bg-light' : ''
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id)
                    }
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl
                    }
                    setIsOpen(false)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-start">
                    <div className={`badge ${getNotificationBadgeColor(notification.type)} me-2 mt-1`}>
                      <Icon icon={getNotificationIcon(notification.type)} size="xs" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between">
                        <h6 className={`mb-1 ${!notification.isRead ? 'fw-bold' : ''}`}>
                          {notification.title}
                        </h6>
                        {!notification.isRead && (
                          <span className="badge bg-primary rounded-pill">新着</span>
                        )}
                      </div>
                      <p className="mb-1 small text-muted">{notification.message}</p>
                      <small className="text-muted">{formatTimeAgo(notification.createdAt)}</small>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-muted">
                <Icon icon={Icons.notification} size="lg" className="text-muted mb-2" />
                <p className="mb-0">新しい通知はありません</p>
              </div>
            )}
          </div>

          {/* フッター */}
          {notifications.length > 0 && (
            <div className="p-2 border-top text-center">
              <button 
                className="btn btn-sm btn-link text-decoration-none"
                onClick={() => {
                  // 通知履歴ページに遷移（未実装）
                  setIsOpen(false)
                }}
              >
                すべての通知を表示
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown