'use client';

import { useState, useEffect } from 'react';
import type { Product, ProductPreset, PresetProduct, ProductFilters, PaginationInfo } from '@/types';
import PresetProductSearch from './PresetProductSearch';
import PresetProductPagination from './PresetProductPagination';

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
  
  // 検索・ページング状態
  const [productFilters, setProductFilters] = useState<ProductFilters>({
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && preset) {
      loadData();
    }
  }, [isOpen, preset]);

  if (!isOpen) return null;

  const loadData = async () => {
    setLoading(true);
    try {
      // 商品を検索・ページング付きで取得
      await loadProducts();

      // プリセットに関連付けられた商品を取得
      const presetProductsResponse = await fetch(`/api/admin/preset-products/${preset.id}`);
      
      if (presetProductsResponse.status === 404) {
        // まだ商品が関連付けられていない場合
        setPresetProducts([]);
        setSelectedProductIds(new Set());
      } else if (presetProductsResponse.ok) {
        const presetProductsResult = await presetProductsResponse.json();
        const products = Array.isArray(presetProductsResult) ? presetProductsResult : presetProductsResult.data || [];
        setPresetProducts(products);
        setSelectedProductIds(new Set(products.map((pp: PresetProduct) => pp.product_id)));
      } else {
        const errorText = await presetProductsResponse.text();
        console.error('プリセット商品取得エラー:', errorText);
      }
      
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      const errorMessage = error instanceof Error ? error.message : 'データの読み込みに失敗しました';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 商品データ取得（検索・ページング対応）
  const loadProducts = async (filters: ProductFilters = productFilters, page: number = 1) => {
    setProductsLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.set('page', page.toString());
      searchParams.set('limit', '10'); // プリセット選択では少なめに表示
      
      if (filters.name) searchParams.set('name', filters.name);
      if (filters.category_id) searchParams.set('category_id', filters.category_id);
      if (filters.min_price) searchParams.set('min_price', filters.min_price);
      if (filters.max_price) searchParams.set('max_price', filters.max_price);
      if (filters.variation_type) searchParams.set('variation_type', filters.variation_type);
      if (filters.sort_by) searchParams.set('sort_by', filters.sort_by);
      if (filters.sort_order) searchParams.set('sort_order', filters.sort_order);

      const response = await fetch(`/api/admin/products?${searchParams.toString()}`);
      const result = await response.json();
      
      if (response.ok) {
        setAllProducts(result.data || []);
        setPagination(result.pagination);
      } else {
        console.error('商品取得エラー:', result.error);
      }
    } catch (error) {
      console.error('商品データ読み込みエラー:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  // 検索実行
  const handleProductSearch = () => {
    loadProducts(productFilters, 1);
  };

  // 検索リセット
  const handleProductSearchReset = () => {
    const resetFilters: ProductFilters = {
      sort_by: 'created_at',
      sort_order: 'desc'
    };
    setProductFilters(resetFilters);
    loadProducts(resetFilters, 1);
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    loadProducts(productFilters, page);
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

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = '保存に失敗しました';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      alert('商品の関連付けを保存しました');
      onSave();
      onClose();
    } catch (error) {
      console.error('保存エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '保存に失敗しました';
      alert(`保存に失敗しました: ${errorMessage}`);
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
              {/* 商品検索 */}
              <PresetProductSearch
                filters={productFilters}
                onFiltersChange={setProductFilters}
                onSearch={handleProductSearch}
                onReset={handleProductSearchReset}
                loading={productsLoading}
                selectedCount={selectedCount}
              />

              {/* 商品一覧 */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">商品一覧</h3>
                    <div className="text-sm text-gray-600">
                      {pagination.totalItems}件中 {pagination.page * pagination.limit - pagination.limit + 1}〜{Math.min(pagination.page * pagination.limit, pagination.totalItems)}件を表示
                    </div>
                  </div>
                  
                  {productsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600 text-sm">商品を検索中...</p>
                    </div>
                  ) : allProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">検索条件に一致する商品がありません</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {allProducts.map((product) => {
                          const isSelected = selectedProductIds.has(product.id);
                          return (
                            <div
                              key={product.id}
                              className={`border rounded-lg p-3 cursor-pointer transition-all ${
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
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                                      {(product as any).external_id && (
                                        <p className="text-xs text-gray-500 mt-1">ID: {(product as any).external_id}</p>
                                      )}
                                    </div>
                                    <div className="text-right ml-4">
                                      <p className="text-lg font-bold text-blue-600">
                                        ¥{product.price.toLocaleString()}
                                      </p>
                                      {(product as any).variation_type && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                                          {(product as any).variation_name || (product as any).variation_type}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {product.category_id && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      カテゴリ: {product.category_id}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* ページネーション */}
                      <PresetProductPagination
                        pagination={pagination}
                        onPageChange={handlePageChange}
                      />
                    </>
                  )}
                </div>
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