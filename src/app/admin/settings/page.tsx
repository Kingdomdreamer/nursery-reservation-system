'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SimplePreset {
  id: number;
  preset_name: string;
  created_at: string;
}

interface SimpleProduct {
  id: number;
  name: string;
  price: number;
  category_id: number;
  visible: boolean;
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

export default function SettingsPage() {
  const [presets, setPresets] = useState<SimplePreset[]>([]);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
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

  // 検索結果をフィルタリング
  const filteredProducts = products.filter(product =>
    product.visible && 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 選択された商品の詳細を取得
  const selectedProductDetails = products.filter(product =>
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

      // 商品取得
      const productsResponse = await fetch('/api/admin/products');
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.data || []);
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

      if (response.ok) {
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
        loadData();
        alert('フォームが正常に作成されました！');
      } else {
        const errorData = await response.json();
        alert(`エラー: ${errorData.message || '作成に失敗しました'}`);
      }
    } catch (error) {
      console.error('フォーム作成エラー:', error);
      alert('作成中にエラーが発生しました');
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

  // 商品選択の切り替え
  const toggleProductSelection = (productId: number) => {
    if (formData.selected_products.includes(productId)) {
      removeProductFromSelection(productId);
    } else {
      addProductToSelection(productId);
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

  if (loading) {
    return (
      <AdminLayout title="フォーム管理" description="プリセットと商品を管理します">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="フォーム管理" description="簡単にフォームを作成・管理できます">
      <div className="space-y-8">
        {/* 統合フォーム作成 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">新しいフォーム作成</h3>
            
            <div className="space-y-6">
              {/* プリセット名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プリセット名 <span className="text-red-500">*</span>
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
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  商品選択 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {products.filter(p => p.visible).map((product) => (
                    <label key={product.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.selected_products.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="flex-1">
                        <span className="font-medium">{product.name}</span>
                        <span className="ml-2 text-sm text-gray-500">¥{product.price.toLocaleString()}</span>
                      </span>
                    </label>
                  ))}
                  {products.filter(p => p.visible).length === 0 && (
                    <p className="text-gray-500 text-center py-4">利用可能な商品がありません</p>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  選択済み: {formData.selected_products.length}個
                </p>
              </div>

              {/* フォーム設定 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  フォーム設定
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.form_settings.show_price}
                      onChange={() => toggleFormSetting('show_price')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span>価格を表示する</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.form_settings.require_phone}
                      onChange={() => toggleFormSetting('require_phone')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span>電話番号を必須にする</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.form_settings.require_furigana}
                      onChange={() => toggleFormSetting('require_furigana')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span>ふりがなを必須にする</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.form_settings.allow_note}
                      onChange={() => toggleFormSetting('allow_note')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span>備考欄を表示する</span>
                  </label>
                </div>
              </div>

              {/* 作成ボタン */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={createFormPreset}
                  disabled={isCreating || !formData.preset_name.trim() || formData.selected_products.length === 0}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? '作成中...' : 'フォームを作成'}
                </button>
                <button
                  onClick={() => setFormData({
                    preset_name: '',
                    selected_products: [],
                    form_settings: {
                      show_price: true,
                      require_phone: true,
                      require_furigana: false,
                      allow_note: true
                    }
                  })}
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
              {presets.length === 0 && (
                <p className="text-gray-500 text-center py-4">まだフォームが作成されていません</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}