// Re-export new database types (with aliases to avoid conflicts)
export type { 
  TaxType,
  ReservationStatus,
  GenderType,
  Product as DatabaseProduct,
  ProductCreateInput,
  ProductUpdateInput,
  ProductPreset as DatabaseProductPreset,
  ProductPresetCreateInput,
  ProductPresetUpdateInput,
  PresetProduct as DatabasePresetProduct,
  PresetProductCreateInput,
  FormSettings as DatabaseFormSettings,
  FormSettingsCreateInput,
  FormSettingsUpdateInput,
  Reservation as DatabaseReservation,
  ReservationCreateInput,
  ReservationUpdateInput,
  SelectedProduct,
  PickupWindow as DatabasePickupWindow,
  PickupWindowCreateInput,
  PickupWindowUpdateInput,
  ReservationFormData as DatabaseReservationFormData,
  FormConfigResponse as DatabaseFormConfigResponse
} from './database';

// Re-export API types (with aliases to avoid conflicts)
export type {
  ApiSuccessResponse,
  PaginatedApiResponse,
  PaginationInfo as ApiPaginationInfo
} from './api';

// Legacy compatibility re-exports
import type {
  ProductPreset as DbProductPreset,
  Product as DbProduct,
  FormSettings as DbFormSettings,
  Reservation as DbReservation,
  SelectedProduct as DbSelectedProduct,
  PickupWindow as DbPickupWindow,
  ReservationFormData as DbReservationFormData,
  FormConfigResponse as DbFormConfigResponse,
  TaxType,
  ReservationStatus,
  GenderType,
} from './database';

// Legacy type aliases and extensions for backward compatibility
export type ProductPreset = DbProductPreset;

// Extended Product type with legacy fields for backward compatibility
export interface Product extends DbProduct {
  // Legacy compatibility fields
  external_id?: string;
  category_id?: number;
  base_product_name?: string;
  image_url?: string;
  stock_quantity?: number;
  description?: string;
  variation_type?: 'price' | 'size' | 'weight' | 'other';
  auto_barcode?: boolean;
  tax_rate?: number;
  price_type?: 'fixed' | 'department' | 'weight';
  price2?: number;
  cost_price?: number;
  unit_id?: number;
  unit_type?: 'piece' | 'kg' | 'g';
  unit_weight?: number;
  point_eligible?: boolean;
  receipt_print?: boolean;
  receipt_name?: string;
  input_name?: string;
  memo?: string;
  old_product_code?: string;
  analysis_tag_id?: number;
}

export interface FormSettings {
  id: number;
  preset_id: number;
  show_price: boolean;
  require_phone: boolean;
  require_furigana: boolean;
  allow_note: boolean;
  is_enabled: boolean;
  custom_message?: string;
  // Legacy fields for compatibility
  enable_birthday?: boolean;
  enable_gender?: boolean;
  require_address?: boolean;
  enable_furigana?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PresetProduct {
  id: number;
  preset_id: number;
  product_id: number;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  product?: Product; // JOIN時の商品情報
}

export interface PickupWindow {
  id: string | number;
  preset_id: number;
  product_id?: number | null;
  pickup_start: string;
  pickup_end: string;
  dates?: string[];
  price?: number | null;
  comment?: string | null;
  variation?: string | null;
  created_at?: string;
  updated_at?: string;
  product?: Product | null; // JOINed product information
}

export interface Reservation {
  id: string;
  user_id: string;
  product_preset_id: number;
  user_name: string;
  furigana?: string;
  phone_number: string;
  zip?: string;
  address?: string;
  product: string[];
  product_category?: string;
  quantity: number;
  unit_price: number;
  pickup_date?: string;
  variation?: string;
  comment?: string;
  note?: string;
  total_amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string | Record<string, unknown>;
  sent_at?: string;
  created_at?: string;
}

// Form data types
export interface ReservationFormData {
  user_name: string;
  furigana?: string;
  phone_number: string;
  zip?: string;
  address?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  products: ProductSelection[];
  pickup_dates: { [key: string]: string };
  note?: string;
}

export interface ProductSelection {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  variation?: string;
  comment?: string;
}

// LINE LIFF types
export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// Admin dashboard types
export interface DashboardStats {
  today_reservations: number;
  week_reservations: number;
  month_reservations: number;
  total_revenue: number;
}

export interface ReservationListItem extends Reservation {
  product_details?: Product[];
  preset_name?: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// Product search filters
export interface ProductFilters {
  name?: string;
  category_id?: string;
  min_price?: string;
  max_price?: string;
  variation_type?: string;
  sort_by?: 'name' | 'price' | 'created_at' | 'category_id';
  sort_order?: 'asc' | 'desc';
}

export interface FormConfigResponse {
  form_settings: FormSettings;
  products: Product[];
  pickup_windows: PickupWindow[];
  preset: ProductPreset;
  preset_products: PresetProduct[];
}

// Notification types
export type NotificationType = 'confirmation' | 'reminder' | 'cancellation' | 'error' | 'message_sent';

export interface LineNotificationPayload {
  type: NotificationType;
  user_id: string;
  reservation: Reservation;
  message_template?: string;
}

// Custom Error Classes
export class PresetNotFoundError extends Error {
  constructor(presetId: number) {
    super(`Preset not found: ${presetId}`);
    this.name = 'PresetNotFoundError';
  }
}

export class InvalidProductDataError extends Error {
  constructor(data: unknown) {
    super(`Invalid product data: ${JSON.stringify(data)}`);
    this.name = 'InvalidProductDataError';
  }
}

export class InvalidPresetIdError extends Error {
  constructor(presetId: string) {
    super(`Invalid preset ID: ${presetId}`);
    this.name = 'InvalidPresetIdError';
  }
}

export class InvalidApiResponseError extends Error {
  constructor(data: unknown) {
    super(`Invalid API response: ${JSON.stringify(data)}`);
    this.name = 'InvalidApiResponseError';
  }
}

// Type Guard Functions
export const isProduct = (value: unknown): value is Product => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Product).id === 'number' &&
    typeof (value as Product).name === 'string' &&
    typeof (value as Product).price === 'number'
  );
};

export const isPresetProduct = (value: unknown): value is PresetProduct => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as PresetProduct).id === 'number' &&
    typeof (value as PresetProduct).preset_id === 'number' &&
    typeof (value as PresetProduct).product_id === 'number' &&
    typeof (value as PresetProduct).display_order === 'number' &&
    typeof (value as PresetProduct).is_active === 'boolean'
  );
};

export const isFormConfigResponse = (value: unknown): value is FormConfigResponse => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FormConfigResponse).form_settings === 'object' &&
    Array.isArray((value as FormConfigResponse).products) &&
    Array.isArray((value as FormConfigResponse).pickup_windows) &&
    typeof (value as FormConfigResponse).preset === 'object'
  );
};

// 統合フォーム作成関連の型定義
export interface FormCreationRequest {
  preset_name: string;
  selected_products: number[];
  form_settings: {
    show_price: boolean;
    require_phone: boolean;
    require_furigana: boolean;
    allow_note: boolean;
  };
}

export interface FormCreationResponse {
  success: boolean;
  data?: {
    preset_id: number;
    preset_name: string;
    products_count: number;
    form_url: string;
  };
  error?: string;
}