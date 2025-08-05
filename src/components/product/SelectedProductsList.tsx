/**
 * 選択済み商品リストコンポーネント - 改善指示書に基づく分離実装
 * 選択された商品のサマリー表示
 */

import React from 'react';
import type { ProductSelection, FormSettings } from '@/types';
import { Button } from '@/components/ui/button';

export interface SelectedProductsListProps {
  products: ProductSelection[];
  formSettings: FormSettings;
  onRemove: (productId: number) => void;
  className?: string;
}

export const SelectedProductsList: React.FC<SelectedProductsListProps> = ({
  products,
  formSettings,
  onRemove,
  className = ''
}) => {
  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString()}`;
  };

  const totalAmount = products.reduce((sum, product) => {
    return sum + (product.total_price || 0);
  }, 0);

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <h3 className="font-medium text-gray-900 mb-3 flex items-center">
        <svg
          className="w-5 h-5 text-green-600 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        選択した商品
      </h3>
      
      <div className="space-y-2">
        {products.map((product) => (
          <div 
            key={product.product_id} 
            className="flex justify-between items-center text-sm bg-white rounded p-2"
          >
            <div className="flex-1">
              <span className="font-medium">
                {product.product_name}
              </span>
              <span className="text-gray-600 ml-2">
                × {product.quantity}
              </span>
              {product.variation && (
                <span className="text-xs text-gray-500 ml-2">
                  ({product.variation})
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {formSettings?.show_price && (
                <span className="font-medium text-green-700">
                  {formatPrice(product.total_price || 0)}
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemove(product.product_id)}
                className="text-xs h-6 px-2 text-red-600 border-red-300 hover:bg-red-50"
                aria-label={`${product.product_name}を削除`}
              >
                削除
              </Button>
            </div>
          </div>
        ))}
        
        {/* 合計金額 */}
        {formSettings?.show_price && (
          <div className="pt-2 border-t border-green-300 flex justify-between items-center font-medium bg-white rounded p-2">
            <span>合計金額</span>
            <span className="text-lg text-green-700">
              {formatPrice(totalAmount)}
            </span>
          </div>
        )}
        
        {/* 商品数サマリー */}
        <div className="text-xs text-green-700 mt-2">
          {products.length}種類の商品、合計{products.reduce((sum, p) => sum + p.quantity, 0)}個を選択中
        </div>
      </div>
    </div>
  );
};

export default SelectedProductsList;