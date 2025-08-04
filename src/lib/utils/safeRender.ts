/**
 * 安全なレンダリング関数 - React Error #418 対策
 * JSXに渡される値を安全な文字列に変換する
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

/**
 * 商品名の安全な表示
 */
export const safeProductName = (product: unknown): string => {
  if (!product || typeof product !== 'object') return '商品名不明';
  
  const productObj = product as Record<string, unknown>;
  
  if (typeof productObj.name === 'string') return productObj.name;
  if (typeof productObj.product_name === 'string') return productObj.product_name;
  
  return '商品名不明';
};

/**
 * 価格の安全な表示
 */
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
  return '価格不明';
};

/**
 * 数値価格を安全に取得（計算用）
 */
export const safePriceNumber = (product: unknown): number => {
  if (!product || typeof product !== 'object') {
    return 0;
  }
  
  const productObj = product as Record<string, unknown>;
  
  if (typeof productObj.price === 'number' && !isNaN(productObj.price) && productObj.price >= 0) {
    return productObj.price;
  }
  
  if (typeof productObj.unit_price === 'number' && !isNaN(productObj.unit_price)) {
    return Math.max(0, productObj.unit_price);
  }
  
  return 0;
};

/**
 * 数量の安全な表示
 */
export const safeQuantity = (quantity: unknown): string => {
  if (typeof quantity === 'number' && !isNaN(quantity)) {
    return String(quantity);
  }
  if (typeof quantity === 'string') {
    const numQuantity = parseInt(quantity, 10);
    if (!isNaN(numQuantity)) {
      return String(numQuantity);
    }
  }
  return '0';
};

/**
 * 数量を数値として安全に取得（計算用）
 */
export const safeQuantityNumber = (value: unknown): number => {
  if (typeof value === 'number' && !isNaN(value) && value >= 0) {
    return Math.floor(Math.min(99, value)); // Cap at 99 as per business rules
  }
  
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      return Math.floor(Math.min(99, parsed));
    }
  }
  
  return 0;
};

/**
 * 商品オブジェクトの妥当性を検証
 */
export const isValidProduct = (product: unknown): product is { 
  id: number; 
  name: string; 
  price: number; 
  category_id?: number;
  [key: string]: unknown;
} => {
  if (!product || typeof product !== 'object') {
    return false;
  }
  
  const productObj = product as Record<string, unknown>;
  
  const hasValidId = typeof productObj.id === 'number' && productObj.id > 0;
  const hasValidName = typeof productObj.name === 'string' && productObj.name.trim().length > 0;
  const hasValidPrice = typeof productObj.price === 'number' && !isNaN(productObj.price) && productObj.price >= 0;
  
  return hasValidId && hasValidName && hasValidPrice;
};