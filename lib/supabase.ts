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
  parent_id: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  full_name: string
  phone: string
  email: string | null
  postal_code: string | null
  address: string | null
  line_user_id: string | null
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

export interface Form {
  id: string
  name: string
  description: string | null
  is_active: boolean
  valid_from: string | null
  valid_to: string | null
  created_at: string
  updated_at: string
}

export interface FormConfiguration {
  id: string
  form_id: string
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

export interface FormField {
  id: string
  form_id: string
  field_type: string
  field_name: string
  field_label: string
  field_options: any
  is_required: boolean
  validation_rules: any
  display_order: number
  created_at: string
  updated_at: string
}

export interface FormProduct {
  id: string
  form_id: string
  product_id: string
  display_order: number
  is_required: boolean
  max_quantity: number | null
  created_at: string
  updated_at: string
}

export interface FormDisplaySettings {
  id: string
  form_id: string
  show_prices: boolean
  price_display_mode: string
  show_categories: boolean
  show_descriptions: boolean
  custom_css: string | null
  created_at: string
  updated_at: string
}

export interface PricingDisplaySettings {
  id: string
  form_id: string
  show_item_prices: boolean
  show_subtotals: boolean
  show_total: boolean
  show_tax_breakdown: boolean
  price_format: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string | null
  type: string
  title: string
  message: string
  action_url: string | null
  is_read: boolean
  priority: string
  created_at: string
  updated_at: string
}

export interface SystemSetting {
  id: string
  category: string
  key: string
  value: any
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  role: string
  full_name: string | null
  email: string | null
  phone: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface ExportHistory {
  id: string
  export_type: string
  exported_by: string | null
  file_name: string | null
  file_size: number | null
  status: string
  download_url: string | null
  exported_at: string
  expires_at: string | null
}

export interface LineTemplate {
  id: string
  template_type: string
  template_name: string
  template_content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductWithVariations extends Product {
  // Add any additional properties specific to product variations
}

// Database schema types
export type Database = {
  public: {
    Tables: {
      customers: {
        Row: Customer
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>
      }
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
      forms: {
        Row: Form
        Insert: Omit<Form, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Form, 'id' | 'created_at' | 'updated_at'>>
      }
      form_configurations: {
        Row: FormConfiguration
        Insert: Omit<FormConfiguration, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FormConfiguration, 'id' | 'created_at' | 'updated_at'>>
      }
      form_fields: {
        Row: FormField
        Insert: Omit<FormField, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FormField, 'id' | 'created_at' | 'updated_at'>>
      }
      form_products: {
        Row: FormProduct
        Insert: Omit<FormProduct, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FormProduct, 'id' | 'created_at' | 'updated_at'>>
      }
      form_display_settings: {
        Row: FormDisplaySettings
        Insert: Omit<FormDisplaySettings, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FormDisplaySettings, 'id' | 'created_at' | 'updated_at'>>
      }
      pricing_display_settings: {
        Row: PricingDisplaySettings
        Insert: Omit<PricingDisplaySettings, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PricingDisplaySettings, 'id' | 'created_at' | 'updated_at'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Notification, 'id' | 'created_at' | 'updated_at'>>
      }
      system_settings: {
        Row: SystemSetting
        Insert: Omit<SystemSetting, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SystemSetting, 'id' | 'created_at' | 'updated_at'>>
      }
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      line_templates: {
        Row: LineTemplate
        Insert: Omit<LineTemplate, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<LineTemplate, 'id' | 'created_at' | 'updated_at'>>
      }
      export_history: {
        Row: ExportHistory
        Insert: Omit<ExportHistory, 'id' | 'exported_at'>
        Update: Partial<Omit<ExportHistory, 'id' | 'exported_at'>>
      }
    }
  }
}