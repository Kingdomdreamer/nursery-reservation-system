import { supabase } from '../../../lib/supabase'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
  actionUrl?: string
  user_id?: string
}

export class NotificationService {
  static async getAllNotifications(): Promise<Notification[]> {
    try {
      // 実際の通知テーブルが存在しない場合、動的に通知を生成
      const notifications: Notification[] = []

      // 最近の予約から通知を生成
      const { data: recentReservations } = await supabase
        .from('reservations')
        .select(`
          id,
          reservation_number,
          status,
          created_at,
          updated_at,
          customer:customers (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      recentReservations?.forEach((reservation: any) => {
        const timeDiff = Date.now() - new Date(reservation.created_at).getTime()
        
        // 24時間以内の新規予約
        if (timeDiff < 24 * 60 * 60 * 1000) {
          notifications.push({
            id: `reservation_${reservation.id}`,
            title: '新しい予約',
            message: `${reservation.customer?.name || '顧客'}様から新しい予約が入りました（${reservation.reservation_number}）`,
            type: 'info',
            isRead: false,
            createdAt: reservation.created_at,
            actionUrl: '/admin?page=reservation-list'
          })
        }

        // ステータス変更通知
        if (reservation.status === 'confirmed' && 
            new Date(reservation.updated_at).getTime() - new Date(reservation.created_at).getTime() > 60000) {
          notifications.push({
            id: `confirmed_${reservation.id}`,
            title: '予約確定',
            message: `予約 ${reservation.reservation_number} が確定されました`,
            type: 'success',
            isRead: Math.random() > 0.7, // ランダムに既読状態を設定
            createdAt: reservation.updated_at,
            actionUrl: '/admin?page=reservation-list'
          })
        }
      })

      // 在庫管理機能は実装対象外のため削除

      // 保留中の予約が多い場合の通知
      const { count: pendingCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (pendingCount && pendingCount > 5) {
        notifications.push({
          id: 'pending_reservations',
          title: '保留中の予約',
          message: `${pendingCount}件の予約が確認待ちです`,
          type: 'warning',
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/admin?page=reservation-list'
        })
      }

      // 作成日時でソート
      return notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 10) // 最新10件まで

    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      return []
    }
  }

  static async getUnreadNotifications(): Promise<Notification[]> {
    const notifications = await this.getAllNotifications()
    return notifications.filter(n => !n.isRead)
  }

  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      // 実際の通知テーブルがある場合の実装
      // 現在はローカルステートで管理しているため、true を返す
      return true
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      return false
    }
  }

  static async markAllAsRead(): Promise<boolean> {
    try {
      // 実際の通知テーブルがある場合の実装
      // 現在はローカルステートで管理しているため、true を返す
      return true
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      return false
    }
  }

  static async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification | null> {
    try {
      // 実際の通知テーブルがある場合の実装
      const newNotification: Notification = {
        ...notification,
        id: `custom_${Date.now()}`,
        createdAt: new Date().toISOString()
      }
      return newNotification
    } catch (error) {
      console.error('Failed to create notification:', error)
      return null
    }
  }

  static formatTimeAgo(dateString: string): string {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMinutes < 1) {
      return '今'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分前`
    } else if (diffHours < 24) {
      return `${diffHours}時間前`
    } else {
      return `${diffDays}日前`
    }
  }

  static getNotificationTypeColor(type: Notification['type']): string {
    switch (type) {
      case 'info': return 'bg-primary'
      case 'success': return 'bg-success'
      case 'warning': return 'bg-warning'
      case 'error': return 'bg-danger'
      default: return 'bg-secondary'
    }
  }

  // 通知の自動生成（定期実行用）
  static async generateSystemNotifications(): Promise<void> {
    try {
      // システムの健康状態チェック
      const systemNotifications = []

      // データベース接続テスト
      const { error } = await supabase.from('products').select('count', { count: 'exact', head: true })
      
      if (error) {
        systemNotifications.push({
          title: 'システムエラー',
          message: 'データベース接続に問題があります',
          type: 'error' as const,
          isRead: false
        })
      }

      // 各通知を作成
      for (const notification of systemNotifications) {
        await this.createNotification(notification)
      }
    } catch (error) {
      console.error('Failed to generate system notifications:', error)
    }
  }
}