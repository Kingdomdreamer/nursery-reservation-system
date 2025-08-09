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
  display_name: string;
  price: number;
  product_code?: string;
  base_product_name?: string;
  variation_name?: string;
  category_id: number;
  visible: boolean;
  
  // 表示・検索用の追加フィールド
  search_text: string;
  price_display: string;
  status_badges: string[];
  status_label: string;
  product_code_display: string;
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

interface PresetProductDetail {
  id: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    price: number;
    category_id?: number;
    visible: boolean;
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

  // 編集用の状態
  const [editingPreset, setEditingPreset] = useState<SimplePreset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPresetProducts, setEditingPresetProducts] = useState<PresetProductDetail[]>([]);

  // 商品検索用の状態
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [includeHidden, setIncludeHidden] = useState(true); // 管理画面では非表示商品も表示

  // 検索結果をフィルタリング（最適化された検索ロジック）
  const filteredProducts = allProducts.filter(product => {
    // 既に選択済みの商品は除外
    if (formData.selected_products.includes(product.id)) {
      return false;
    }
    
    // 検索クエリが空の場合は除外
    if (!searchQuery.trim()) {
      return false;
    }
    
    // 統合検索テキストから検索
    return product.search_text.includes(searchQuery.toLowerCase());
  });

  // 選択された商品の詳細を取得
  const selectedProductDetails = isEditing 
    ? editingPresetProducts.map(presetProduct => ({
        id: presetProduct.product.id,
        name: presetProduct.product.name,
        display_name: presetProduct.product.name,
        price: presetProduct.product.price,
        product_code: '',
        base_product_name: '',
        variation_name: '',
        category_id: presetProduct.product.category_id || 0,
        visible: presetProduct.product.visible,
        search_text: presetProduct.product.name.toLowerCase(),
        price_display: `¥${presetProduct.product.price.toLocaleString()}`,
        status_badges: presetProduct.product.visible ? [] : ['非表示'],
        status_label: presetProduct.product.visible ? '表示' : '非表示',
        product_code_display: ''
      }))
    : allProducts.filter(product => formData.selected_products.includes(product.id));

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
    // 編集中の場合はプリセット商品詳細からも削除
    if (isEditing) {
      setEditingPresetProducts(prev => 
        prev.filter(presetProduct => presetProduct.product_id !== productId)
      );
    }
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

  // プリセット編集開始
  const startEditPreset = async (preset: SimplePreset) => {
    try {
      const response = await fetch(`/api/admin/presets/${preset.id}`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        setEditingPreset(preset);
        setFormData({
          preset_name: result.data.preset.preset_name,
          selected_products: result.data.selected_products || [],
          form_settings: result.data.form_settings || {
            show_price: true,
            require_phone: true,
            require_furigana: false,
            allow_note: true
          }
        });
        // プリセット商品詳細も保存
        setEditingPresetProducts(result.data.preset_products || []);
        setIsEditing(true);
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      console.error('プリセット詳細取得エラー:', error);
      alert('プリセットの詳細取得に失敗しました');
    }
  };

  // プリセット編集保存
  const saveEditPreset = async () => {
    if (!editingPreset || !formData.preset_name.trim()) {
      alert('プリセット名を入力してください');
      return;
    }
    
    setIsCreating(true);
    try {
      // プリセット名と選択商品の更新
      const presetResponse = await fetch(`/api/admin/presets/${editingPreset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          preset_name: formData.preset_name,
          selected_products: formData.selected_products
        })
      });

      if (!presetResponse.ok) {
        throw new Error('プリセット名の更新に失敗しました');
      }

      // フォーム設定の更新 (preset_idを使用)
      const settingsResponse = await fetch(`/api/admin/form-settings/${editingPreset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.form_settings)
      });

      if (settingsResponse.ok) {
        // 編集完了
        setIsEditing(false);
        setEditingPreset(null);
        setEditingPresetProducts([]);
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
        
        await loadData();
        alert('フォームが正常に更新されました');
      }
    } catch (error) {
      console.error('フォーム更新エラー:', error);
      alert(`エラー: ${error instanceof Error ? error.message : '更新に失敗しました'}`);
    } finally {
      setIsCreating(false);
    }
  };

  // プリセット削除
  const deletePreset = async (preset: SimplePreset) => {
    if (!confirm(`「${preset.preset_name}」を削除してもよろしいですか？\nこの操作は取り消せません。`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/presets/${preset.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        await loadData();
        alert('フォームが削除されました');
      } else {
        throw new Error(result.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('プリセット削除エラー:', error);
      alert(`エラー: ${error instanceof Error ? error.message : '削除に失敗しました'}`);
    }
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setIsEditing(false);
    setEditingPreset(null);
    setEditingPresetProducts([]);
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
  };

  // フォームURLの生成
  const getFormUrl = (presetId: number) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/form/${presetId}`;
    }
    return `/form/${presetId}`;
  };

  // URLをクリップボードにコピー
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      alert('URLをクリップボードにコピーしました');
    }).catch(err => {
      console.error('コピー失敗:', err);
      alert('URLのコピーに失敗しました');
    });
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
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                {isEditing ? `フォーム編集: ${editingPreset?.preset_name}` : '新しいフォーム作成'}
              </h3>
              
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
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-green-500">✅</span>
                              <span className="font-medium">{product.display_name}</span>
                              <span className="text-sm font-semibold text-gray-900">{product.price_display}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>商品コード: {product.product_code_display}</span>
                              
                              {/* ステータスバッジ */}
                              {product.status_badges.map((badge, index) => (
                                <span 
                                  key={index}
                                  className={`px-2 py-1 rounded text-xs ${
                                    badge === '非表示' ? 'bg-red-100 text-red-800' :
                                    badge === 'サービス品' ? 'bg-yellow-100 text-yellow-800' :
                                    badge === 'バリエーション' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => removeProductFromSelection(product.id)}
                            className="text-red-600 hover:text-red-800 text-sm ml-2 px-2 py-1 rounded hover:bg-red-50"
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
                      placeholder="🔍 商品名・商品コードで検索..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {/* 検索結果ドロップダウン */}
                    {showProductSearch && filteredProducts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.slice(0, 20).map((product) => (
                          <button
                            key={product.id}
                            onClick={() => addProductToSelection(product.id)}
                            className="w-full text-left px-3 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium">{product.display_name}</span>
                                  <span className="text-sm font-semibold text-gray-900">{product.price_display}</span>
                                </div>
                                
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <span>商品コード: {product.product_code_display}</span>
                                  
                                  {/* ステータスバッジ */}
                                  {product.status_badges.map((badge, index) => (
                                    <span 
                                      key={index}
                                      className={`px-1.5 py-0.5 rounded text-xs ${
                                        badge === '非表示' ? 'bg-red-100 text-red-800' :
                                        badge === 'サービス品' ? 'bg-yellow-100 text-yellow-800' :
                                        badge === 'バリエーション' ? 'bg-purple-100 text-purple-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {badge}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                        {filteredProducts.length > 20 && (
                          <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-t">
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

                {/* 作成・編集ボタン */}
                <div className="flex space-x-4">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEditPreset}
                        disabled={isCreating || !formData.preset_name.trim()}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreating ? '更新中...' : 'フォームを更新'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
                      >
                        編集をキャンセル
                      </button>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 既存のプリセット一覧 */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">既存のフォーム ({presets.length}件)</h3>
              <div className="space-y-4">
                {presets.map((preset) => (
                  <div key={preset.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-lg">{preset.preset_name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>ID: {preset.id}</span>
                          <span>作成: {new Date(preset.created_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditPreset(preset)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => deletePreset(preset)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                    
                    {/* フォームURL表示 */}
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 mb-1">フォームURL:</p>
                          <div className="flex items-center space-x-2">
                            <code className="text-sm bg-white border border-gray-300 rounded px-2 py-1 text-blue-600 flex-1 overflow-hidden">
                              {getFormUrl(preset.id)}
                            </code>
                            <button
                              onClick={() => copyToClipboard(getFormUrl(preset.id))}
                              className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 whitespace-nowrap"
                            >
                              📋 コピー
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-3">
                        <a
                          href={`/admin/preview/${preset.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                        >
                          👀 プレビュー
                        </a>
                        <a
                          href={getFormUrl(preset.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          🔗 フォームを開く
                        </a>
                        <a
                          href={`/admin/reservations?preset_id=${preset.id}`}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                        >
                          📊 予約一覧
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
                
                {presets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>まだフォームが作成されていません</p>
                    <p className="text-sm mt-1">上の「新しいフォーム作成」から作成してください</p>
                  </div>
                )}
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