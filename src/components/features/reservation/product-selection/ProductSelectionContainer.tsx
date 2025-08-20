/**
 * 商品選択メインコンテナコンポーネント
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { ProductSearch } from './ProductSearch';
import { ProductList } from './ProductList';
import { ProductErrorBoundary } from '@/components/common/ProductErrorBoundary';
import { ErrorMessage } from '@/components/ui';
import { getProductDisplayName, getProductSortKey } from '@/lib/utils/dataTransformers';
import type { Product, PickupWindow, FormSettings } from '@/types';
import type { ReservationFormData, ProductSelectionData } from '@/lib/validations/reservationSchema';

interface ProductSelectionContainerProps {
  products: Product[];
  pickupWindows: PickupWindow[];
  formSettings: FormSettings;
  loading?: boolean;
  error?: string | null;
}

export const ProductSelectionContainer: React.FC<ProductSelectionContainerProps> = ({
  products,
  pickupWindows,
  formSettings,
  loading = false,
  error = null
}) => {
  const { watch, setValue, formState: { errors } } = useFormContext<ReservationFormData>();
  const selectedProducts = watch('products') || [];

  // 検索・フィルター状態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // 数量管理状態
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  // selectedProductsから数量を初期化
  useEffect(() => {
    const initialQuantities: Record<number, number> = {};
    selectedProducts.forEach(item => {
      if (typeof item.product_id === 'number' && typeof item.quantity === 'number') {
        initialQuantities[item.product_id] = item.quantity;
      }
    });
    setQuantities(initialQuantities);
  }, [selectedProducts]);

  // 数量変更ハンドラー
  const handleQuantityChange = useCallback((productId: number, newQuantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: newQuantity
    }));

    // 商品情報を取得
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // フォームデータを更新
    const updatedQuantities = {
      ...quantities,
      [productId]: newQuantity
    };

    const updatedSelections = Object.entries(updatedQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productIdStr, quantity]) => {
        const id = parseInt(productIdStr, 10);
        const prod = products.find(p => p.id === id);
        if (!prod) {
          throw new Error(`Product not found: ${id}`);
        }
        
        return {
          product_id: id,
          product_name: prod.name,
          variation_name: prod.variation_name || '通常価格',
          quantity,
          unit_price: prod.price || 0,
          total_price: (prod.price || 0) * quantity,
          tax_type: (prod.tax_type || '内税') as '内税' | '外税',
          category: prod.variation_type || 'その他',
          variation: prod.variation_name,
        };
      });

    setValue('products', updatedSelections, { shouldValidate: true });
  }, [quantities, setValue, products]);

  // カテゴリデータ生成（variation_nameベース）
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    products.forEach(product => {
      const category = product.variation_name || '通常価格';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ id: name, name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // フィルタリングされた商品
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // 検索フィルター
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        getProductDisplayName(product).toLowerCase().includes(term) ||
        product.product_code?.toLowerCase().includes(term) ||
        product.barcode?.toLowerCase().includes(term)
      );
    }

    // カテゴリフィルター（variation_nameベース）
    if (selectedCategory) {
      filtered = filtered.filter(product => 
        product.variation_name === selectedCategory
      );
    }

    // 表示順でソート
    filtered.sort((a, b) => getProductSortKey(a).localeCompare(getProductSortKey(b)));

    return filtered;
  }, [products, searchTerm, selectedCategory]);

  // フィルタークリア
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('');
  }, []);

  if (error) {
    return (
      <ProductErrorBoundary>
        <ErrorMessage 
          title="商品データの読み込みに失敗しました"
          error={error}
        />
      </ProductErrorBoundary>
    );
  }

  return (
    <ProductErrorBoundary>
      <div className="space-y-6">
        {/* 商品検索・フィルター */}
        <ProductSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          onClearFilters={handleClearFilters}
          disabled={loading}
        />

        {/* 商品一覧 */}
        <ProductList
          products={filteredProducts}
          quantities={quantities}
          onQuantityChange={handleQuantityChange}
          loading={loading}
          emptyMessage={
            searchTerm || selectedCategory
              ? '検索条件に一致する商品が見つかりませんでした'
              : '商品が登録されていません'
          }
        />

        {/* フォームエラー表示 */}
        {errors.products && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">
              {errors.products.message}
            </p>
          </div>
        )}

        {/* デバッグ情報（開発環境のみ） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-4 rounded-lg text-sm">
            <details>
              <summary className="cursor-pointer font-medium">デバッグ情報</summary>
              <div className="mt-2 space-y-1">
                <div>全商品数: {products.length}</div>
                <div>表示商品数: {filteredProducts.length}</div>
                <div>選択中: {Object.values(quantities).filter(q => q > 0).length}種類</div>
                <div>合計数量: {Object.values(quantities).reduce((sum, q) => sum + q, 0)}</div>
                <div>検索キーワード: "{searchTerm}"</div>
                <div>カテゴリフィルター: "{selectedCategory}"</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </ProductErrorBoundary>
  );
};