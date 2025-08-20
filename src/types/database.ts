/**
 * 統一データベース型定義
 * 設計文書に基づく包括的な型定義
 */

// ===== 基本型定義 =====

export type TaxType = '内税' | '外税';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type GenderType = '男性' | '女性' | 'その他';

// ===== 商品関連型定義 =====

export interface Product {
  readonly id: number;
  readonly product_code?: string;
  readonly name: string;
  readonly variation_id: number;
  readonly variation_name: string;
  readonly tax_type: TaxType;
  readonly price: number;
  readonly barcode?: string;
  readonly visible: boolean;
  readonly display_order: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ProductCreateInput {
  readonly product_code?: string;
  readonly name: string;
  readonly variation_id?: number;
  readonly variation_name?: string;
  readonly tax_type?: TaxType;
  readonly price: number;
  readonly barcode?: string;
  readonly visible?: boolean;
  readonly display_order?: number;
}

export interface ProductUpdateInput {
  readonly product_code?: string;
  readonly name?: string;
  readonly variation_id?: number;
  readonly variation_name?: string;
  readonly tax_type?: TaxType;
  readonly price?: number;
  readonly barcode?: string;
  readonly visible?: boolean;
  readonly display_order?: number;
}

// ===== プリセット関連型定義 =====

export interface ProductPreset {
  readonly id: number;
  readonly preset_name: string;
  readonly description?: string;
  readonly form_expiry_date?: string;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

// 表示用のプリセット型（フロントエンドとの互換性維持）
export interface ProductPresetDisplay extends ProductPreset {
  readonly name: string; // preset_name のエイリアス
}

export interface ProductPresetCreateInput {
  readonly preset_name: string;
  readonly description?: string;
  readonly form_expiry_date?: string;
  readonly is_active?: boolean;
}

export interface ProductPresetUpdateInput {
  readonly preset_name?: string;
  readonly description?: string;
  readonly form_expiry_date?: string;
  readonly is_active?: boolean;
}

// ===== プリセット商品関連型定義 =====

export interface PresetProduct {
  readonly id: number;
  readonly preset_id: number;
  readonly product_id: number;
  readonly pickup_start: string;
  readonly pickup_end: string;
  readonly display_order: number;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
  readonly product?: Product;
}

export interface PresetProductCreateInput {
  readonly preset_id: number;
  readonly product_id: number;
  readonly pickup_start: string;
  readonly pickup_end: string;
  readonly display_order?: number;
  readonly is_active?: boolean;
}

export interface PresetProductUpdateInput {
  readonly pickup_start?: string;
  readonly pickup_end?: string;
  readonly display_order?: number;
  readonly is_active?: boolean;
}

// ===== フォーム設定型定義 =====

export interface FormSettings {
  readonly id: number;
  readonly preset_id: number;
  
  // 表示項目設定
  readonly show_name: boolean;
  readonly show_furigana: boolean;
  readonly show_gender: boolean;
  readonly show_birthday: boolean;
  readonly show_phone: boolean;
  readonly show_zip: boolean;
  readonly show_address1: boolean;
  readonly show_address2: boolean;
  readonly show_comment: boolean;
  readonly show_price: boolean;
  readonly show_total: boolean;
  
  // 互換性フィールド
  readonly require_phone: boolean;
  readonly require_furigana: boolean;
  readonly allow_note: boolean;
  readonly enable_birthday: boolean;
  readonly enable_gender: boolean;
  readonly require_address: boolean;
  readonly enable_furigana: boolean;
  
  // システム設定
  readonly is_enabled: boolean;
  readonly custom_message?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface FormSettingsCreateInput {
  readonly preset_id: number;
  readonly show_name?: boolean;
  readonly show_furigana?: boolean;
  readonly show_gender?: boolean;
  readonly show_birthday?: boolean;
  readonly show_phone?: boolean;
  readonly show_zip?: boolean;
  readonly show_address1?: boolean;
  readonly show_address2?: boolean;
  readonly show_comment?: boolean;
  readonly show_price?: boolean;
  readonly show_total?: boolean;
  readonly require_phone?: boolean;
  readonly require_furigana?: boolean;
  readonly allow_note?: boolean;
  readonly enable_birthday?: boolean;
  readonly enable_gender?: boolean;
  readonly require_address?: boolean;
  readonly enable_furigana?: boolean;
  readonly is_enabled?: boolean;
  readonly custom_message?: string;
}

export type FormSettingsUpdateInput = Omit<FormSettingsCreateInput, 'preset_id'>;

// ===== 予約関連型定義 =====

export interface SelectedProduct {
  readonly product_id: number;
  readonly product_name: string;
  readonly name: string; // 互換性
  readonly variation_name: string;
  readonly quantity: number;
  readonly unit_price: number;
  readonly price: number; // 互換性
  readonly total_price: number;
  readonly tax_type: TaxType;
}

export interface Reservation {
  readonly id: string;
  readonly preset_id: number;
  readonly reservation_number: string;
  
  // 顧客情報
  readonly user_name: string;
  readonly furigana?: string;
  readonly gender?: GenderType;
  readonly birthday?: string;
  readonly phone_number: string;
  readonly zip_code?: string;
  readonly address1?: string;
  readonly address2?: string;
  readonly comment?: string;
  
  // 互換性フィールド
  readonly phone?: string;
  readonly pickup_date: string;
  readonly pickup_time?: string;
  readonly note?: string;
  
  // 予約情報
  readonly selected_products: SelectedProduct[];
  readonly products?: SelectedProduct[]; // 互換性
  readonly total_amount: number;
  
  // システム情報
  readonly status: ReservationStatus;
  readonly line_user_id?: string;
  readonly cancel_token?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ReservationCreateInput {
  readonly preset_id: number;
  readonly user_name: string;
  readonly furigana?: string;
  readonly gender?: GenderType;
  readonly birthday?: string;
  readonly phone_number: string;
  readonly zip_code?: string;
  readonly address1?: string;
  readonly address2?: string;
  readonly comment?: string;
  readonly selected_products: SelectedProduct[];
  readonly pickup_date?: string;
  readonly total_amount: number;
  readonly line_user_id?: string;
}

export interface ReservationUpdateInput {
  readonly user_name?: string;
  readonly furigana?: string;
  readonly gender?: GenderType;
  readonly birthday?: string;
  readonly phone_number?: string;
  readonly zip_code?: string;
  readonly address1?: string;
  readonly address2?: string;
  readonly comment?: string;
  readonly selected_products?: SelectedProduct[];
  readonly pickup_date?: string;
  readonly total_amount?: number;
  readonly status?: ReservationStatus;
}

// ===== 予約履歴型定義 =====

export interface ReservationHistory {
  readonly id: string;
  readonly preset_id?: number;
  
  // 顧客情報（スナップショット）
  readonly user_name: string;
  readonly furigana?: string;
  readonly gender?: GenderType;
  readonly birthday?: string;
  readonly phone_number: string;
  readonly zip_code?: string;
  readonly address1?: string;
  readonly address2?: string;
  readonly comment?: string;
  
  // 予約情報（スナップショット）
  readonly selected_products: SelectedProduct[];
  readonly pickup_date?: string;
  readonly total_amount: number;
  
  // システム情報
  readonly original_status: ReservationStatus;
  readonly line_user_id?: string;
  
  // 履歴メタデータ
  readonly original_created_at: string;
  readonly original_updated_at: string;
  readonly moved_to_history_at: string;
}

// ===== 管理者認証型定義 =====

export interface AdminUser {
  readonly id: number;
  readonly username: string;
  readonly password_hash: string;
  readonly is_active: boolean;
  readonly last_login_at?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AdminUserCreateInput {
  readonly username: string;
  readonly password_hash: string;
  readonly is_active?: boolean;
}

export interface AdminUserUpdateInput {
  readonly password_hash?: string;
  readonly is_active?: boolean;
  readonly last_login_at?: string;
}

// ===== ピックアップウィンドウ型定義（互換性） =====

export interface PickupWindow {
  readonly id: number;
  readonly preset_id: number;
  readonly start_date: string;
  readonly end_date: string;
  readonly start_time?: string;
  readonly end_time?: string;
  readonly available_slots?: number;
  readonly is_available: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface PickupWindowCreateInput {
  readonly preset_id: number;
  readonly start_date: string;
  readonly end_date: string;
  readonly start_time?: string;
  readonly end_time?: string;
  readonly available_slots?: number;
  readonly is_available?: boolean;
}

export type PickupWindowUpdateInput = Omit<PickupWindowCreateInput, 'preset_id'>;

// ===== 通知ログ型定義 =====

export interface NotificationLog {
  readonly id: string;
  readonly user_id: string;
  readonly type: string;
  readonly message?: Record<string, any>;
  readonly sent_at?: string;
  readonly created_at: string;
}

export interface NotificationLogCreateInput {
  readonly user_id: string;
  readonly type: string;
  readonly message?: Record<string, any>;
  readonly sent_at?: string;
}

// ===== API レスポンス型定義 =====

export interface FormConfigResponse {
  readonly preset: ProductPreset;
  readonly form_settings: FormSettings;
  readonly products: Product[];
  readonly pickup_windows: PickupWindow[];
  readonly preset_products: PresetProduct[];
}

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  readonly total: number;
  readonly page: number;
  readonly per_page: number;
  readonly total_pages: number;
}

// ===== CSV インポート型定義 =====

export interface ProductImportData {
  readonly name: string;
  readonly variation_name?: string;
  readonly price: number;
  readonly product_code?: string;
  readonly tax_type?: TaxType;
  readonly barcode?: string;
  readonly visible?: boolean;
}

export interface ImportResult {
  readonly imported: number;
  readonly errors: ImportError[];
  readonly warnings: ImportWarning[];
}

export interface ImportError {
  readonly row: number;
  readonly field?: string;
  readonly message: string;
  readonly data?: Record<string, any>;
}

export interface ImportWarning {
  readonly row: number;
  readonly field?: string;
  readonly message: string;
  readonly data?: Record<string, any>;
}

// ===== フォームデータ型定義 =====

export interface ReservationFormData {
  readonly user_name: string;
  readonly furigana?: string;
  readonly gender?: GenderType;
  readonly birthday?: string;
  readonly phone_number: string;
  readonly zip_code?: string;
  readonly address1?: string;
  readonly address2?: string;
  readonly comment?: string;
  readonly products: SelectedProduct[];
  readonly pickup_date?: string;
  readonly pickup_dates?: Record<string, string>;
}

// ===== 管理画面用型定義 =====

export interface DashboardStats {
  readonly total_reservations: number;
  readonly pending_reservations: number;
  readonly completed_reservations: number;
  readonly cancelled_reservations: number;
  readonly total_revenue: number;
  readonly active_presets: number;
  readonly total_products: number;
}

export interface ReservationListFilter {
  readonly preset_id?: number;
  readonly status?: ReservationStatus;
  readonly date_from?: string;
  readonly date_to?: string;
  readonly search_query?: string;
  readonly page?: number;
  readonly per_page?: number;
}

// ===== データベーススキーマ型定義（Supabase用） =====

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: ProductCreateInput;
        Update: ProductUpdateInput;
      };
      product_presets: {
        Row: ProductPreset;
        Insert: ProductPresetCreateInput;
        Update: ProductPresetUpdateInput;
      };
      preset_products: {
        Row: PresetProduct;
        Insert: PresetProductCreateInput;
        Update: PresetProductUpdateInput;
      };
      form_settings: {
        Row: FormSettings;
        Insert: FormSettingsCreateInput;
        Update: FormSettingsUpdateInput;
      };
      reservations: {
        Row: Reservation;
        Insert: ReservationCreateInput;
        Update: ReservationUpdateInput;
      };
      reservation_history: {
        Row: ReservationHistory;
        Insert: Omit<ReservationHistory, 'moved_to_history_at'>;
        Update: never;
      };
      admin_users: {
        Row: AdminUser;
        Insert: AdminUserCreateInput;
        Update: AdminUserUpdateInput;
      };
      pickup_windows: {
        Row: PickupWindow;
        Insert: PickupWindowCreateInput;
        Update: PickupWindowUpdateInput;
      };
      notification_logs: {
        Row: NotificationLog;
        Insert: NotificationLogCreateInput;
        Update: never;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      tax_type: TaxType;
      reservation_status: ReservationStatus;
      gender_type: GenderType;
    };
  };
}