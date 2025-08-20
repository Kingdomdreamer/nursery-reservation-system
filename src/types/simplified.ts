// =====================================
// 簡素化された型定義
// 仕様設計問題分析_改善指示書.md に基づく統一型定義
// =====================================

// 基本商品型（データベーススキーマに合わせて修正）
export interface Product {
  readonly id: number;
  readonly product_code?: string;
  readonly name: string;
  readonly variation_id: number;
  readonly variation_name: string;
  readonly tax_type: '内税' | '外税';
  readonly price: number;
  readonly barcode?: string;
  readonly visible: boolean;
  readonly display_order: number;
  readonly created_at: string;
  readonly updated_at: string;
}

// プリセット商品型
export interface PresetProduct {
  readonly id: number;
  readonly preset_id: number;
  readonly product_id: number;
  readonly display_order: number;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
  readonly product: Product; // 常にJOINされる
}

// 引き取り日程型
export interface PickupSchedule {
  readonly id: number;
  readonly preset_id: number;
  readonly pickup_date: string;
  readonly start_time: string;
  readonly end_time: string;
  readonly is_available: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

// フォーム設定レスポンス型
export interface FormConfigResponse {
  readonly preset: ProductPreset;
  readonly form_settings: FormSettings;
  readonly preset_products: PresetProduct[];
  readonly pickup_schedules: PickupSchedule[];
}

// プロダクトプリセット型（データベーススキーマに合わせて修正）
export interface ProductPreset {
  readonly id: number;
  readonly preset_name: string;
  readonly description?: string;
  readonly form_expiry_date?: string;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

// 表示用のプリセット型（従来のnameフィールドとの互換性維持）
export interface ProductPresetDisplay extends ProductPreset {
  readonly name: string; // preset_name のエイリアス
}

// フォーム設定型（既存から引用、簡素化）
export interface FormSettings {
  readonly id: number;
  readonly preset_id: number;
  readonly show_price: boolean;
  readonly require_phone: boolean;
  readonly require_furigana: boolean;
  readonly allow_note: boolean;
  readonly is_enabled: boolean;
  readonly custom_message?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

// 型ガード関数
export const isProduct = (value: unknown): value is Product => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Product).id === 'number' &&
    typeof (value as Product).name === 'string' &&
    typeof (value as Product).variation_id === 'number' &&
    typeof (value as Product).variation_name === 'string' &&
    ['内税', '外税'].includes((value as Product).tax_type) &&
    typeof (value as Product).price === 'number' &&
    typeof (value as Product).visible === 'boolean' &&
    typeof (value as Product).display_order === 'number' &&
    typeof (value as Product).created_at === 'string' &&
    typeof (value as Product).updated_at === 'string'
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
    typeof (value as PresetProduct).is_active === 'boolean' &&
    isProduct((value as PresetProduct).product)
  );
};

export const isPickupSchedule = (value: unknown): value is PickupSchedule => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as PickupSchedule).id === 'number' &&
    typeof (value as PickupSchedule).preset_id === 'number' &&
    typeof (value as PickupSchedule).pickup_date === 'string' &&
    typeof (value as PickupSchedule).start_time === 'string' &&
    typeof (value as PickupSchedule).end_time === 'string' &&
    typeof (value as PickupSchedule).is_available === 'boolean'
  );
};

export const isFormConfigResponse = (value: unknown): value is FormConfigResponse => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FormConfigResponse).preset === 'object' &&
    typeof (value as FormConfigResponse).form_settings === 'object' &&
    Array.isArray((value as FormConfigResponse).preset_products) &&
    Array.isArray((value as FormConfigResponse).pickup_schedules) &&
    (value as FormConfigResponse).preset_products.every(isPresetProduct) &&
    (value as FormConfigResponse).pickup_schedules.every(isPickupSchedule)
  );
};

// カスタムエラークラス
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

// 安全なデータ変換関数
export const parseProduct = (data: unknown): Product => {
  if (!isProduct(data)) {
    throw new InvalidProductDataError(data);
  }
  return data;
};

export const parsePresetProduct = (data: unknown): PresetProduct => {
  if (!isPresetProduct(data)) {
    throw new InvalidProductDataError(data);
  }
  return data;
};

export const parsePickupSchedule = (data: unknown): PickupSchedule => {
  if (!isPickupSchedule(data)) {
    throw new InvalidProductDataError(data);
  }
  return data;
};

export const parseFormConfigResponse = (data: unknown): FormConfigResponse => {
  if (!isFormConfigResponse(data)) {
    throw new InvalidApiResponseError(data);
  }
  return data;
};