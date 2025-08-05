/**
 * 商品選択コンテナコンポーネント - 改善指示書に基づく統合実装
 * データ取得、状態管理、UIコンポーネントの統合
 */

import React, { useState } from 'react';
import { usePresetConfig } from '@/hooks/usePresetConfig';
import { useProductSelection, ProductSelection } from '@/hooks/useProductSelection';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Product } from '@/types';

export interface ProductSelectionContainerProps {
  presetId: number;
  onSelectionChange?: (selections: ProductSelection[]) => void;
  className?: string;
}

/**
 * 商品選択の統合コンテナコンポーネント
 * 改善指示書に基づく単一責任原則の適用
 */
export const ProductSelectionContainer: React.FC<ProductSelectionContainerProps> = ({
  presetId,
  onSelectionChange,
  className = ''
}) => {
  const [showProductSelection, setShowProductSelection] = useState(false);

  // プリセット設定の取得
  const { 
    data: config, 
    isLoading, 
    error: configError, 
    refetch 
  } = usePresetConfig(presetId);

  // 商品選択の管理
  const {
    selectedProducts,
    totalAmount,
    addProduct,
    removeProduct,
    updateQuantity,
    getProductQuantity
  } = useProductSelection({
    onSelectionChange: (selections) => {
      onSelectionChange?.(selections);
      
      // 商品選択後は選択画面を閉じる
      if (selections.length > 0 && showProductSelection) {
        setShowProductSelection(false);
      }
    }
  });

  // ローディング状態
  if (isLoading) {
    return (
      <div className={className}>
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
          商品選択
        </h2>
        <LoadingSpinner message="商品情報を読み込み中..." />
      </div>
    );
  }

  // エラー状態
  if (configError || !config) {
    return (
      <div className={className}>
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
          商品選択
        </h2>
        <ErrorMessage
          error={configError || '設定の読み込みに失敗しました'}
          title="商品選択でエラーが発生しました"
          actionLabel="再読み込み"
          onAction={refetch}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      </div>
    );
  }

  const products = config.preset_products
    .map(pp => pp.product)
    .filter((product): product is Product => product !== null && product !== undefined);

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
        商品選択
      </h2>

      {/* 選択済み商品サマリー */}
      {selectedProducts.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">選択された商品</h3>
          {selectedProducts.map((selection) => (
            <div key={selection.product_id} className="flex justify-between items-center py-1">
              <span>{selection.product_name} × {selection.quantity}</span>
              {config.form_settings.show_price && (
                <span>¥{selection.total_price.toLocaleString()}</span>
              )}
            </div>
          ))}
          <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
            <span>合計: {selectedProducts.reduce((sum, s) => sum + s.quantity, 0)}点</span>
            {config.form_settings.show_price && (
              <span>¥{totalAmount.toLocaleString()}</span>
            )}
          </div>
        </div>
      )}

      {/* 商品選択の開閉ボタン */}
      <button
        type="button"
        onClick={() => setShowProductSelection(!showProductSelection)}
        className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {showProductSelection ? '商品選択を閉じる' : '商品を選択する'}
      </button>

      {/* 商品リスト */}
      {showProductSelection && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              selectedQuantity={getProductQuantity(product.id)}
              onSelect={(quantity) => addProduct(product, quantity)}
              onQuantityChange={(quantity) => updateQuantity(product.id, quantity)}
              onRemove={() => removeProduct(product.id)}
              showPrice={config.form_settings.show_price}
            />
          ))}
        </div>
      )}

      {/* ヘルプテキスト */}
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p>• 数量は最大99個まで選択できます</p>
        <p>• 選択した商品は「削除」ボタンで取り消せます</p>
      </div>
    </div>
  );
};

// 商品カードコンポーネント
interface ProductCardProps {
  product: Product;
  selectedQuantity: number;
  onSelect: (quantity: number) => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  showPrice: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  selectedQuantity,
  onSelect,
  onQuantityChange,
  onRemove,
  showPrice
}) => {
  const isSelected = selectedQuantity > 0;

  return (
    <div className={`border rounded-lg p-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
      <h3 className="font-medium text-gray-900 mb-2">{product.name}</h3>
      {showPrice && (
        <p className="text-lg font-semibold text-blue-600 mb-3">¥{product.price.toLocaleString()}</p>
      )}
      
      {!isSelected ? (
        <button
          onClick={() => onSelect(1)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          選択する
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <label className="text-sm">数量:</label>
            <input
              type="number"
              min="1"
              max="99"
              value={selectedQuantity}
              onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
              className="w-20 px-2 py-1 border rounded text-center"
            />
          </div>
          <button
            onClick={onRemove}
            className="w-full bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700"
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductSelectionContainer;