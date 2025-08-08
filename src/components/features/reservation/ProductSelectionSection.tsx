import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui';
import type { Product, PickupWindow, FormSettings } from '@/types';
import type { ReservationFormData, ProductSelectionData } from '@/lib/validations/reservationSchema';
import { getCategoryName } from '@/lib/utils';
// 緊急対応: React Error #418 完全回避のための安全なレンダリング関数
const safeRender = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
};

const safeProductName = (product: unknown): string => {
  if (!product || typeof product !== 'object') return '商品名不明';
  const productObj = product as Record<string, unknown>;
  if (typeof productObj.name === 'string') return productObj.name;
  if (typeof productObj.product_name === 'string') return productObj.product_name;
  return '商品名不明';
};

const safePrice = (price: unknown): string => {
  if (typeof price === 'number' && !isNaN(price)) {
    return `¥${price.toLocaleString()}`;
  }
  if (typeof price === 'string') {
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice)) {
      return `¥${numPrice.toLocaleString()}`;
    }
  }
  return '¥0';
};

const safeQuantity = (quantity: unknown): number => {
  if (typeof quantity === 'number' && !isNaN(quantity)) {
    return Math.max(0, Math.floor(quantity));
  }
  if (typeof quantity === 'string') {
    const numQuantity = parseInt(quantity, 10);
    if (!isNaN(numQuantity)) {
      return Math.max(0, numQuantity);
    }
  }
  return 0;
};

const isValidProduct = (product: unknown): product is {
  id: number;
  name: string;
  price: number;
} => {
  return (
    typeof product === 'object' &&
    product !== null &&
    typeof (product as any).id === 'number' &&
    typeof (product as any).name === 'string' &&
    typeof (product as any).price === 'number'
  );
};

export interface ProductSelectionSectionProps {
  products: Product[];
  pickupWindows: PickupWindow[];
  formSettings: FormSettings;
  className?: string;
}

// 緊急対応: 完全なエラー境界コンポーネント
class ProductSelectionErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: React.ErrorInfo }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('ProductSelection Error Boundary - getDerivedStateFromError:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ProductSelection Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      errorInfo: errorInfo.componentStack
    });
    
    this.setState({ 
      hasError: true, 
      error, 
      errorInfo 
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                商品選択でエラーが発生しました
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {this.state.error?.message || '予期しないエラーが発生しました'}
              </p>
              <div className="mt-3 space-x-2">
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                  }}
                  className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  再試行
                </button>
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                >
                  ページを再読み込み
                </button>
              </div>
              
              {/* デバッグ情報（開発環境のみ） */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-3">
                  <summary className="text-xs text-red-600 cursor-pointer">
                    エラー詳細を表示
                  </summary>
                  <pre className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded overflow-auto max-h-32">
                    {this.state.error?.stack}
                    {'\n\nComponent Stack:'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ProductSelectionSection = React.memo<ProductSelectionSectionProps>(({
  products,
  pickupWindows,
  formSettings,
  className,
}) => {
  // フォームコンテキストの安全な取得
  let formContext;
  try {
    formContext = useFormContext<ReservationFormData>();
  } catch (formError) {
    console.error('ProductSelectionSection - Form context error:', formError);
    return (
      <div className={className}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800">フォームエラー</h3>
          <p className="text-sm text-red-700 mt-1">フォームコンテキストが取得できませんでした</p>
        </div>
      </div>
    );
  }
  
  const { setValue, watch, formState: { errors } } = formContext;
  
  // 安全な初期値設定
  const selectedProducts = (() => {
    try {
      const products = watch('products');
      if (!Array.isArray(products)) {
        console.warn('ProductSelectionSection - watch returned non-array:', products);
        return [];
      }
      return products;
    } catch (watchError) {
      console.error('ProductSelectionSection - watch error:', watchError);
      return [];
    }
  })();
  
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // クライアントサイドハイドレーション対応
  useEffect(() => {
    setIsClient(true);
    
    // デバッグ情報の設定
    setDebugInfo({
      productsType: typeof products,
      productsIsArray: Array.isArray(products),
      productsLength: products?.length || 0,
      formSettingsExists: !!formSettings,
      timestamp: new Date().toISOString()
    });
  }, [products, formSettings]);
  
  // 商品データの安全な処理
  const safeProducts = useMemo(() => {
    if (!isClient) {
      console.log('[ProductSelection] Client not ready');
      return [];
    }
    
    console.log('[ProductSelection] Processing products:', {
      type: typeof products,
      isArray: Array.isArray(products),
      length: products?.length || 0,
      data: products,
      productsStringified: JSON.stringify(products)?.substring(0, 500)
    });
    
    // 緊急対応: 商品データが取得できない場合の詳細なエラーハンドリング
    try {
      if (!products) {
        console.error('[ProductSelection] Products is null or undefined');
        setError('商品データが取得できませんでした。ページを再読み込みしてください。');
        return [];
      }
      
      if (!Array.isArray(products)) {
        console.error('[ProductSelection] Products is not an array:', typeof products, products);
        setError('商品データの形式が正しくありません。管理者にお問い合わせください。');
        return [];
      }
      
      if (products.length === 0) {
        console.warn('[ProductSelection] Products array is empty');
        // より詳細なメッセージで、管理者向けの指示を含める
        setError(`このフォーム(プリセット)には商品が設定されていません。\n\n管理者の方は以下をご確認ください：\n1. 管理画面でプリセットに商品が追加されているか\n2. 商品が「表示」状態になっているか\n3. プリセット商品が「有効」になっているか`);
        return [];
      }
      
      // 商品データの検証とフィルタリング
      const validProducts = products.filter((product, index) => {
        try {
          if (!product) {
            console.warn(`[ProductSelection] Product at index ${index} is null/undefined`);
            return false;
          }
          
          if (!isValidProduct(product)) {
            console.warn(`[ProductSelection] Invalid product at index ${index}:`, product);
            return false;
          }
          
          return true;
        } catch (filterError) {
          console.error(`[ProductSelection] Error filtering product at index ${index}:`, filterError);
          return false;
        }
      });
      
      if (validProducts.length === 0) {
        console.error('[ProductSelection] No valid products found after filtering');
        setError('有効な商品データが見つかりませんでした。管理者にお問い合わせください。');
        return [];
      }
      
      console.log(`[ProductSelection] Processed ${validProducts.length} valid products`);
      setError(null);
      return validProducts;
      
    } catch (processingError) {
      console.error('[ProductSelection] Error processing products:', processingError);
      setError('商品データの処理中にエラーが発生しました。ページを再読み込みしてください。');
      return [];
    }
  }, [products, isClient]);

  // クライアントサイド準備前の表示
  if (!isClient) {
    return (
      <div className={className}>
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
          商品選択
        </h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            商品情報を読み込み中...
          </p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className={className}>
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
          商品選択
        </h2>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                商品が設定されていません
              </h3>
              <div className="text-sm text-orange-700 mt-1" style={{whiteSpace: 'pre-line'}}>
                {safeRender(error)}
              </div>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {
                    setError(null);
                    window.location.reload();
                  }}
                  className="text-sm bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 mr-2"
                >
                  ページを再読み込み
                </button>
                <a
                  href="/admin/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  管理画面を開く
                </a>
              </div>
              
              {/* デバッグ情報（開発環境のみ） */}
              {process.env.NODE_ENV === 'development' && debugInfo && (
                <details className="mt-3">
                  <summary className="text-xs text-red-600 cursor-pointer">
                    デバッグ情報を表示
                  </summary>
                  <pre className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded overflow-auto">
                    {safeRender(debugInfo)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Log products being passed to component
  console.log(`ProductSelectionSection received ${safeProducts.length} products:`, safeProducts.map(p => ({ id: p.id, name: safeProductName(p) })));
  console.log('Products are preset-filtered and all available for selection');

  // Group products by category for better organization
  const groupedProducts = useMemo(() => {
    console.log('ProductSelectionSection groupedProducts useMemo - safeProducts:', {
      type: typeof safeProducts,
      isArray: Array.isArray(safeProducts),
      length: safeProducts?.length,
      data: safeProducts
    });
    
    // 安全なチェック: safeProductsが配列でない場合は空のオブジェクトを返す
    if (!Array.isArray(safeProducts) || safeProducts.length === 0) {
      console.log('ProductSelectionSection groupedProducts - returning empty object due to no products');
      return {} as Record<number, Product[]>;
    }
    
    try {
      return safeProducts.reduce((groups, product) => {
        // 商品データの安全性チェック
        if (!product || typeof product !== 'object') {
          console.warn('ProductSelectionSection - invalid product data:', product);
          return groups;
        }
        
        const categoryId = product.category_id || 0;
        if (!groups[categoryId]) {
          groups[categoryId] = [];
        }
        groups[categoryId].push(product);
        return groups;
      }, {} as Record<number, Product[]>);
    } catch (error) {
      console.error('ProductSelectionSection groupedProducts useMemo error:', error);
      return {} as Record<number, Product[]>;
    }
  }, [safeProducts]);

  // 合計金額の計算
  const totalAmount = useMemo(() => {
    console.log('totalAmount useMemo - selectedProducts:', {
      type: typeof selectedProducts,
      isArray: Array.isArray(selectedProducts),
      length: selectedProducts?.length,
      data: selectedProducts
    });
    
    // 安全なチェック: selectedProductsが配列でない場合は0を返す
    if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
      console.log('totalAmount - returning 0 due to no selected products');
      return 0;
    }
    
    try {
      return selectedProducts.reduce((sum, product) => {
        // 商品データの安全性チェック
        if (!product || typeof product !== 'object') {
          console.warn('totalAmount - invalid product data:', product);
          return sum;
        }
        
        const quantity = typeof product.quantity === 'number' ? product.quantity : 0;
        const price = typeof product.unit_price === 'number' ? product.unit_price : 0;
        return sum + (quantity * price);
      }, 0);
    } catch (error) {
      console.error('totalAmount useMemo error:', error);
      return 0;
    }
  }, [selectedProducts]);

  // 商品の選択数量取得
  const getProductQuantity = useCallback((productId: number): number => {
    console.log('getProductQuantity - selectedProducts:', {
      type: typeof selectedProducts,
      isArray: Array.isArray(selectedProducts),
      length: selectedProducts?.length,
      productId: productId
    });
    
    // 安全なチェック: selectedProductsが配列でない場合は0を返す
    if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
      console.log('getProductQuantity - returning 0 due to no selected products');
      return 0;
    }
    
    try {
      const product = selectedProducts.find(p => {
        // 商品データの安全性チェック
        if (!p || typeof p !== 'object') {
          console.warn('getProductQuantity - invalid product in find:', p);
          return false;
        }
        return p.product_id === productId;
      });
      return typeof product?.quantity === 'number' ? product.quantity : 0;
    } catch (error) {
      console.error('getProductQuantity error:', error);
      return 0;
    }
  }, [selectedProducts]);

  const isProductAvailable = useCallback((productId: number): boolean => {
    // All products passed to this component are already filtered by preset
    // via DatabaseService.getFormConfig, so they are all available
    return true;
  }, []);

  // 数量変更ハンドラー
  const handleQuantityChange = useCallback((productId: number, quantity: number) => {
    console.log('handleQuantityChange called:', {
      productId,
      quantity,
      safeProductsLength: safeProducts?.length,
      selectedProductsLength: selectedProducts?.length
    });
    
    try {
      // safeProductsの安全性チェック
      if (!Array.isArray(safeProducts) || safeProducts.length === 0) {
        console.error('handleQuantityChange - safeProducts is not valid array');
        setError('商品データが利用できません。ページを再読み込みしてください。');
        return;
      }
      
      const product = safeProducts.find(p => {
        if (!p || typeof p !== 'object' || typeof p.id !== 'number') {
          console.warn('handleQuantityChange - invalid product in find:', p);
          return false;
        }
        return p.id === productId;
      });
      
      if (!product) {
        console.error(`Product not found: ${productId}`);
        setError(`商品ID ${productId} が見つかりません`);
        return;
      }

      // selectedProductsの安全性チェック
      if (!Array.isArray(selectedProducts)) {
        console.error('handleQuantityChange - selectedProducts is not an array');
        setError('選択済み商品データが正しくありません');
        return;
      }

      const safeQty = Math.max(0, Math.min(99, Math.floor(quantity)));
      const existingIndex = selectedProducts.findIndex(p => {
        if (!p || typeof p !== 'object' || typeof p.product_id !== 'number') {
          console.warn('handleQuantityChange - invalid product in findIndex:', p);
          return false;
        }
        return p.product_id === productId;
      });
      const newSelectedProducts = [...selectedProducts];

      if (safeQty === 0) {
        // 商品を削除
        if (existingIndex >= 0) {
          newSelectedProducts.splice(existingIndex, 1);
        }
      } else {
        // 商品を追加または更新
        const productSelection: ProductSelectionData = {
          product_id: product.id,
          product_name: safeProductName(product),
          variation_name: product.variation_name || '通常価格',
          quantity: safeQty,
          unit_price: product.price || 0,
          total_price: (product.price || 0) * safeQty,
          tax_type: product.tax_type || '内税',
          category: product.category_id?.toString(),
        };

        if (existingIndex >= 0) {
          newSelectedProducts[existingIndex] = productSelection;
        } else {
          newSelectedProducts.push(productSelection);
        }
      }

      setValue('products', newSelectedProducts);
      console.log(`[ProductSelection] Updated quantity for product ${productId}: ${safeQty}`);
    } catch (error) {
      console.error('Error in handleQuantityChange:', error);
      setError('商品の数量変更中にエラーが発生しました');
    }
  }, [safeProducts, selectedProducts, setValue]);

  // State for showing/hiding product selection
  const [showProductSelection, setShowProductSelection] = useState(selectedProducts.length === 0);

  // 数量コントロールコンポーネント
  const QuantityControl = React.memo<{ 
    productId: number;
    quantity: number;
  }>(({ productId, quantity }) => (
    <div className="flex items-center space-x-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => handleQuantityChange(productId, quantity - 1)}
        disabled={quantity === 0}
        className="h-8 w-8 rounded-full"
      >
        −
      </Button>
      
      <span className="w-8 text-center font-medium text-sm">
        {safeRender(quantity)}
      </span>
      
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => handleQuantityChange(productId, quantity + 1)}
        disabled={quantity >= 99}
        className="h-8 w-8 rounded-full"
      >
        +
      </Button>
    </div>
  ));

  QuantityControl.displayName = 'QuantityControl';

  // 最終的な安全性チェック
  const renderContent = () => {
    try {
      console.log('ProductSelectionSection renderContent - final safety check:', {
        safeProductsLength: safeProducts?.length,
        selectedProductsLength: selectedProducts?.length,
        groupedProductsKeys: Object.keys(groupedProducts || {}),
        totalAmount,
        isClient,
        error
      });
      
      return (
        <div className={className}>
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
            商品選択
          </h2>

        {/* 選択済み商品サマリー */}
        {selectedProducts.length > 0 && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">選択した商品</h3>
            <div className="space-y-2">
              {selectedProducts.map((product) => (
                <div key={product.product_id} className="flex justify-between items-center text-sm">
                  <span>
                    {safeRender(product.product_name)} × {safeRender(product.quantity)}
                  </span>
                  <div className="flex items-center space-x-2">
                    {formSettings?.show_price && (
                      <span className="font-medium">
                        {safePrice(product.total_price)}
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
              
              {formSettings?.show_price && (
                <div className="pt-2 border-t border-green-300 flex justify-between items-center font-medium">
                  <span>合計金額</span>
                  <span className="text-lg text-green-700">
                    {safePrice(totalAmount)}
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
            // All products are already filtered by preset, so all are available
            const availableProducts = categoryProducts;
            
            if (availableProducts.length === 0) return null;
            
            return (
              <div key={categoryId} className="space-y-3">
                <h3 className="text-md font-medium text-gray-800 border-l-4 border-green-500 pl-3">
                  {getCategoryName(categoryId)}
                </h3>
                
                <div className="grid gap-3">
                  {availableProducts.map((product) => {
                    const quantity = getProductQuantity(product.id);
                    const isAvailable = true; // All products are preset-filtered and available
                    
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
                              {safeRender(product.name)}
                            </h4>
                            {formSettings?.show_price && (
                              <p className="text-sm text-gray-600">
                                {safePrice(product.price)}
                              </p>
                            )}
                          </div>
                          
                          <QuantityControl
                            productId={product.id}
                            quantity={quantity}
                          />
                        </div>
                        
                        {quantity > 0 && formSettings?.show_price && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-sm text-gray-700">
                              小計: {safePrice((product.price || 0) * quantity)}
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
          <p className="text-sm text-red-600">{safeRender(errors.products.message)}</p>
        </div>
      )}

        {/* ヘルプテキスト */}
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p>• 数量は最大99個まで選択できます</p>
          <p>• 選択した商品は上部に表示され、「削除」ボタンで取り消せます</p>
          <p>• 引き取り日は選択した商品カテゴリによって決まります</p>
        </div>
      </div>
    );
    } catch (renderError) {
      console.error('ProductSelectionSection renderContent error:', renderError);
      return (
        <div className={className}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800">レンダリングエラー</h3>
            <p className="text-sm text-red-700 mt-1">
              商品選択コンポーネントでエラーが発生しました。ページを再読み込みしてください。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }
  };
  
  return (
    <ProductSelectionErrorBoundary>
      {renderContent()}
    </ProductSelectionErrorBoundary>
  );
});

ProductSelectionSection.displayName = 'ProductSelectionSection';