import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category_id: string | null
  unit: string | null
  min_order_quantity: number
  max_order_quantity: number | null
  variation_name: string | null
  image_url: string | null
  barcode: string | null
  tax_type: string
  is_available: boolean
  display_order: number
  created_at: string
  updated_at: string
  category?: ProductCategory
}

export interface ProductCategory {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  full_name: string
  phone: string
  email: string | null
  postal_code: string | null
  prefecture: string | null
  city: string | null
  address_line1: string | null
  line_user_id: string | null
  preferred_contact_method: string
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  reservation_number: string
  customer_id: string
  reservation_date: string
  pickup_time_start: string
  pickup_time_end: string
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
  payment_status: 'unpaid' | 'paid' | 'partial' | 'refunded'
  total_amount: number
  discount_amount: number | null
  final_amount: number
  notes: string | null
  admin_notes: string | null
  confirmation_sent_at: string | null
  reminder_sent_at: string | null
  created_at: string
  updated_at: string
  customer?: Customer
  items?: ReservationItem[]
  reservation_items?: ReservationItem[]
}

export interface ReservationItem {
  id: string
  reservation_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  pickup_date: string
  created_at: string
  updated_at: string
  product?: Product
}

export interface FormConfiguration {
  id: string
  name: string
  description: string | null
  form_fields: any
  settings: any
  is_active: boolean
  valid_from: string | null
  valid_to: string | null
  version: number
  created_at: string
  updated_at: string
}

export interface LineTemplate {
  id: string
  name: string
  template_type: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
  subject?: string
  message?: string
}

export interface ProductWithVariations extends Product {
  // Add any additional properties specific to product variations
}

// Database schema types
export type Database = {
  public: {
    Tables: {
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
      }
      product_categories: {
        Row: ProductCategory
        Insert: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>>
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
    }
  }
}