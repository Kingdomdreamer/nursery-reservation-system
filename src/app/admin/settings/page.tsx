'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminAuthWrapper from '@/components/admin/AdminAuthWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface SimplePreset {
  id: number;
  preset_name: string;
  created_at: string;
}

interface EnhancedProduct {
  id: number;
  name: string;
  price: number;
  category_id: number;
  visible: boolean;
  base_product_name?: string;
  variation_name?: string;
  product_code?: string;
  display_name: string;
  status_label: string;
}

interface FormCreationData {
  preset_name: string;
  selected_products: number[];
  form_settings: {
    show_price: boolean;
    require_phone: boolean;
    require_furigana: boolean;
    allow_note: boolean;
  };
}

function SettingsContent({ onLogout }: { onLogout: () => void }) {
  const [presets, setPresets] = useState<SimplePreset[]>([]);
  const [allProducts, setAllProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // 統合フォーム作成データ
  const [formData, setFormData] = useState<FormCreationData>({
    preset_name: '',
    selected_products: [],
    form_settings: {
      show_price: true,
      require_phone: true,
      require_furigana: false,
      allow_note: true
    }
  });

  // 商品検索用の状態
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [includeHidden, setIncludeHidden] = useState(true); // 管理画面では非表示商品も表示

  // 検索結果をフィルタリング
  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.product_code && product.product_code.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch && !formData.selected_products.includes(product.id);
  });

  // 選択された商品の詳細を取得
  const selectedProductDetails = allProducts.filter(product =>
    formData.selected_products.includes(product.id)
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // プリセット取得
      const presetsResponse = await fetch('/api/admin/presets');
      if (presetsResponse.ok) {
        const presetsData = await presetsResponse.json();
        setPresets(presetsData.data || []);
      }

      // 全商品取得（非表示商品も含む）
      const productsResponse = await fetch('/api/admin/products/all?includeHidden=true');
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setAllProducts(productsData.data || []);
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 統合フォーム作成
  const createFormPreset = async () => {
    if (!formData.preset_name.trim() || formData.selected_products.length === 0) {
      alert('プリセット名と商品を選択してください');
      return;
    }
    
    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/presets/create-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // フォームリセット
        setFormData({
          preset_name: '',
          selected_products: [],
          form_settings: {
            show_price: true,
            require_phone: true,
            require_furigana: false,
            allow_note: true
          }
        });
        
        // データ再読み込み
        await loadData();
        
        alert(`フォームが正常に作成されました！\nプリセットID: ${result.data.preset_id}\nフォームURL: ${result.data.form_url}`);
      } else {
        throw new Error(result.error || '作成に失敗しました');
      }
    } catch (error) {
      console.error('フォーム作成エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '作成中にエラーが発生しました';
      alert(`エラー: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  // 商品を選択に追加
  const addProductToSelection = (productId: number) => {
    if (!formData.selected_products.includes(productId)) {
      setFormData(prev => ({
        ...prev,
        selected_products: [...prev.selected_products, productId]
      }));
    }
    setSearchQuery('');
    setShowProductSearch(false);
  };

  // 選択から商品を削除
  const removeProductFromSelection = (productId: number) => {
    setFormData(prev => ({
      ...prev,
      selected_products: prev.selected_products.filter(id => id !== productId)
    }));
  };

  // フォーム設定の切り替え
  const toggleFormSetting = (key: keyof FormCreationData['form_settings']) => {
    setFormData(prev => ({
      ...prev,
      form_settings: {
        ...prev.form_settings,
        [key]: !prev.form_settings[key]
      }
    }));
  };

  if (loading) {
    return (
      <AdminLayout title="フォーム管理" description="新しいフォームを簡単に作成できます" onLogout={onLogout}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <ErrorBoundary>
      <AdminLayout title="フォーム管理" description="新しいフォームを簡単に作成できます" onLogout={onLogout}>
        <div className="space-y-8">
          {/* 統合フォーム作成 */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">新しいフォーム作成</h3>
              
              <div className="space-y-6">
                {/* プリセット名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プリセット名
                  </label>
                  <input
                    type="text"
                    value={formData.preset_name}
                    onChange={(e) => setFormData(prev => ({...prev, preset_name: e.target.value}))}
                    placeholder="例: 野菜セット予約フォーム"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 商品選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品選択
                  </label>
                  
                  {/* 選択済み商品 */}
                  {selectedProductDetails.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {selectedProductDetails.map((product) => (
                        <div key={product.id} className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{product.display_name}</span>
                              <span className="text-sm text-gray-600">¥{product.price.toLocaleString()}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                product.visible 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.status_label}
                              </span>
                            </div>
                            {product.product_code && (
                              <div className="text-xs text-gray-500 mt-1">
                                商品コード: {product.product_code}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeProductFromSelection(product.id)}
                            className="text-red-600 hover:text-red-800 text-sm ml-2"
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 商品検索・追加 */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowProductSearch(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowProductSearch(searchQuery.length > 0)}
                      placeholder="商品名・商品コードで検索して追加..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {/* 検索結果ドロップダウン */}
                    {showProductSearch && filteredProducts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.slice(0, 20).map((product) => (
                          <button
                            key={product.id}
                            onClick={() => addProductToSelection(product.id)}
                            className="w-full text-left px-3 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{product.display_name}</span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    product.visible 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {product.status_label}
                                  </span>
                                </div>
                                {product.product_code && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    商品コード: {product.product_code}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-gray-600 ml-2">¥{product.price.toLocaleString()}</span>
                            </div>
                          </button>
                        ))}
                        {filteredProducts.length > 20 && (
                          <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50">
                            他 {filteredProducts.length - 20} 件...（検索条件を絞り込んでください）
                          </div>
                        )}
                      </div>
                    )}
                    
                    {showProductSearch && searchQuery.length > 0 && filteredProducts.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                        <p className="text-gray-500 text-sm">該当する商品が見つかりません</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-2">
                    💡 非表示の商品も選択可能です。選択後にフォームで表示されます。
                  </div>
                </div>

                {/* フォーム設定 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    フォーム設定
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.form_settings.show_price}
                        onChange={() => toggleFormSetting('show_price')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">価格を表示する</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.form_settings.require_phone}
                        onChange={() => toggleFormSetting('require_phone')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">電話番号を必須にする</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.form_settings.require_furigana}
                        onChange={() => toggleFormSetting('require_furigana')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">ふりがなを必須にする</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.form_settings.allow_note}
                        onChange={() => toggleFormSetting('allow_note')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">備考欄を表示する</span>
                    </label>
                  </div>
                </div>

                {/* 作成ボタン */}
                <div className="flex space-x-4">
                  <button
                    onClick={createFormPreset}
                    disabled={isCreating || !formData.preset_name.trim() || formData.selected_products.length === 0}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? '作成中...' : 'フォームを作成'}
                  </button>
                  <button
                    onClick={() => {
                      setFormData({
                        preset_name: '',
                        selected_products: [],
                        form_settings: {
                          show_price: true,
                          require_phone: true,
                          require_furigana: false,
                          allow_note: true
                        }
                      });
                      setSearchQuery('');
                      setShowProductSearch(false);
                    }}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
                  >
                    リセット
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 既存のプリセット一覧 */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">既存のフォーム</h3>
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div key={preset.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-md">
                    <div>
                      <span className="font-medium">{preset.preset_name}</span>
                      <span className="ml-2 text-sm text-gray-500">ID: {preset.id}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(preset.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ErrorBoundary>
  );
}

export default function SettingsPage() {
  return (
    <AdminAuthWrapper>
      {({ onLogout }: { onLogout: () => void }) => (
        <SettingsContent onLogout={onLogout} />
      )}
    </AdminAuthWrapper>
  );
}