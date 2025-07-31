// Database types based on the design document
export interface ProductPreset {
  id: number;
  preset_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  external_id?: string;
  category_id?: number;
  price: number;
  
  // バリエーション管理フィールド
  base_product_name?: string;      // 基本商品名
  variation_name?: string;         // バリエーション名
  variation_type?: 'price' | 'size' | 'weight' | 'other'; // バリエーション種別
  
  // POSシステム連携フィールド
  product_code?: string;           // 商品コード
  barcode?: string;               // バーコード
  auto_barcode?: boolean;         // 自動発番フラグ
  
  // 税設定フィールド
  tax_type?: 'inclusive' | 'exclusive'; // 内税/外税
  tax_rate?: number;              // 税率（%）
  
  // 価格設定フィールド
  price_type?: 'fixed' | 'department' | 'weight'; // 価格設定タイプ
  price2?: number;                // 税率別価格2
  cost_price?: number;            // 原価
  
  // 販売・表示設定
  unit_id?: number;               // 販売単位ID
  unit_type?: 'piece' | 'kg' | 'g'; // 単位タイプ
  unit_weight?: number;           // 単位重量
  
  // システム設定
  point_eligible?: boolean;       // ポイント付与対象
  visible?: boolean;              // 表示/非表示
  receipt_print?: boolean;        // レシート印字設定
  
  // その他
  receipt_name?: string;          // レシート用商品名
  input_name?: string;           // 商品入力用名称
  memo?: string;                 // 備考
  old_product_code?: string;     // 旧商品コード
  analysis_tag_id?: number;      // 分析タグID
  
  created_at?: string;
  updated_at?: string;
}

export interface FormSettings {
  id: number;
  preset_id: number;
  show_price: boolean;
  require_address: boolean;
  enable_gender: boolean;
  enable_birthday: boolean;
  enable_furigana: boolean;
  pickup_start?: string;
  pickup_end?: string;
  valid_until?: string;
  is_enabled: boolean;
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
  id: number;
  product_id: number;
  pickup_start: string;
  pickup_end: string;
  preset_id: number;
  dates: string[];
  price?: number;
  comment?: string;
  variation?: string;
  created_at?: string;
  updated_at?: string;
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
}

// Notification types
export type NotificationType = 'confirmation' | 'reminder' | 'cancellation' | 'error' | 'message_sent';

export interface LineNotificationPayload {
  type: NotificationType;
  user_id: string;
  reservation: Reservation;
  message_template?: string;
}