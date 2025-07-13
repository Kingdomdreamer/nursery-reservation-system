import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for admin operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database Types
export interface Product {
  id: string
  name: string
  price: number
  category: string
  stock: number
  description?: string
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_furigana?: string
  customer_gender?: 'male' | 'female' | 'other'
  customer_birthday?: string
  customer_zipcode?: string
  customer_address?: string
  customer_address_detail?: string
  line_user_id?: string
  products: ProductItem[]
  total_amount: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  pickup_date: string
  note?: string
  created_at: string
  updated_at: string
}

export interface ProductItem {
  product_id: string
  product_name: string
  price: number
  quantity: number
}

export interface FormConfig {
  id: string
  name: string
  description: string
  settings: {
    enable_furigana: boolean
    enable_gender: boolean
    enable_birthday: boolean
    require_address: boolean
    show_price: boolean
    pickup_windows: string[] // Available pickup dates
  }
  created_at: string
  updated_at: string
}