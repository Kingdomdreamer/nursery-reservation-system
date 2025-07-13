// Common types used across the application

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface FormField {
  id: string
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date'
  label: string
  required?: boolean
  placeholder?: string
  options?: string[]
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
  }
}

export interface FormConfiguration extends BaseEntity {
  name: string
  description: string
  form_fields: {
    fields: FormField[]
  }
  is_active: boolean
  valid_from?: string
  valid_to?: string
  selected_products?: string[]
}

export interface ProductCategory extends BaseEntity {
  name: string
  description?: string
  color?: string
  is_active: boolean
  display_order: number
}

export interface Product extends BaseEntity {
  name: string
  description?: string
  price: number
  category_id?: string
  unit: string
  stock_quantity: number
  min_order_quantity: number
  max_order_quantity?: number
  barcode?: string
  variation_name?: string
  tax_type: 'inclusive' | 'exclusive'
  image_url?: string
  is_available: boolean
  display_order: number
  product_categories?: ProductCategory
}

export interface Customer extends BaseEntity {
  name: string
  furigana?: string
  email?: string
  phone?: string
  postal_code?: string
  address?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
}

export interface Reservation extends BaseEntity {
  customer_id: string
  pickup_date: string
  status: 'pending' | 'confirmed' | 'preparing' | 'completed' | 'cancelled'
  total_amount: number
  notes?: string
  customers?: Customer
}

export interface ReservationItem extends BaseEntity {
  reservation_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  products?: Product
}

export interface LineTemplate extends BaseEntity {
  name: string
  template_type: 'confirmation' | 'reminder' | 'payment' | 'cancellation'
  subject: string
  content: string
  is_active: boolean
}

export interface NotificationHistory extends BaseEntity {
  template_id: string
  reservation_id: string
  recipient: string
  status: 'sent' | 'failed' | 'pending'
  sent_at?: string
  error_message?: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Form validation types
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface ValidationErrors {
  [fieldName: string]: string[]
}

// Status types
export type FormStatus = 'active' | 'inactive' | 'pending' | 'expired'
export type ReservationStatus = 'pending' | 'confirmed' | 'preparing' | 'completed' | 'cancelled'
export type NotificationStatus = 'sent' | 'failed' | 'pending'

// Configuration types
export interface SystemConfig {
  businessName: string
  businessAddress: string
  businessPhone: string
  businessEmail: string
  operatingHours: {
    [day: string]: {
      open: string
      close: string
      closed: boolean
    }
  }
  notifications: {
    lineEnabled: boolean
    emailEnabled: boolean
    smsEnabled: boolean
  }
}