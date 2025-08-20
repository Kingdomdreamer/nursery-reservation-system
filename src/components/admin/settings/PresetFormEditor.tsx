/**
 * プリセットフォーム編集・作成コンポーネント
 */
'use client';

import React from 'react';
import { Button } from '@/components/ui';
import type { FormCreationData, SimplePreset, EnhancedProduct } from '@/types/admin';

interface PresetFormEditorProps {
  formData: FormCreationData;
  isEditing: boolean;
  isCreating: boolean;
  editingPreset: SimplePreset | null;
  selectedProductDetails: EnhancedProduct[];
  onFormDataChange: (data: FormCreationData) => void;
  onToggleFormSetting: (key: keyof FormCreationData['form_settings']) => void;
  onRemoveProduct: (productId: number) => void;
  onCreatePreset: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onReset: () => void;
}

export const PresetFormEditor: React.FC<PresetFormEditorProps> = ({
  formData,
  isEditing,
  isCreating,
  editingPreset,
  selectedProductDetails,
  onFormDataChange,
  onToggleFormSetting,
  onRemoveProduct,
  onCreatePreset,
  onSaveEdit,
  onCancelEdit,
  onReset
}) => {
  const updatePresetName = (preset_name: string) => {
    onFormDataChange({ ...formData, preset_name });
  };

  return (
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
              onChange={(e) => updatePresetName(e.target.value)}
              placeholder="例: 野菜セット予約フォーム"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 商品選択セクション */}
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
                      onClick={() => onRemoveProduct(product.id)}
                      className="text-red-600 hover:text-red-800 text-sm ml-2 px-2 py-1 rounded hover:bg-red-50"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}
            
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
                  onChange={() => onToggleFormSetting('show_price')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">価格を表示する</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.form_settings.require_phone}
                  onChange={() => onToggleFormSetting('require_phone')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">電話番号を必須にする</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.form_settings.require_furigana}
                  onChange={() => onToggleFormSetting('require_furigana')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">ふりがなを必須にする</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.form_settings.allow_note}
                  onChange={() => onToggleFormSetting('allow_note')}
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
                <Button
                  onClick={onSaveEdit}
                  disabled={isCreating || !formData.preset_name.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCreating ? '更新中...' : 'フォームを更新'}
                </Button>
                <Button
                  onClick={onCancelEdit}
                  variant="outline"
                >
                  編集をキャンセル
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={onCreatePreset}
                  disabled={isCreating || !formData.preset_name.trim() || formData.selected_products.length === 0}
                >
                  {isCreating ? '作成中...' : 'フォームを作成'}
                </Button>
                <Button
                  onClick={onReset}
                  variant="outline"
                >
                  リセット
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};