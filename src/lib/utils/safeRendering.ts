/**
 * 安全なレンダリングユーティリティ関数
 * React Error #418 完全回避のための共通関数群
 */

export const safeRender = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
};

export const safeProductName = (product: unknown): string => {
  if (!product || typeof product !== 'object') return '商品名不明';
  const productObj = product as Record<string, unknown>;
  if (typeof productObj.name === 'string') return productObj.name;
  if (typeof productObj.product_name === 'string') return productObj.product_name;
  return '商品名不明';
};

export const safePrice = (price: unknown): string => {
  if (typeof price === 'number' && !isNaN(price)) {
    return `¥${price.toLocaleString()}`;
  }
  if (typeof price === 'string') {
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice)) {
      return `¥${numPrice.toLocaleString()}`;
    }
  }
  return '¥0';
};

export const safeQuantity = (quantity: unknown): number => {
  if (typeof quantity === 'number' && !isNaN(quantity)) {
    return Math.max(0, Math.floor(quantity));
  }
  if (typeof quantity === 'string') {
    const numQuantity = parseInt(quantity, 10);
    if (!isNaN(numQuantity)) {
      return Math.max(0, Math.floor(numQuantity));
    }
  }
  return 0;
};

export const safeId = (id: unknown): number => {
  if (typeof id === 'number' && !isNaN(id)) {
    return Math.floor(id);
  }
  if (typeof id === 'string') {
    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      return Math.floor(numId);
    }
  }
  return 0;
};

export const safeVariationName = (product: unknown): string => {
  if (!product || typeof product !== 'object') return '';
  const productObj = product as Record<string, unknown>;
  if (typeof productObj.variation_name === 'string') return productObj.variation_name;
  return '';
};

export const safeBarcode = (product: unknown): string => {
  if (!product || typeof product !== 'object') return '';
  const productObj = product as Record<string, unknown>;
  if (typeof productObj.barcode === 'string') return productObj.barcode;
  return '';
};