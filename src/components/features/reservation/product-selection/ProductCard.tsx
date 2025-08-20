/**
 * 個別商品表示カードコンポーネント
 */
import React from 'react';
import { QuantityControls } from './QuantityControls';
import { safeProductName, safePrice, safeVariationName } from '@/lib/utils/safeRendering';
import { getProductDisplayName, getProductPriceDisplay } from '@/lib/utils/dataTransformers';
import { ProductErrorBoundary } from '@/components/common/ProductErrorBoundary';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onQuantityChange: (productId: number, newQuantity: number) => void;
  disabled?: boolean;
  showVariation?: boolean;
  showSubtotal?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity,
  onQuantityChange,
  disabled = false,
  showVariation = true,
  showSubtotal = true
}) => {
  const handleQuantityChange = (newQuantity: number) => {
    onQuantityChange(product.id, newQuantity);
  };

  return (
    <ProductErrorBoundary>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-4">
          <h3 className="font-medium text-gray-900 mb-1">
            {getProductDisplayName(product)}
          </h3>
          {product.product_code && (
            <p className="text-xs text-gray-500 mb-2">
              商品コード: {product.product_code}
            </p>
          )}
          <p className="text-lg font-semibold text-blue-600">
            {getProductPriceDisplay(product)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <QuantityControls
              value={quantity}
              onChange={handleQuantityChange}
              disabled={disabled}
              size="sm"
            />
          </div>
          
          {showSubtotal && quantity > 0 && (
            <div className="text-right ml-4">
              <div className="text-sm font-medium text-gray-900">
                小計
              </div>
              <div className="text-sm text-blue-600 font-semibold">
                {safePrice(product.price * quantity)}
              </div>
            </div>
          )}
        </div>
        
        {product.barcode && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              バーコード: {product.barcode}
            </p>
          </div>
        )}
      </div>
    </ProductErrorBoundary>
  );
};