import React, { useMemo, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui';
import type { Product, PickupWindow, FormSettings } from '@/types';
import type { ReservationFormData, ProductSelectionData } from '@/lib/validations/reservationSchema';

export interface ProductSelectionSectionProps {
  products: Product[];
  pickupWindows: PickupWindow[];
  formSettings: FormSettings;
  className?: string;
}

export const ProductSelectionSection = React.memo<ProductSelectionSectionProps>(({
  products,
  pickupWindows,
  formSettings,
  className,
}) => {
  const { setValue, watch, formState: { errors } } = useFormContext<ReservationFormData>();
  
  const selectedProducts = watch('products') || [];

  // Group products by category for better organization
  const groupedProducts = useMemo(() => {
    return products.reduce((groups, product) => {
      const categoryId = product.category_id || 0;
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(product);
      return groups;
    }, {} as Record<number, Product[]>);
  }, [products]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return selectedProducts.reduce((sum, product) => sum + product.total_price, 0);
  }, [selectedProducts]);

  const getCategoryName = useCallback((categoryId: number): string => {
    switch (categoryId) {
      case 1: return '野菜セット';
      case 2: return '果物セット';
      case 3: return 'お米セット';
      default: return 'その他';
    }
  }, []);

  const getProductQuantity = useCallback((productId: number): number => {
    const product = selectedProducts.find(p => p.product_id === productId);
    return product?.quantity || 0;
  }, [selectedProducts]);

  const isProductAvailable = useCallback((productId: number): boolean => {
    return pickupWindows.some(window => window.product_id === productId);
  }, [pickupWindows]);

  const handleQuantityChange = useCallback((productId: number, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = selectedProducts.findIndex(p => p.product_id === productId);
    let newSelectedProducts = [...selectedProducts];

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
        quantity,
        unit_price: product.price,
        total_price: product.price * quantity,
        category: product.category_id?.toString(),
      };

      if (existingIndex >= 0) {
        newSelectedProducts[existingIndex] = productSelection;
      } else {
        newSelectedProducts.push(productSelection);
      }
    }

    setValue('products', newSelectedProducts);
  }, [products, selectedProducts, setValue]);

  const QuantityControl = React.memo<{ 
    productId: number;
    quantity: number;
    isAvailable: boolean;
  }>(({ productId, quantity, isAvailable }) => {
    if (!isAvailable) return null;

    return (
      <div className="flex items-center space-x-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => handleQuantityChange(productId, Math.max(0, quantity - 1))}
          disabled={quantity === 0}
          className="h-8 w-8 rounded-full"
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
          onClick={() => handleQuantityChange(productId, Math.min(99, quantity + 1))}
          disabled={quantity >= 99}
          className="h-8 w-8 rounded-full"
        >
          +
        </Button>
      </div>
    );
  });

  QuantityControl.displayName = 'QuantityControl';

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
        商品選択
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        ご希望の商品とそれぞれの数量を選択してください
      </p>

      {/* Product Groups */}
      <div className="space-y-6">
        {Object.entries(groupedProducts).map(([categoryIdStr, categoryProducts]) => {
          const categoryId = parseInt(categoryIdStr, 10);
          
          return (
            <div key={categoryId} className="space-y-3">
              <h3 className="text-md font-medium text-gray-800 border-l-4 border-green-500 pl-3">
                {getCategoryName(categoryId)}
              </h3>
              
              <div className="grid gap-3">
                {categoryProducts.map((product) => {
                  const quantity = getProductQuantity(product.id);
                  const isAvailable = isProductAvailable(product.id);
                  
                  return (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        !isAvailable 
                          ? 'bg-gray-50 border-gray-200 opacity-50' 
                          : quantity > 0 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200 hover:border-green-300'
                      }`}
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
                          {!isAvailable && (
                            <p className="text-xs text-red-500 mt-1">
                              現在選択できません
                            </p>
                          )}
                        </div>
                        
                        <QuantityControl
                          productId={product.id}
                          quantity={quantity}
                          isAvailable={isAvailable}
                        />
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
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
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
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{errors.products.message}</p>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p>• 数量は最大99個まで選択できます</p>
        <p>• 商品を選択しない場合は、数量を0にしてください</p>
        <p>• 引き取り日は選択した商品カテゴリによって決まります</p>
      </div>
    </div>
  );
});

ProductSelectionSection.displayName = 'ProductSelectionSection';