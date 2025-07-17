export interface FormField {
  id: string
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date'
  label: string
  required: boolean
  placeholder?: string
  options?: string[]
}

export interface FormTemplate {
  id: string
  name: string
  description: string
  is_active: boolean
  field_count: number
  response_count: number
  valid_from?: string
  valid_to?: string
  pricing_display?: PricingDisplaySettings
  created_at: string
  updated_at: string
}

export interface PricingDisplaySettings {
  show_item_prices: boolean
  show_subtotal: boolean
  show_total_amount: boolean
  show_item_quantity: boolean
  pricing_display_mode: 'full' | 'summary' | 'hidden' | 'custom'
}

export interface FormConfiguration {
  id: string
  name: string
  description: string
  is_active: boolean
  valid_from?: string
  valid_to?: string
  fields: FormField[]
  pricing_display: PricingDisplaySettings
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  price: number
  category_id: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductCategory {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  furigana?: string
  email?: string
  phone?: string
  postal_code?: string
  prefecture?: string
  city?: string
  address?: string
  birth_date?: string
  gender?: string
  line_user_id?: string
  created_at: string
  updated_at: string
}

export interface LineUserProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

export interface LineAuthInfo {
  line_user_id: string
  customer_id?: string
  profile: LineUserProfile
  access_token?: string
  last_linked_at: string
  created_at: string
  updated_at: string
}