'use client';

import { useState, useEffect } from 'react';
import type { FormSettings, Product, PickupWindow, ProductPreset } from '@/types';
import PresetModal from '@/components/admin/PresetModal';
import ProductModal from '@/components/admin/ProductModal';
import FormSettingsModal from '@/components/admin/FormSettingsModal';
import PresetProductsModal from '@/components/admin/PresetProductsModal';
import CSVImportModal from '@/components/admin/CSVImportModal';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'presets' | 'products' | 'settings'>('presets');
  const [presets, setPresets] = useState<ProductPreset[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

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

  const [presetProductsModal, setPresetProductsModal] = useState<{
    isOpen: boolean;
    preset?: ProductPreset | null;
  }>({ isOpen: false, preset: null });

  const [csvImportModal, setCsvImportModal] = useState<{
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

      // 商品取得
      const productResponse = await fetch('/api/admin/products');
      const productResult = await productResponse.json();
      
      if (productResponse.ok) {
        setProducts(productResult.data || []);
      } else {
        console.error('商品取得エラー:', productResult.error);
      }
      
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

  const handleOpenPresetProductsModal = (preset: ProductPreset) => {
    setPresetProductsModal({ isOpen: true, preset });
  };

  const handleClosePresetProductsModal = () => {
    setPresetProductsModal({ isOpen: false, preset: null });
  };

  const handleOpenCSVImportModal = () => {
    setCsvImportModal({ isOpen: true });
  };

  const handleCloseCSVImportModal = () => {
    setCsvImportModal({ isOpen: false });
  };

  const handleModalSave = () => {
    loadData(); // データを再読み込み
  };

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
                                    onClick={() => handleOpenPresetProductsModal(preset)}
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
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">商品一覧</h2>
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleOpenCSVImportModal}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      >
                        CSV一括追加
                      </button>
                      <button 
                        onClick={() => handleOpenProductModal('create')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        商品追加
                      </button>
                    </div>
                  </div>
                  
                  {products.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">商品がありません</p>
                  ) : (
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
                              アクション
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {products.map((product) => (
                            <tr key={product.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {product.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {product.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ¥{product.price.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {product.category_id || '-'}
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
                  )}
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
        <FormSettingsModal
          isOpen={formSettingsModal.isOpen}
          onClose={handleCloseFormSettingsModal}
          onSave={handleModalSave}
          preset={formSettingsModal.preset}
        />
      )}

      {presetProductsModal.preset && (
        <PresetProductsModal
          isOpen={presetProductsModal.isOpen}
          onClose={handleClosePresetProductsModal}
          onSave={handleModalSave}
          preset={presetProductsModal.preset}
        />
      )}

      <CSVImportModal
        isOpen={csvImportModal.isOpen}
        onClose={handleCloseCSVImportModal}
        onSuccess={handleModalSave}
        presets={presets}
      />
    </AdminLayout>
  );
}