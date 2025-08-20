/**
 * 商品カードコンポーネント - 統合コンポーネントのラッパー
 * 後方互換性のため既存インターフェースを維持
 */

import React from 'react';
import type { Product, FormSettings } from '@/types';
import { ProductComponent } from '@/components/business/Product/ProductComponent';

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
  const handleQuantityChange = (prod: Product, newQuantity: number) => {
    onQuantityChange(newQuantity);
  };

  return (
    <ProductComponent
      product={product}
      variant="card"
      showPrice={formSettings?.show_price}
      quantity={quantity}
      onQuantityChange={handleQuantityChange}
      className={className}
      isSelected={quantity > 0}
    />
  );
};

export default ProductCard;