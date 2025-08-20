/**
 * データ変換ユーティリティ関数
 * データベース型とフロントエンド表示型の変換処理
 */

import type { ProductPreset, ProductPresetDisplay, Product } from '@/types/database';

/**
 * ProductPresetをProductPresetDisplayに変換
 * preset_name を name フィールドとしてエイリアス
 */
export const toProductPresetDisplay = (preset: ProductPreset): ProductPresetDisplay => {
  return {
    ...preset,
    name: preset.preset_name
  };
};

/**
 * 複数のProductPresetをProductPresetDisplayに変換
 */
export const toProductPresetDisplays = (presets: ProductPreset[]): ProductPresetDisplay[] => {
  return presets.map(toProductPresetDisplay);
};

/**
 * 商品の表示名を取得（バリエーション情報を含む）
 */
export const getProductDisplayName = (product: Product): string => {
  if (product.variation_name && product.variation_name !== '通常価格') {
    return `${product.name}（${product.variation_name}）`;
  }
  return product.name;
};

/**
 * 価格の表示形式（税込・税抜表示付き）
 */
export const getProductPriceDisplay = (product: Product): string => {
  const formattedPrice = `¥${product.price.toLocaleString()}`;
  return `${formattedPrice}（${product.tax_type}）`;
};

/**
 * 商品コードの安全な取得
 */
export const getProductCode = (product: Product): string => {
  return product.product_code || `AUTO-${product.id}`;
};

/**
 * 商品の並び順用キーを生成
 */
export const getProductSortKey = (product: Product): string => {
  const order = product.display_order || 999999;
  return `${order.toString().padStart(6, '0')}-${product.name}-${product.id}`;
};

/**
 * フィールド存在チェック（後方互換性維持）
 */
export const hasLegacyField = (obj: unknown, fieldName: string): boolean => {
  return typeof obj === 'object' && obj !== null && fieldName in obj;
};

/**
 * レガシーオブジェクトから安全に値を取得
 */
export const getLegacyValue = (obj: unknown, fieldName: string, defaultValue: unknown = undefined): unknown => {
  if (hasLegacyField(obj, fieldName)) {
    return (obj as Record<string, unknown>)[fieldName];
  }
  return defaultValue;
};