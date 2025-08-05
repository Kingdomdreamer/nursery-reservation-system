/**
 * 型ガード関数 - 改善指示書に基づく強化実装
 * 実行時型チェックによる型安全性の強化
 */

import type { 
  Product, 
  PresetProduct,
  FormConfigResponse,
  ProductPreset,
  PickupWindow, 
  FormSettings, 
  Reservation, 
  NotificationType,
  ProductSelection 
} from '@/types';

// Product型の型ガード関数（既存互換性を保持）
export const isProduct = (value: unknown): value is Product => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Product).id === 'number' &&
    typeof (value as Product).name === 'string' &&
    typeof (value as Product).price === 'number'
  );
};

export const isProductArray = (value: unknown): value is Product[] => {
  return Array.isArray(value) && value.every(isProduct);
};

/**
 * PresetProduct型の型ガード関数
 */
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

export const isPresetProductArray = (value: unknown): value is PresetProduct[] => {
  return Array.isArray(value) && value.every(isPresetProduct);
};

/**
 * ProductPreset型の型ガード関数
 */
export const isProductPreset = (value: unknown): value is ProductPreset => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ProductPreset).id === 'number' &&
    typeof (value as ProductPreset).preset_name === 'string'
  );
};


// PickupWindow type guards
export const isPickupWindow = (value: unknown): value is PickupWindow => {
  return (
    typeof value === 'object' &&
    value !== null &&
    (typeof (value as PickupWindow).id === 'string' || typeof (value as PickupWindow).id === 'number') &&
    typeof (value as PickupWindow).pickup_start === 'string' &&
    typeof (value as PickupWindow).pickup_end === 'string' &&
    typeof (value as PickupWindow).preset_id === 'number'
  );
};

export const isPickupWindowArray = (value: unknown): value is PickupWindow[] => {
  return Array.isArray(value) && value.every(isPickupWindow);
};

// 強化されたFormSettings型ガード
export const isFormSettings = (value: unknown): value is FormSettings => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FormSettings).id === 'number' &&
    typeof (value as FormSettings).preset_id === 'number' &&
    typeof (value as FormSettings).show_price === 'boolean' &&
    typeof (value as FormSettings).require_phone === 'boolean' &&
    typeof (value as FormSettings).require_furigana === 'boolean' &&
    typeof (value as FormSettings).allow_note === 'boolean' &&
    typeof (value as FormSettings).is_enabled === 'boolean'
  );
};


// ProductSelection type guards
export const isProductSelection = (value: unknown): value is ProductSelection => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ProductSelection).product_id === 'number' &&
    typeof (value as ProductSelection).product_name === 'string' &&
    typeof (value as ProductSelection).quantity === 'number' &&
    typeof (value as ProductSelection).unit_price === 'number' &&
    typeof (value as ProductSelection).total_price === 'number'
  );
};

export const isProductSelectionArray = (value: unknown): value is ProductSelection[] => {
  return Array.isArray(value) && value.every(isProductSelection);
};

// Reservation type guards
export const isReservation = (value: unknown): value is Reservation => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Reservation).id === 'string' &&
    typeof (value as Reservation).user_name === 'string' &&
    typeof (value as Reservation).phone_number === 'string' &&
    Array.isArray((value as Reservation).product)
  );
};

// NotificationType type guard
export const isNotificationType = (value: unknown): value is NotificationType => {
  return (
    typeof value === 'string' &&
    ['confirmation', 'reminder', 'cancellation', 'error', 'message_sent'].includes(value)
  );
};

// String validation helpers
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const isValidEmail = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

export const isValidPhoneNumber = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false;
  // Japanese phone number pattern
  const phoneRegex = /^0\d{1,4}-\d{1,4}-\d{4}$|^0\d{9,10}$/;
  return phoneRegex.test(value);
};

export const isValidZipCode = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false;
  // Japanese zip code pattern
  const zipRegex = /^\d{3}-\d{4}$/;
  return zipRegex.test(value);
};

// Date validation helpers
export const isValidDate = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false;
  const date = new Date(value);
  return date instanceof Date && !isNaN(date.getTime());
};

export const isValidDateRange = (startDate: unknown, endDate: unknown): boolean => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) return false;
  return new Date(startDate) <= new Date(endDate);
};

// Number validation helpers
export const isPositiveNumber = (value: unknown): value is number => {
  return typeof value === 'number' && value > 0 && !isNaN(value);
};

export const isNonNegativeNumber = (value: unknown): value is number => {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
};

export const isValidQuantity = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 99;
};

// Object validation helpers
export const hasRequiredKeys = <T extends Record<string, unknown>>(
  obj: unknown,
  keys: (keyof T)[]
): obj is T => {
  if (typeof obj !== 'object' || obj === null) return false;
  return keys.every(key => key in obj);
};

// Safe JSON parsing with type guard
export const safeParse = <T>(
  json: string,
  typeGuard: (value: unknown) => value is T
): T | null => {
  try {
    const parsed = JSON.parse(json);
    return typeGuard(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * カスタムエラークラス（改善指示書提案）
 */
export class InvalidProductDataError extends Error {
  constructor(data: unknown) {
    super(`Invalid product data: ${JSON.stringify(data)}`);
    this.name = 'InvalidProductDataError';
  }
}

export class InvalidPresetProductDataError extends Error {
  constructor(data: unknown) {
    super(`Invalid preset product data: ${JSON.stringify(data)}`);
    this.name = 'InvalidPresetProductDataError';
  }
}

export class InvalidFormConfigResponseError extends Error {
  constructor(data: unknown) {
    super(`Invalid form config response: ${JSON.stringify(data)}`);
    this.name = 'InvalidFormConfigResponseError';
  }
}

export class PresetNotFoundError extends Error {
  constructor(presetId: number) {
    super(`Preset not found: ${presetId}`);
    this.name = 'PresetNotFoundError';
  }
}

export class InvalidPresetIdError extends Error {
  constructor(presetId: unknown) {
    super(`Invalid preset ID: ${presetId}`);
    this.name = 'InvalidPresetIdError';
  }
}

/**
 * 安全なデータ変換関数（改善指示書提案）
 */
export const parseProduct = (data: unknown): Product => {
  if (!isProduct(data)) {
    throw new InvalidProductDataError(data);
  }
  return data;
};

export const parsePresetProduct = (data: unknown): PresetProduct => {
  if (!isPresetProduct(data)) {
    throw new InvalidPresetProductDataError(data);
  }
  return data;
};

export const parseFormConfigResponse = (data: unknown): FormConfigResponse => {
  // 簡易的な型チェック（完全な型ガードは削除済み）
  if (typeof data !== 'object' || data === null) {
    throw new InvalidFormConfigResponseError(data);
  }
  return data as FormConfigResponse;
};

export const parseProductArray = (data: unknown): Product[] => {
  if (!isProductArray(data)) {
    throw new InvalidProductDataError(data);
  }
  return data;
};

export const parsePresetProductArray = (data: unknown): PresetProduct[] => {
  if (!isPresetProductArray(data)) {
    throw new InvalidPresetProductDataError(data);
  }
  return data;
};

// Environment variable validation
export const getValidatedEnvVar = (key: string, validator?: (value: string) => boolean): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  if (validator && !validator(value)) {
    throw new Error(`Invalid environment variable value: ${key}`);
  }
  return value;
};