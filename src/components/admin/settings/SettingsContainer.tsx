/**
 * 設定管理メインコンテナコンポーネント
 * プリセット管理の統合機能を提供
 */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { PresetFormEditor } from './PresetFormEditor';
import { PresetList } from './PresetList';
import { ProductSearch } from './ProductSearch';
import type { 
  SimplePreset, 
  EnhancedProduct, 
  FormCreationData,
  PresetProductDetail 
} from '@/types/admin';

interface SettingsContainerProps {
  onLogout: () => void;
}

export const SettingsContainer: React.FC<SettingsContainerProps> = ({ onLogout }) => {
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

  // 初回データ読み込み
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
        resetForm();
        
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

      // フォーム設定の更新
      const settingsResponse = await fetch(`/api/admin/form-settings/${editingPreset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.form_settings)
      });

      if (settingsResponse.ok) {
        // 編集完了
        cancelEdit();
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

  // フォームリセット
  const resetForm = () => {
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
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setIsEditing(false);
    setEditingPreset(null);
    setEditingPresetProducts([]);
    resetForm();
  };

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

  // 検索結果をフィルタリング
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">フォーム管理</h1>
          <p className="text-gray-600">新しいフォームを簡単に作成できます</p>
        </div>
        <Button variant="outline" onClick={onLogout}>
          ログアウト
        </Button>
      </div>

      {/* プリセットフォーム編集・作成 */}
      <PresetFormEditor
        formData={formData}
        isEditing={isEditing}
        isCreating={isCreating}
        editingPreset={editingPreset}
        selectedProductDetails={selectedProductDetails}
        onFormDataChange={setFormData}
        onToggleFormSetting={toggleFormSetting}
        onRemoveProduct={removeProductFromSelection}
        onCreatePreset={createFormPreset}
        onSaveEdit={saveEditPreset}
        onCancelEdit={cancelEdit}
        onReset={resetForm}
      />

      {/* 商品検索コンポーネント */}
      <ProductSearch
        searchQuery={searchQuery}
        showProductSearch={showProductSearch}
        filteredProducts={filteredProducts}
        onSearchChange={setSearchQuery}
        onSearchVisibilityChange={setShowProductSearch}
        onAddProduct={addProductToSelection}
      />

      {/* 既存プリセット一覧 */}
      <PresetList
        presets={presets}
        onEditPreset={startEditPreset}
        onDeletePreset={deletePreset}
      />
    </div>
  );
};