import type { 
  Product, 
  PickupWindow, 
  FormSettings, 
  Reservation, 
  NotificationType,
  ProductSelection 
} from '@/types';

// Product type guards
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

// FormSettings type guards
export const isFormSettings = (value: unknown): value is FormSettings => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FormSettings).require_phone === 'boolean' &&
    typeof (value as FormSettings).require_furigana === 'boolean' &&
    typeof (value as FormSettings).allow_note === 'boolean'
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
    ['confirmation', 'reminder', 'cancellation'].includes(value)
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