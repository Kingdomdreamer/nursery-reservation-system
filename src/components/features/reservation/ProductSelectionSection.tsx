import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui';
import type { Product, PickupWindow, FormSettings } from '@/types';
import type { ReservationFormData, ProductSelectionData } from '@/lib/validations/reservationSchema';
import { getCategoryName } from '@/lib/utils';

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
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch by only rendering client-side content after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Early return if products is not properly initialized or client not ready
  if (!isClient || !products || !Array.isArray(products)) {
    return (
      <div className={className}>
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
          商品選択
        </h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            商品情報を読み込み中...
          </p>
        </div>
      </div>
    );
  }

  // Debug: Log products being passed to component
  console.log(`ProductSelectionSection received ${(products || []).length} products:`, (products || []).map(p => ({ id: p.id, name: p.name })));

  // Group products by category for better organization
  const groupedProducts = useMemo(() => {
    console.log('ProductSelectionSection groupedProducts useMemo - products:', {
      type: typeof products,
      isArray: Array.isArray(products),
      length: products?.length,
      data: products
    });
    
    return (products || []).reduce((groups, product) => {
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
    return (selectedProducts || []).reduce((sum, product) => sum + product.total_price, 0);
  }, [selectedProducts]);


  const getProductQuantity = useCallback((productId: number): number => {
    const product = (selectedProducts || []).find(p => p.product_id === productId);
    return product?.quantity || 0;
  }, [selectedProducts]);

  const isProductAvailable = useCallback((productId: number): boolean => {
    // All products passed to this component should already be filtered by preset
    // So if a product is in the products array, it's available
    return products.some(product => product.id === productId);
  }, [products]);

  const handleQuantityChange = useCallback((productId: number, quantity: number) => {
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

  // State for showing/hiding product selection
  const [showProductSelection, setShowProductSelection] = useState(selectedProducts.length === 0);

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

      {/* Show message when no products are available */}
      {products.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-yellow-700 mb-2">
              このプリセットには商品が設定されていません
            </p>
            <p className="text-xs text-yellow-600">
              管理画面でプリセットに商品を追加してください
            </p>
          </div>
        </div>
      )}

      {/* Selected Products Summary - Always show when products are selected */}
      {selectedProducts.length > 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">選択した商品</h3>
          <div className="space-y-2">
            {selectedProducts.map((product) => (
              <div key={product.product_id} className="flex justify-between items-center text-sm">
                <span>
                  {product.product_name} × {product.quantity}
                </span>
                <div className="flex items-center space-x-2">
                  {formSettings.show_price && (
                    <span className="font-medium">
                      ¥{product.total_price.toLocaleString()}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(product.product_id, 0)}
                    className="text-xs h-6 px-2"
                  >
                    削除
                  </Button>
                </div>
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

      {/* Toggle button for product selection */}
      <div className="mb-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowProductSelection(!showProductSelection)}
          className="w-full"
        >
          {showProductSelection ? '商品選択を閉じる' : '商品を追加選択する'}
        </Button>
      </div>

      {/* Product Groups - Show when expanded */}
      {showProductSelection && (
        <div className="space-y-6 mb-6">
          <p className="text-sm text-gray-600">
            ご希望の商品とそれぞれの数量を選択してください
          </p>
          
          {Object.entries(groupedProducts).map(([categoryIdStr, categoryProducts]) => {
            const categoryId = parseInt(categoryIdStr, 10);
            const availableProducts = categoryProducts.filter(product => isProductAvailable(product.id));
            
            if (availableProducts.length === 0) return null;
            
            return (
              <div key={categoryId} className="space-y-3">
                <h3 className="text-md font-medium text-gray-800 border-l-4 border-green-500 pl-3">
                  {getCategoryName(categoryId)}
                </h3>
                
                <div className="grid gap-3">
                  {availableProducts.map((product) => {
                    const quantity = getProductQuantity(product.id);
                    const isAvailable = isProductAvailable(product.id);
                    
                    return (
                      <div
                        key={product.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          quantity > 0 
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
        <p>• 選択した商品は上部に表示され、「削除」ボタンで取り消せます</p>
        <p>• 引き取り日は選択した商品カテゴリによって決まります</p>
      </div>
    </div>
  );
});

ProductSelectionSection.displayName = 'ProductSelectionSection';