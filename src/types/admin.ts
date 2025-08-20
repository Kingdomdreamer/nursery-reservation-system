/**
 * 管理画面専用の型定義
 */

export interface SimplePreset {
  id: number;
  preset_name: string;
  created_at: string;
}

export interface EnhancedProduct {
  id: number;
  name: string;
  display_name: string;
  price: number;
  product_code?: string;
  base_product_name?: string;
  variation_name?: string;
  category_id: number;
  visible: boolean;
  
  // 表示・検索用の追加フィールド
  search_text: string;
  price_display: string;
  status_badges: string[];
  status_label: string;
  product_code_display: string;
}

export interface FormCreationData {
  preset_name: string;
  selected_products: number[];
  form_settings: {
    show_price: boolean;
    require_phone: boolean;
    require_furigana: boolean;
    allow_note: boolean;
  };
}

export interface PresetProductDetail {
  id: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    price: number;
    category_id?: number;
    visible: boolean;
  };
}