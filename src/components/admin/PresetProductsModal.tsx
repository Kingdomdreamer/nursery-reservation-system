'use client';

import { useState, useEffect } from 'react';
import type { Product, ProductPreset, PresetProduct } from '@/types';

interface PresetProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  preset: ProductPreset;
}

export default function PresetProductsModal({
  isOpen,
  onClose,
  onSave,
  preset
}: PresetProductsModalProps) {
  const [loading, setLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [presetProducts, setPresetProducts] = useState<PresetProduct[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen && preset) {
      loadData();
    }
  }, [isOpen, preset]);

  if (!isOpen) return null;

  const loadData = async () => {
    setLoading(true);
    try {
      // 全商品を取得
      const productsResponse = await fetch('/api/admin/products');
      const productsResult = await productsResponse.json();
      
      if (productsResponse.ok) {
        setAllProducts(productsResult.data || []);
      } else {
        console.error('商品取得エラー:', productsResult.error);
      }

      // プリセットに関連付けられた商品を取得
      const presetProductsResponse = await fetch(`/api/admin/preset-products/${preset.id}`);
      
      if (presetProductsResponse.status === 404) {
        // まだ商品が関連付けられていない場合
        setPresetProducts([]);
        setSelectedProductIds(new Set());
      } else {
        const presetProductsResult = await presetProductsResponse.json();
        
        if (presetProductsResponse.ok) {
          const products = presetProductsResult.data || [];
          setPresetProducts(products);
          setSelectedProductIds(new Set(products.map((pp: PresetProduct) => pp.product_id)));
        } else {
          console.error('プリセット商品取得エラー:', presetProductsResult.error);
        }
      }
      
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      alert('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleProductToggle = (productId: number) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProductIds(newSelected);
  };

  const getDisplayOrder = (productId: number): number => {
    const existing = presetProducts.find(pp => pp.product_id === productId);
    return existing ? existing.display_order : Math.max(0, ...presetProducts.map(pp => pp.display_order)) + 1;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const selectedProducts = Array.from(selectedProductIds).map((productId, index) => ({
        product_id: productId,
        display_order: getDisplayOrder(productId)
      }));

      const response = await fetch(`/api/admin/preset-products/${preset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: selectedProducts
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '保存に失敗しました');
      }

      alert('商品の関連付けを保存しました');
      onSave();
      onClose();
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedProductIds.size;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              商品選択 - {preset.preset_name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              このプリセットで提供する商品を選択してください
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">データを読み込み中...</p>
            </div>
          ) : (
            <>
              {/* 選択状況 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">選択状況</h3>
                    <p className="text-sm text-blue-700">
                      {selectedCount}個の商品が選択されています
                    </p>
                  </div>
                  {selectedCount > 0 && (
                    <div className="text-blue-600">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* 商品一覧 */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">商品一覧</h3>
                
                {allProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">商品がありません</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allProducts.map((product) => {
                      const isSelected = selectedProductIds.has(product.id);
                      return (
                        <div
                          key={product.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleProductToggle(product.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleProductToggle(product.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()} // 重複クリック防止
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{product.name}</h4>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-lg font-bold text-blue-600">
                                  ¥{product.price.toLocaleString()}
                                </p>
                                {product.external_id && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {product.external_id}
                                  </span>
                                )}
                              </div>
                              {product.category_id && (
                                <p className="text-sm text-gray-600 mt-1">
                                  カテゴリ: {product.category_id}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedCount > 0 && (
              <span>{selectedCount}個の商品が選択されています</span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '保存中...' : `商品選択を保存 (${selectedCount}個)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}