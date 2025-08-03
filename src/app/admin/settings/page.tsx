'use client';

import { useState, useEffect } from 'react';
import type { FormSettings, Product, PickupWindow, ProductPreset, ProductFilters, PaginationInfo } from '@/types';
import PresetModal from '@/components/admin/PresetModal';
import ProductModal from '@/components/admin/ProductModal';
import FormSettingsModalNew from '@/components/admin/FormSettingsModalNew';
import ProductListSelector from '@/components/admin/ProductListSelector';
import CSVImportModal from '@/components/admin/CSVImportModal';
import ProductVariationModal from '@/components/admin/ProductVariationModal';
import ProductSearch from '@/components/admin/ProductSearch';
import Pagination from '@/components/common/Pagination';
import ProductStats from '@/components/admin/ProductStats';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'presets' | 'products' | 'settings'>('presets');
  const [presets, setPresets] = useState<ProductPreset[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 商品検索・ページング状態
  const [productFilters, setProductFilters] = useState<ProductFilters>({
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [productsLoading, setProductsLoading] = useState(false);

  // モーダル状態管理
  const [presetModal, setPresetModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'duplicate';
    preset?: ProductPreset | null;
  }>({ isOpen: false, mode: 'create', preset: null });

  const [productModal, setProductModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    product?: Product | null;
  }>({ isOpen: false, mode: 'create', product: null });

  const [formSettingsModal, setFormSettingsModal] = useState<{
    isOpen: boolean;
    preset?: ProductPreset | null;
  }>({ isOpen: false, preset: null });

  const [productListSelector, setProductListSelector] = useState<{
    isOpen: boolean;
    preset?: ProductPreset | null;
  }>({ isOpen: false, preset: null });

  const [csvImportModal, setCsvImportModal] = useState<{
    isOpen: boolean;
    format: 'standard' | 'pos';
  }>({ isOpen: false, format: 'standard' });

  const [productVariationModal, setProductVariationModal] = useState<{
    isOpen: boolean;
  }>({ isOpen: false });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // プリセット取得
      const presetResponse = await fetch('/api/admin/presets');
      const presetResult = await presetResponse.json();
      
      if (presetResponse.ok) {
        setPresets(presetResult.data || []);
      } else {
        console.error('プリセット取得エラー:', presetResult.error);
      }

      // 商品取得（初回は検索なしで取得）
      await loadProducts();
      
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // モーダルハンドラー
  const handleOpenPresetModal = (mode: 'create' | 'edit' | 'duplicate', preset?: ProductPreset) => {
    setPresetModal({ isOpen: true, mode, preset: preset || null });
  };

  const handleClosePresetModal = () => {
    setPresetModal({ isOpen: false, mode: 'create', preset: null });
  };

  const handleOpenProductModal = (mode: 'create' | 'edit', product?: Product) => {
    setProductModal({ isOpen: true, mode, product: product || null });
  };

  const handleCloseProductModal = () => {
    setProductModal({ isOpen: false, mode: 'create', product: null });
  };

  const handleOpenFormSettingsModal = (preset: ProductPreset) => {
    setFormSettingsModal({ isOpen: true, preset });
  };

  const handleCloseFormSettingsModal = () => {
    setFormSettingsModal({ isOpen: false, preset: null });
  };

  const handleOpenProductListSelector = (preset: ProductPreset) => {
    setProductListSelector({ isOpen: true, preset });
  };

  const handleCloseProductListSelector = () => {
    setProductListSelector({ isOpen: false, preset: null });
  };

  const handleOpenCSVImportModal = () => {
    setCsvImportModal({ isOpen: true, format: 'standard' });
  };

  const handleOpenPOSCSVImportModal = () => {
    setCsvImportModal({ isOpen: true, format: 'pos' });
  };

  const handleCloseCSVImportModal = () => {
    setCsvImportModal({ isOpen: false, format: 'standard' });
  };

  const handleOpenProductVariationModal = () => {
    setProductVariationModal({ isOpen: true });
  };

  const handleCloseProductVariationModal = () => {
    setProductVariationModal({ isOpen: false });
  };

  const handleModalSave = () => {
    loadData(); // データを再読み込み
    // 商品タブがアクティブな場合は商品データも再読み込み
    if (activeTab === 'products') {
      loadProducts(productFilters, pagination.page);
    }
  };

  // 商品データ取得（検索・ページング対応）
  const loadProducts = async (filters: ProductFilters = productFilters, page: number = 1) => {
    setProductsLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.set('page', page.toString());
      searchParams.set('limit', '20');
      
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
        setProducts(result.data || []);
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

  // 商品タブがアクティブになったら商品データを読み込み
  useEffect(() => {
    if (activeTab === 'products') {
      loadProducts();
    }
  }, [activeTab]);

  const handleDeletePreset = async (preset: ProductPreset) => {
    if (!confirm(`プリセット「${preset.preset_name}」を削除しますか？\n※関連する設定も全て削除されます。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/presets/${preset.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '削除に失敗しました');
      }
      
      alert('プリセットを削除しました');
      loadData();
    } catch (error) {
      console.error('プリセット削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <AdminLayout 
      title="フォーム管理" 
      description="プリセット・商品・フォーム設定を管理します"
    >
        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'presets', label: 'プリセット管理' },
              { id: 'products', label: '商品管理' },
              { id: 'settings', label: 'フォーム設定' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">データを読み込み中...</p>
          </div>
        ) : (
          <>
            {/* プリセット管理 */}
            {activeTab === 'presets' && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">プリセット一覧</h2>
                    <button 
                      onClick={() => handleOpenPresetModal('create')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      新規作成
                    </button>
                  </div>
                  
                  {presets.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">プリセットがありません</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              プリセット名
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              作成日
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              アクション
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {presets.map((preset) => (
                            <tr key={preset.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {preset.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {preset.preset_name || '無題'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {preset.created_at 
                                  ? new Date(preset.created_at).toLocaleDateString('ja-JP')
                                  : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex flex-wrap gap-2">
                                  <a
                                    href={`/form/${preset.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-900 text-xs underline"
                                  >
                                    プレビュー
                                  </a>
                                  <button 
                                    onClick={() => handleOpenPresetModal('edit', preset)}
                                    className="text-green-600 hover:text-green-900 text-xs"
                                  >
                                    編集
                                  </button>
                                  <button 
                                    onClick={() => handleOpenPresetModal('duplicate', preset)}
                                    className="text-purple-600 hover:text-purple-900 text-xs"
                                  >
                                    複製
                                  </button>
                                  <button 
                                    onClick={() => handleOpenProductListSelector(preset)}
                                    className="text-orange-600 hover:text-orange-900 text-xs"
                                  >
                                    商品選択
                                  </button>
                                  <button 
                                    onClick={() => handleOpenFormSettingsModal(preset)}
                                    className="text-indigo-600 hover:text-indigo-900 text-xs"
                                  >
                                    設定
                                  </button>
                                  <button 
                                    onClick={() => handleDeletePreset(preset)}
                                    className="text-red-600 hover:text-red-900 text-xs"
                                  >
                                    削除
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 商品管理 */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                {/* 検索フィルター */}
                <ProductSearch
                  filters={productFilters}
                  onFiltersChange={setProductFilters}
                  onSearch={handleProductSearch}
                  onReset={handleProductSearchReset}
                  loading={productsLoading}
                />
                
                {/* 検索結果統計 */}
                <ProductStats
                  pagination={pagination}
                  filters={productFilters}
                  loading={productsLoading}
                />
                
                {/* 商品一覧 */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">商品一覧</h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {pagination.totalItems}件の商品が見つかりました
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <div className="relative group">
                          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center">
                            CSV一括追加
                            <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button 
                              onClick={handleOpenCSVImportModal}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              標準形式CSV
                            </button>
                            <button 
                              onClick={() => handleOpenPOSCSVImportModal()}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              POS形式CSV
                            </button>
                          </div>
                        </div>
                        <button 
                          onClick={handleOpenProductVariationModal}
                          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                        >
                          バリエーション商品作成
                        </button>
                        <button 
                          onClick={() => handleOpenProductModal('create')}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                          単一商品追加
                        </button>
                      </div>
                    </div>
                    
                    {productsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">商品を読み込み中...</p>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">検索条件に一致する商品がありません</p>
                      </div>
                    ) : (
                      <>
                        {/* 商品テーブル */}
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  商品名
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  価格
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  カテゴリ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  バリエーション
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  作成日
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  アクション
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.id}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    <div className="max-w-xs truncate" title={product.name}>
                                      {product.name}
                                    </div>
                                    {product.external_id && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        ID: {product.external_id}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ¥{product.price.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.category_id || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.variation_type ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {product.variation_name || product.variation_type}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">なし</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.created_at 
                                      ? new Date(product.created_at).toLocaleDateString('ja-JP')
                                      : '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => handleOpenProductModal('edit', product)}
                                        className="text-green-600 hover:text-green-900 text-xs"
                                      >
                                        編集
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* ページネーション */}
                        <div className="mt-6">
                          <Pagination
                            pagination={pagination}
                            onPageChange={handlePageChange}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* フォーム設定 */}
            {activeTab === 'settings' && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">フォーム設定</h2>
                  <p className="text-gray-600 mb-6">
                    各プリセットのフォーム設定を管理できます。設定を変更するプリセットを選択してください。
                  </p>
                  
                  {presets.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">設定可能なプリセットがありません</p>
                      <button 
                        onClick={() => handleOpenPresetModal('create')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        プリセットを作成
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {presets.map((preset) => (
                        <div key={preset.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h3 className="font-medium text-gray-900 mb-2">{preset.preset_name}</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            作成日: {preset.created_at 
                              ? new Date(preset.created_at).toLocaleDateString('ja-JP')
                              : '-'}
                          </p>
                          <div className="flex flex-col space-y-2">
                            <button 
                              onClick={() => handleOpenFormSettingsModal(preset)}
                              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                            >
                              フォーム設定
                            </button>
                            <a
                              href={`/form/${preset.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 text-center"
                            >
                              プレビュー
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

      {/* モーダル */}
      <PresetModal
        isOpen={presetModal.isOpen}
        onClose={handleClosePresetModal}
        onSave={handleModalSave}
        preset={presetModal.preset}
        mode={presetModal.mode}
      />

      <ProductModal
        isOpen={productModal.isOpen}
        onClose={handleCloseProductModal}
        onSave={handleModalSave}
        product={productModal.product}
        mode={productModal.mode}
      />

      {formSettingsModal.preset && (
        <FormSettingsModalNew
          isOpen={formSettingsModal.isOpen}
          onClose={handleCloseFormSettingsModal}
          onSave={handleModalSave}
          preset={formSettingsModal.preset}
        />
      )}

      {productListSelector.preset && (
        <ProductListSelector
          preset={productListSelector.preset}
          onSave={async (selectedProducts) => {
            try {
              const response = await fetch(`/api/admin/preset-products/${productListSelector.preset!.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: selectedProducts })
              });
              
              if (response.ok) {
                alert('商品リストを保存しました');
                handleModalSave();
                handleCloseProductListSelector();
              } else {
                throw new Error('保存に失敗しました');
              }
            } catch (error) {
              console.error('Save error:', error);
              alert('保存に失敗しました');
            }
          }}
          onClose={handleCloseProductListSelector}
        />
      )}

      <CSVImportModal
        isOpen={csvImportModal.isOpen}
        onClose={handleCloseCSVImportModal}
        onSuccess={handleModalSave}
        presets={presets}
        format={csvImportModal.format}
      />

      <ProductVariationModal
        isOpen={productVariationModal.isOpen}
        onClose={handleCloseProductVariationModal}
        onSave={handleModalSave}
      />
    </AdminLayout>
  );
}