import { createClient } from '@supabase/supabase-js'

// 環境変数の取得とデフォルト値の設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

// --- Database 型定義 ---
export type Database = {
  public: {
    Tables: {
      product_categories: {
        Row: ProductCategory
        Insert: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
      }
      customers: {
        Row: Customer
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>
      }
      reservations: {
        Row: Reservation
        Insert: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Reservation, 'id' | 'created_at' | 'updated_at'>>
      }
      reservation_items: {
        Row: ReservationItem
        Insert: Omit<ReservationItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ReservationItem, 'id' | 'created_at' | 'updated_at'>>
      }
      form_configurations: {
        Row: FormConfiguration
        Insert: Omit<FormConfiguration, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FormConfiguration, 'id' | 'created_at' | 'updated_at'>>
      }
      line_templates: {
        Row: LineTemplate
        Insert: Omit<LineTemplate, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<LineTemplate, 'id' | 'created_at' | 'updated_at'>>
      }
      notification_histories: {
        Row: NotificationHistory
        Insert: Omit<NotificationHistory, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<NotificationHistory, 'id' | 'created_at' | 'updated_at'>>
      }
      stock_histories: {
        Row: StockHistory
        Insert: Omit<StockHistory, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<StockHistory, 'id' | 'created_at' | 'updated_at'>>
      }
      system_settings: {
        Row: SystemSetting
        Insert: Omit<SystemSetting, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SystemSetting, 'id' | 'created_at' | 'updated_at'>>
      }
      business_calendars: {
        Row: BusinessCalendar
        Insert: Omit<BusinessCalendar, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<BusinessCalendar, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}

// Supabase クライアントのシングルトンインスタンス
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    })
  }
  return supabaseInstance
}

export const getSupabaseAdminClient = () => {
  if (!supabaseAdminInstance) {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
    supabaseAdminInstance = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseAdminInstance
}

// 後方互換性のためのエクスポート
export const supabase = getSupabaseClient()
export const supabaseAdmin = getSupabaseAdminClient()

// --- Database Types ---
export interface ProductCategory {
  id: string
  name: string
  description?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  category_id?: string
  name: string
  description?: string
  price: number
  unit: string
  stock_quantity: number
  min_order_quantity: number
  max_order_quantity?: number
  image_url: string | null
  is_available: boolean
  seasonal_availability?: any
  display_order: number
  barcode?: string
  variation_name?: string
  tax_type?: string
  created_at: string
  updated_at: string
  category?: ProductCategory
}

export interface Customer {
  id: string
  full_name: string
  email?: string
  phone: string
  postal_code?: string
  prefecture?: string
  city?: string
  address_line1?: string
  address_line2?: string
  birth_date?: string
  notes?: string
  line_user_id?: string
  preferred_contact_method: string
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  reservation_number: string
  customer_id: string
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
  reservation_date: string
  pickup_time_start?: string
  pickup_time_end?: string
  total_amount: number
  discount_amount: number
  final_amount: number
  notes?: string
  admin_notes?: string
  payment_status: 'unpaid' | 'paid' | 'partial' | 'refunded'
  payment_method?: string
  confirmation_sent_at?: string
  reminder_sent_at?: string
  created_at: string
  updated_at: string
  customer?: Customer
  reservation_items?: ReservationItem[]
}

export interface ReservationItem {
  id: string
  reservation_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  notes?: string
  created_at: string
  product?: Product
}

export interface FormConfiguration {
  id: string
  name: string
  description?: string
  form_fields: any
  settings: any
  is_active: boolean
  version: number
  created_at: string
  updated_at: string
}

export interface LineTemplate {
  id: string
  name: string
  template_type: 'reservation_confirmation' | 'reservation_reminder' | 'payment_confirmation' | 'cancellation'
  subject: string
  message: string
  variables?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NotificationHistory {
  id: string
  reservation_id: string
  template_id?: string
  notification_type: string
  recipient: string
  subject?: string
  message: string
  status: 'pending' | 'sent' | 'failed' | 'delivered'
  sent_at?: string
  error_message?: string
  created_at: string
}

export interface StockHistory {
  id: string
  product_id: string
  change_type: 'increase' | 'decrease' | 'adjustment'
  quantity_change: number
  previous_quantity: number
  new_quantity: number
  reason?: string
  reference_id?: string
  admin_user_id?: string
  created_at: string
  product?: Product
}

export interface SystemSetting {
  id: string
  setting_key: string
  setting_value: any
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface BusinessCalendar {
  id: string
  date: string
  is_open: boolean
  open_time?: string
  close_time?: string
  notes?: string
  is_holiday: boolean
  created_at: string
  updated_at: string
}
