/**
 * 商品選択ロジック - 改善指示書に基づく分離実装
 * ビジネスロジックとUI層の分離
 */

import { useState, useCallback, useMemo } from 'react';
import type { Product } from '@/types';
import { isProduct } from '@/lib/utils/typeGuards';

// ProductSelection型の定義（簡素化版）
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

export interface UseProductSelectionOptions {
  maxQuantityPerProduct?: number;
  onSelectionChange?: (selections: ProductSelection[]) => void;
  validateProduct?: (product: Product) => boolean;
}

export interface UseProductSelectionReturn {
  selectedProducts: ProductSelection[];
  totalAmount: number;
  totalQuantity: number;
  addProduct: (product: Product, quantity: number) => boolean;
  removeProduct: (productId: number) => boolean;
  updateQuantity: (productId: number, quantity: number) => boolean;
  clearSelection: () => void;
  isProductSelected: (productId: number) => boolean;
  getProductQuantity: (productId: number) => number;
  getProductSelection: (productId: number) => ProductSelection | null;
}

/**
 * 商品選択を管理するカスタムフック
 */
export const useProductSelection = (
  options: UseProductSelectionOptions = {}
): UseProductSelectionReturn => {
  const {
    maxQuantityPerProduct = 99,
    onSelectionChange,
    validateProduct
  } = options;

  const [selectedProducts, setSelectedProducts] = useState<ProductSelection[]>([]);

  // 合計金額の計算
  const totalAmount = useMemo(() => {
    return selectedProducts.reduce((sum, selection) => {
      return sum + (selection.total_price || 0);
    }, 0);
  }, [selectedProducts]);

  // 総数量の計算
  const totalQuantity = useMemo(() => {
    return selectedProducts.reduce((sum, selection) => {
      return sum + selection.quantity;
    }, 0);
  }, [selectedProducts]);

  // 商品の選択状態をチェック
  const isProductSelected = useCallback((productId: number): boolean => {
    return selectedProducts.some(selection => selection.product_id === productId);
  }, [selectedProducts]);

  // 商品の選択数量を取得
  const getProductQuantity = useCallback((productId: number): number => {
    const selection = selectedProducts.find(s => s.product_id === productId);
    return selection?.quantity || 0;
  }, [selectedProducts]);

  // 商品選択情報を取得
  const getProductSelection = useCallback((productId: number): ProductSelection | null => {
    return selectedProducts.find(s => s.product_id === productId) || null;
  }, [selectedProducts]);

  // 安全な数量の正規化
  const normalizeQuantity = useCallback((quantity: number): number => {
    return Math.max(0, Math.min(maxQuantityPerProduct, Math.floor(quantity)));
  }, [maxQuantityPerProduct]);

  // 商品を追加
  const addProduct = useCallback((product: Product, quantity: number): boolean => {
    try {
      // 商品データの検証
      if (!isProduct(product)) {
        console.error('[useProductSelection] Invalid product data:', product);
        return false;
      }

      // カスタムバリデーション
      if (validateProduct && !validateProduct(product)) {
        console.warn('[useProductSelection] Product validation failed:', product);
        return false;
      }

      const safeQuantity = normalizeQuantity(quantity);
      if (safeQuantity === 0) {
        console.warn('[useProductSelection] Quantity is 0, not adding product');
        return false;
      }

      const newSelection: ProductSelection = {
        product_id: product.id,
        product_name: product.name,
        quantity: safeQuantity,
        unit_price: product.price || 0,
        total_price: (product.price || 0) * safeQuantity,
        category: product.category_id?.toString(),
        variation: product.variation_name,
        comment: undefined
      };

      setSelectedProducts(prev => {
        const existingIndex = prev.findIndex(s => s.product_id === product.id);
        let newSelections: ProductSelection[];

        if (existingIndex >= 0) {
          // 既存商品の数量更新
          newSelections = [...prev];
          newSelections[existingIndex] = newSelection;
        } else {
          // 新商品追加
          newSelections = [...prev, newSelection];
        }

        onSelectionChange?.(newSelections);
        return newSelections;
      });

      console.log(`[useProductSelection] Added/updated product ${product.id} with quantity ${safeQuantity}`);
      return true;

    } catch (error) {
      console.error('[useProductSelection] Error adding product:', error);
      return false;
    }
  }, [normalizeQuantity, validateProduct, onSelectionChange]);

  // 商品を削除
  const removeProduct = useCallback((productId: number): boolean => {
    try {
      setSelectedProducts(prev => {
        const newSelections = prev.filter(s => s.product_id !== productId);
        onSelectionChange?.(newSelections);
        return newSelections;
      });

      console.log(`[useProductSelection] Removed product ${productId}`);
      return true;

    } catch (error) {
      console.error('[useProductSelection] Error removing product:', error);
      return false;
    }
  }, [onSelectionChange]);

  // 数量を更新
  const updateQuantity = useCallback((productId: number, quantity: number): boolean => {
    try {
      const safeQuantity = normalizeQuantity(quantity);

      if (safeQuantity === 0) {
        return removeProduct(productId);
      }

      setSelectedProducts(prev => {
        const existingIndex = prev.findIndex(s => s.product_id === productId);
        
        if (existingIndex < 0) {
          console.warn(`[useProductSelection] Product ${productId} not found for quantity update`);
          return prev;
        }

        const newSelections = [...prev];
        const existingSelection = newSelections[existingIndex];
        
        newSelections[existingIndex] = {
          ...existingSelection,
          quantity: safeQuantity,
          total_price: existingSelection.unit_price * safeQuantity
        };

        onSelectionChange?.(newSelections);
        return newSelections;
      });

      console.log(`[useProductSelection] Updated quantity for product ${productId}: ${safeQuantity}`);
      return true;

    } catch (error) {
      console.error('[useProductSelection] Error updating quantity:', error);
      return false;
    }
  }, [normalizeQuantity, removeProduct, onSelectionChange]);

  // 選択をクリア
  const clearSelection = useCallback(() => {
    setSelectedProducts([]);
    onSelectionChange?.([]);
    console.log('[useProductSelection] Cleared all selections');
  }, [onSelectionChange]);

  return {
    selectedProducts,
    totalAmount,
    totalQuantity,
    addProduct,
    removeProduct,
    updateQuantity,
    clearSelection,
    isProductSelected,
    getProductQuantity,
    getProductSelection
  };
};