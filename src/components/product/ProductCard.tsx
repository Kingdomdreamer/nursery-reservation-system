/**
 * 商品カードコンポーネント - 改善指示書に基づく分離実装
 * 個別商品の表示と数量選択UI
 */

import React from 'react';
import type { Product, FormSettings } from '@/types';
import { Button } from '@/components/ui/button';

export interface ProductCardProps {
  product: Product;
  formSettings: FormSettings;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  formSettings,
  quantity,
  onQuantityChange,
  className = ''
}) => {
  const handleDecrease = () => {
    if (quantity > 0) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < 99) {
      onQuantityChange(quantity + 1);
    }
  };

  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString()}`;
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        quantity > 0 
          ? 'bg-green-50 border-green-200' 
          : 'bg-white border-gray-200 hover:border-green-300'
      } ${className}`}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">
            {product.name}
          </h4>
          {formSettings?.show_price && (
            <p className="text-sm text-gray-600">
              {formatPrice(product.price || 0)}
            </p>
          )}
          {product.variation_name && (
            <p className="text-xs text-gray-500 mt-1">
              {product.variation_name}
            </p>
          )}
        </div>
        
        {/* 数量コントロール */}
        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDecrease}
            disabled={quantity === 0}
            className="h-8 w-8 rounded-full"
            aria-label="数量を減らす"
          >
            −
          </Button>
          
          <span className="w-8 text-center font-medium text-sm">
            {quantity}
          </span>
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleIncrease}
            disabled={quantity >= 99}
            className="h-8 w-8 rounded-full"
            aria-label="数量を増やす"
          >
            +
          </Button>
        </div>
      </div>
      
      {/* 小計表示 */}
      {quantity > 0 && formSettings?.show_price && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-sm text-gray-700">
            小計: {formatPrice((product.price || 0) * quantity)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductCard;