import { randomBytes } from 'crypto';

/**
 * UUIDを生成する
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * キャンセルトークンを生成する
 */
export function generateCancelToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * 電話番号の正規化
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9+]/g, '');
}

/**
 * 金額のフォーマット
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount);
}

/**
 * 日付のフォーマット
 */
export function formatDate(dateString: string, format: 'short' | 'long' = 'short'): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = format === 'long'
    ? {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    : {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      };
  
  return new Intl.DateTimeFormat('ja-JP', options).format(date);
}

/**
 * 安全なJSONパース
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 文字列の省略
 */
export function truncateString(str: string, maxLength: number): string {
  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
}

/**
 * スリープ関数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}