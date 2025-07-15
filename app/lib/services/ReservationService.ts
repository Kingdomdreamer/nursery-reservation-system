import { supabase } from '../../../lib/supabase'

export interface ReservationItem {
  id: string
  reservation_number: string
  customerName: string
  phone: string
  email: string
  products: Array<{
    name: string
    quantity: number
    pickupDate: string
    price: number
  }>
  totalAmount: number
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
  createdAt: string
  notes?: string
  customer?: {
    name: string
    phone: string
    email: string
  }
}

export class ReservationService {
  static async getAllReservations(): Promise<ReservationItem[]> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          customer:customers (
            name,
            phone,
            email
          ),
          reservation_items (
            quantity,
            pickup_date,
            unit_price,
            product:products (
              name,
              price
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data?.map(reservation => ({
        id: reservation.id,
        reservation_number: reservation.reservation_number,
        customerName: reservation.customer?.name || '不明',
        phone: reservation.customer?.phone || '',
        email: reservation.customer?.email || '',
        products: reservation.reservation_items?.map((item: any) => ({
          name: item.product?.name || '不明',
          quantity: item.quantity || 0,
          pickupDate: item.pickup_date || '',
          price: item.unit_price || item.product?.price || 0
        })) || [],
        totalAmount: reservation.final_amount || 0,
        status: reservation.status as 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled',
        createdAt: reservation.created_at,
        notes: reservation.notes || reservation.admin_notes
      })) || []
    } catch (error) {
      console.error('Failed to fetch reservations:', error)
      return []
    }
  }

  static async updateReservationStatus(id: string, status: ReservationItem['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to update reservation status:', error)
      return false
    }
  }

  static async getReservationById(id: string): Promise<ReservationItem | null> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          customer:customers (
            name,
            phone,
            email
          ),
          reservation_items (
            quantity,
            pickup_date,
            unit_price,
            product:products (
              name,
              price
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      if (!data) return null

      return {
        id: data.id,
        reservation_number: data.reservation_number,
        customerName: data.customer?.name || '不明',
        phone: data.customer?.phone || '',
        email: data.customer?.email || '',
        products: data.reservation_items?.map((item: any) => ({
          name: item.product?.name || '不明',
          quantity: item.quantity || 0,
          pickupDate: item.pickup_date || '',
          price: item.unit_price || item.product?.price || 0
        })) || [],
        totalAmount: data.final_amount || 0,
        status: data.status as 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled',
        createdAt: data.created_at,
        notes: data.notes || data.admin_notes
      }
    } catch (error) {
      console.error('Failed to fetch reservation:', error)
      return null
    }
  }

  static async searchReservations(searchTerm: string, statusFilter?: string): Promise<ReservationItem[]> {
    try {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          customer:customers (
            name,
            phone,
            email
          ),
          reservation_items (
            quantity,
            pickup_date,
            unit_price,
            product:products (
              name,
              price
            )
          )
        `)

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (searchTerm) {
        query = query.or(`reservation_number.ilike.%${searchTerm}%,customers.name.ilike.%${searchTerm}%,customers.phone.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      return data?.map(reservation => ({
        id: reservation.id,
        reservation_number: reservation.reservation_number,
        customerName: reservation.customer?.name || '不明',
        phone: reservation.customer?.phone || '',
        email: reservation.customer?.email || '',
        products: reservation.reservation_items?.map((item: any) => ({
          name: item.product?.name || '不明',
          quantity: item.quantity || 0,
          pickupDate: item.pickup_date || '',
          price: item.unit_price || item.product?.price || 0
        })) || [],
        totalAmount: reservation.final_amount || 0,
        status: reservation.status as 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled',
        createdAt: reservation.created_at,
        notes: reservation.notes || reservation.admin_notes
      })) || []
    } catch (error) {
      console.error('Failed to search reservations:', error)
      return []
    }
  }

  static formatStatus(status: ReservationItem['status']): string {
    const statusMap = {
      pending: '保留中',
      confirmed: '確定',
      ready: '準備完了',
      completed: '完了',
      cancelled: 'キャンセル'
    }
    return statusMap[status] || status
  }

  static getStatusColor(status: ReservationItem['status']): string {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      ready: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }
}