import { supabase } from '../../../lib/supabase'

export interface DashboardStats {
  totalReservations: number
  todayReservations: number
  pendingReservations: number
  totalRevenue: number
  popularProducts: Array<{
    name: string
    count: number
  }>
}

export interface RecentActivity {
  id: string
  type: 'reservation_created' | 'reservation_confirmed' | 'low_stock' | 'reservation_cancelled'
  message: string
  timestamp: string
  color: 'green' | 'blue' | 'yellow' | 'red'
}

export class DashboardService {
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const [
        { count: totalReservations },
        { count: todayReservations },
        { count: pendingReservations },
        revenueData,
        popularProductsData
      ] = await Promise.all([
        supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00`),
        supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('reservations')
          .select('final_amount')
          .eq('payment_status', 'paid')
          .gte('created_at', `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01T00:00:00`),
        supabase
          .from('reservation_items')
          .select(`
            quantity,
            products (
              name
            )
          `)
          .limit(50)
      ])

      const totalRevenue = revenueData.data?.reduce((sum, reservation) => sum + (reservation.final_amount || 0), 0) || 0

      const productCounts = new Map<string, number>()
      popularProductsData.data?.forEach((item: any) => {
        if (item.products?.name) {
          const count = productCounts.get(item.products.name) || 0
          productCounts.set(item.products.name, count + (item.quantity || 0))
        }
      })

      const popularProducts = Array.from(productCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        totalReservations: totalReservations || 0,
        todayReservations: todayReservations || 0,
        pendingReservations: pendingReservations || 0,
        totalRevenue,
        popularProducts
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      return {
        totalReservations: 0,
        todayReservations: 0,
        pendingReservations: 0,
        totalRevenue: 0,
        popularProducts: []
      }
    }
  }

  static async getRecentActivities(): Promise<RecentActivity[]> {
    try {
      const { data: recentReservations } = await supabase
        .from('reservations')
        .select('id, status, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(10)

      const activities: RecentActivity[] = []

      recentReservations?.forEach((reservation: any) => {
        const createdAt = new Date(reservation.created_at)
        const updatedAt = new Date(reservation.updated_at)
        const now = new Date()

        if (Math.abs(now.getTime() - createdAt.getTime()) < 24 * 60 * 60 * 1000) {
          activities.push({
            id: `created_${reservation.id}`,
            type: 'reservation_created',
            message: '新しい予約が入りました',
            timestamp: reservation.created_at,
            color: 'green'
          })
        }

        if (reservation.status === 'confirmed' && Math.abs(now.getTime() - updatedAt.getTime()) < 24 * 60 * 60 * 1000) {
          activities.push({
            id: `confirmed_${reservation.id}`,
            type: 'reservation_confirmed',
            message: '予約が確定されました',
            timestamp: reservation.updated_at,
            color: 'blue'
          })
        }

        if (reservation.status === 'cancelled' && Math.abs(now.getTime() - updatedAt.getTime()) < 24 * 60 * 60 * 1000) {
          activities.push({
            id: `cancelled_${reservation.id}`,
            type: 'reservation_cancelled',
            message: '予約がキャンセルされました',
            timestamp: reservation.updated_at,
            color: 'red'
          })
        }
      })

      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('name, stock_quantity')
        .lt('stock_quantity', 10)
        .limit(3)

      lowStockProducts?.forEach((product: any) => {
        activities.push({
          id: `low_stock_${product.name}`,
          type: 'low_stock',
          message: `${product.name}の在庫が少なくなっています`,
          timestamp: new Date().toISOString(),
          color: 'yellow'
        })
      })

      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 4)
    } catch (error) {
      console.error('Failed to fetch recent activities:', error)
      return []
    }
  }

  static formatTimeAgo(timestamp: string): string {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return '今'
    if (diffInMinutes < 60) return `${diffInMinutes}分前`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}時間前`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}日前`
  }
}