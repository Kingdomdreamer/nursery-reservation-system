'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import type { Product, PickupWindow, FormSettings } from '@/types';
import type { ReservationFormData, ProductSelectionData } from '@/lib/validations/reservationSchema';
import { getCategoryName } from '@/lib/utils';

interface ProductSelectionProps {
  products: Product[];
  pickupWindows: PickupWindow[];
  formSettings: FormSettings;
}

export const ProductSelection: React.FC<ProductSelectionProps> = ({
  products,
  pickupWindows,
  formSettings,
}) => {
  const { setValue, watch, formState: { errors } } = useFormContext<ReservationFormData>();
  
  const [selectedProducts, setSelectedProducts] = useState<ProductSelectionData[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  // Watch for changes in selected products
  const watchedProducts = watch('products') || [];

  useEffect(() => {
    setSelectedProducts(watchedProducts);
    const total = watchedProducts.reduce((sum, product) => sum + product.total_price, 0);
    setTotalAmount(total);
  }, [watchedProducts]);

  const handleQuantityChange = (productId: number, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = selectedProducts.findIndex(p => p.product_id === productId);
    const newSelectedProducts = [...selectedProducts];

    if (quantity === 0) {
      // Remove product if quantity is 0
      if (existingIndex >= 0) {
        newSelectedProducts.splice(existingIndex, 1);
      }
    } else {
      // Add or update product
      const productSelection: ProductSelectionData = {
        product_id: product.id,
        product_name: product.name,
        variation_name: product.variation_name || '通常価格',
        quantity,
        unit_price: product.price,
        total_price: product.price * quantity,
        tax_type: product.tax_type || '内税',
        category: product.category_id?.toString(),
      };

      if (existingIndex >= 0) {
        newSelectedProducts[existingIndex] = productSelection;
      } else {
        newSelectedProducts.push(productSelection);
      }
    }

    setSelectedProducts(newSelectedProducts);
    setValue('products', newSelectedProducts);
  };

  const getProductQuantity = (productId: number): number => {
    const product = selectedProducts.find(p => p.product_id === productId);
    return product?.quantity || 0;
  };

  // All products passed to this component are already filtered by 
  // DatabaseService.getFormConfig to only include products assigned to the preset

  // Group products by category for better organization
  const groupedProducts = products.reduce((groups, product) => {
    const categoryId = product.category_id || 0;
    if (!groups[categoryId]) {
      groups[categoryId] = [];
    }
    groups[categoryId].push(product);
    return groups;
  }, {} as Record<number, Product[]>);


  return (
    <div className="space-y-6">
      <div className="border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-900">商品選択</h2>
        <p className="text-sm text-gray-600">
          ご希望の商品とそれぞれの数量を選択してください
        </p>
      </div>

      {/* Product Groups */}
      <div className="space-y-6">
        {Object.entries(groupedProducts).map(([categoryIdStr, categoryProducts]) => {
          const categoryId = parseInt(categoryIdStr, 10);
          
          // Skip category if no products (all products are already pre-filtered by server)
          if (categoryProducts.length === 0) {
            return null;
          }
          
          return (
            <div key={categoryId} className="space-y-3">
              <h3 className="text-md font-medium text-gray-800 border-l-4 border-green-500 pl-3">
                {getCategoryName(categoryId)}
              </h3>
              
              <div className="grid gap-3">
                {categoryProducts.map((product) => {
                    const quantity = getProductQuantity(product.id);
                    
                    return (
                      <div
                        key={product.id}
                        className={`border rounded-lg p-4 ${
                          quantity > 0 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200 hover:border-green-300'
                        } transition-colors`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {product.name}
                            </h4>
                            {formSettings.show_price && (
                              <p className="text-sm text-gray-600">
                                ¥{product.price.toLocaleString()}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(product.id, Math.max(0, quantity - 1))}
                              disabled={quantity === 0}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              −
                            </button>
                            
                            <span className="w-8 text-center font-medium">
                              {quantity}
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(product.id, Math.min(99, quantity + 1))}
                              disabled={quantity >= 99}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        {quantity > 0 && formSettings.show_price && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-sm text-gray-700">
                              小計: ¥{(product.price * quantity).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Products Summary */}
      {selectedProducts.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">選択した商品</h3>
          <div className="space-y-2">
            {selectedProducts.map((product) => (
              <div key={product.product_id} className="flex justify-between items-center text-sm">
                <span>
                  {product.product_name} × {product.quantity}
                </span>
                {formSettings.show_price && (
                  <span className="font-medium">
                    ¥{product.total_price.toLocaleString()}
                  </span>
                )}
              </div>
            ))}
            
            {formSettings.show_price && (
              <div className="pt-2 border-t border-green-300 flex justify-between items-center font-medium">
                <span>合計金額</span>
                <span className="text-lg text-green-700">
                  ¥{totalAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.products && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{errors.products.message}</p>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p>• 数量は最大99個まで選択できます</p>
        <p>• 商品を選択しない場合は、数量を0にしてください</p>
        <p>• 引き取り日は選択した商品カテゴリによって決まります</p>
      </div>
    </div>
  );
};