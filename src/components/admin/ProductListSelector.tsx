'use client';

import { useState, useEffect } from 'react';
import type { Product, ProductPreset, PresetProduct } from '@/types';

interface ProductListSelectorProps {
  preset: ProductPreset;
  onSave: (selectedProducts: { product_id: number; display_order: number }[]) => void;
  onClose: () => void;
}

export default function ProductListSelector({ preset, onSave, onClose }: ProductListSelectorProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<PresetProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [preset.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 全商品を取得
      const productsResponse = await fetch('/api/admin/products?limit=1000');
      const productsResult = await productsResponse.json();
      
      if (productsResponse.ok) {
        setAllProducts(productsResult.data || []);
      }

      // 現在のプリセット商品を取得
      const presetProductsResponse = await fetch(`/api/admin/preset-products/${preset.id}`);
      
      if (presetProductsResponse.ok) {
        const presetProductsResult = await presetProductsResponse.json();
        setSelectedProducts(presetProductsResult.data || []);
      } else if (presetProductsResponse.status !== 404) {
        console.error('Error loading preset products');
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = (product: Product) => {
    const newDisplayOrder = Math.max(0, ...selectedProducts.map(p => p.display_order)) + 1;
    const newPresetProduct: PresetProduct = {
      id: Date.now(), // Temporary ID for UI
      preset_id: preset.id,
      product_id: product.id,
      display_order: newDisplayOrder,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setSelectedProducts([...selectedProducts, newPresetProduct]);
  };

  const removeProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.product_id !== productId));
  };

  const moveProduct = (productId: number, direction: 'up' | 'down') => {
    const sortedProducts = [...selectedProducts].sort((a, b) => a.display_order - b.display_order);
    const index = sortedProducts.findIndex(p => p.product_id === productId);
    
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < sortedProducts.length - 1)) {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Swap display orders
      const temp = sortedProducts[index].display_order;
      sortedProducts[index].display_order = sortedProducts[newIndex].display_order;
      sortedProducts[newIndex].display_order = temp;
      
      setSelectedProducts(sortedProducts);
    }
  };

  const handleSave = () => {
    const productList = selectedProducts.map(p => ({
      product_id: p.product_id,
      display_order: p.display_order
    }));
    
    onSave(productList);
  };

  const getProductName = (productId: number): string => {
    const product = allProducts.find(p => p.id === productId);
    return product?.name || `商品ID: ${productId}`;
  };

  const getProductPrice = (productId: number): number => {
    const product = allProducts.find(p => p.id === productId);
    return product?.price || 0;
  };

  const isProductSelected = (productId: number): boolean => {
    return selectedProducts.some(p => p.product_id === productId);
  };

  const availableProducts = allProducts.filter(p => p.visible && !isProductSelected(p.id));
  const sortedSelectedProducts = [...selectedProducts].sort((a, b) => a.display_order - b.display_order);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              商品リスト設定 - {preset.preset_name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              プリセットで提供する商品を選択し、表示順序を設定してください
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="flex h-[calc(90vh-8rem)]">
          {/* 選択済み商品リスト */}
          <div className="w-1/2 border-r border-gray-200">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-medium text-gray-900">
                選択済み商品 ({selectedProducts.length}個)
              </h3>
            </div>
            <div className="overflow-y-auto h-full p-4">
              {sortedSelectedProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  商品が選択されていません
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedSelectedProducts.map((presetProduct, index) => (
                    <div key={presetProduct.product_id} className="border rounded-lg p-3 bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </span>
                            <h4 className="font-medium text-gray-900 text-sm">
                              {getProductName(presetProduct.product_id)}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            ¥{getProductPrice(presetProduct.product_id).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => moveProduct(presetProduct.product_id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveProduct(presetProduct.product_id, 'down')}
                            disabled={index === sortedSelectedProducts.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeProduct(presetProduct.product_id)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 利用可能商品リスト */}
          <div className="w-1/2">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-medium text-gray-900">
                利用可能商品 ({availableProducts.length}個)
              </h3>
            </div>
            <div className="overflow-y-auto h-full p-4">
              {availableProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  利用可能な商品がありません
                </div>
              ) : (
                <div className="space-y-3">
                  {availableProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            ¥{product.price.toLocaleString()}
                          </p>
                          {product.external_id && (
                            <p className="text-xs text-gray-500">ID: {product.external_id}</p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => addProduct(product)}
                          className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                        >
                          追加
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedProducts.length > 0 && (
              <span>{selectedProducts.length}個の商品が選択されています</span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              保存 ({selectedProducts.length}個)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}