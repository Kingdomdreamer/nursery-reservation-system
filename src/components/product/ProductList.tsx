/**
 * 商品リストコンポーネント - 改善指示書に基づく分離実装
 * 表示のみを担当する純粋なUIコンポーネント
 */

import React from 'react';
import type { Product, FormSettings } from '@/types';
import { ProductCard } from './ProductCard';
import { getCategoryName } from '@/lib/utils';

export interface ProductListProps {
  products: Product[];
  formSettings: FormSettings;
  onProductSelect: (product: Product, quantity: number) => void;
  getProductQuantity: (productId: number) => number;
  className?: string;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  formSettings,
  onProductSelect,
  getProductQuantity,
  className = ''
}) => {
  // カテゴリ別に商品をグループ化
  const groupedProducts = React.useMemo(() => {
    return products.reduce((groups, product) => {
      const categoryId = product.category_id || 0;
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(product);
      return groups;
    }, {} as Record<number, Product[]>);
  }, [products]);

  if (products.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>表示できる商品がありません</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <p className="text-sm text-gray-600">
        ご希望の商品とそれぞれの数量を選択してください
      </p>
      
      {Object.entries(groupedProducts).map(([categoryIdStr, categoryProducts]) => {
        const categoryId = parseInt(categoryIdStr, 10);
        
        return (
          <div key={categoryId} className="space-y-3">
            <h3 className="text-md font-medium text-gray-800 border-l-4 border-green-500 pl-3">
              {getCategoryName(categoryId)}
            </h3>
            
            <div className="grid gap-3">
              {categoryProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  formSettings={formSettings}
                  quantity={getProductQuantity(product.id)}
                  onQuantityChange={(quantity) => onProductSelect(product, quantity)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductList;