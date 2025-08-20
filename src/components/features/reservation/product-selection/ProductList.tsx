/**
 * 商品リスト表示コンポーネント
 */
import React from 'react';
import { ProductCard } from './ProductCard';
import { ProductErrorBoundary } from '@/components/common/ProductErrorBoundary';
import { LoadingSpinner } from '@/components/ui';
import type { Product } from '@/types';

interface ProductListProps {
  products: Product[];
  quantities: Record<number, number>;
  onQuantityChange: (productId: number, newQuantity: number) => void;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  disabled?: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  quantities,
  onQuantityChange,
  loading = false,
  error = null,
  emptyMessage = '商品が見つかりませんでした',
  disabled = false
}) => {
  // ローディング状態
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">商品を読み込んでいます...</span>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 font-medium mb-2">
          商品の読み込みに失敗しました
        </div>
        <div className="text-red-500 text-sm">
          {error}
        </div>
      </div>
    );
  }

  // 空状態
  if (products.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-500 font-medium mb-2">
          {emptyMessage}
        </div>
        <div className="text-gray-400 text-sm">
          検索条件を変更してもう一度お試しください
        </div>
      </div>
    );
  }

  return (
    <ProductErrorBoundary>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={quantities[product.id] || 0}
            onQuantityChange={onQuantityChange}
            disabled={disabled}
          />
        ))}
      </div>
      
      {/* 選択中の商品があれば合計を表示 */}
      <ProductSummary products={products} quantities={quantities} />
    </ProductErrorBoundary>
  );
};

/**
 * 商品選択サマリーコンポーネント
 */
interface ProductSummaryProps {
  products: Product[];
  quantities: Record<number, number>;
}

const ProductSummary: React.FC<ProductSummaryProps> = ({ products, quantities }) => {
  const selectedProducts = products.filter(product => quantities[product.id] > 0);
  
  if (selectedProducts.length === 0) {
    return null;
  }

  const totalAmount = selectedProducts.reduce((sum, product) => {
    return sum + (product.price * quantities[product.id]);
  }, 0);

  const totalItems = selectedProducts.reduce((sum, product) => {
    return sum + quantities[product.id];
  }, 0);

  return (
    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm text-blue-700">
            選択中の商品: {selectedProducts.length}種類 {totalItems}個
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {selectedProducts.map(product => 
              `${product.name} × ${quantities[product.id]}`
            ).join(', ')}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-blue-900">
            合計: ¥{totalAmount.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};