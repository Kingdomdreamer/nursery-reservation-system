'use client';

import { useState, useEffect } from 'react';
import type { ProductPreset } from '@/types';

interface FormSettingsData {
  show_price: boolean;
  require_phone: boolean;
  require_furigana: boolean;
  allow_note: boolean;
  is_enabled: boolean;
  custom_message: string;
}

interface FormSettingsModalNewProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  preset: ProductPreset;
}

export default function FormSettingsModalNew({
  isOpen,
  onClose,
  onSave,
  preset
}: FormSettingsModalNewProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormSettingsData>({
    show_price: true,
    require_phone: true,
    require_furigana: true,
    allow_note: true,
    is_enabled: true,
    custom_message: ''
  });
  const [existingSettingsId, setExistingSettingsId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && preset) {
      loadFormSettings();
    }
  }, [isOpen, preset]);

  if (!isOpen) return null;

  const loadFormSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/form-settings/${preset.id}`);
      
      if (response.status === 404) {
        // 設定が存在しない場合はデフォルト値のまま
        setExistingSettingsId(null);
        return;
      }
      
      if (!response.ok) {
        throw new Error('設定の読み込みに失敗しました');
      }

      const result = await response.json();
      
      if (result.data) {
        const settings = result.data;
        setExistingSettingsId(settings.id);
        setFormData({
          show_price: Boolean(settings.show_price),
          require_phone: Boolean(settings.require_phone),
          require_furigana: Boolean(settings.require_furigana),
          allow_note: Boolean(settings.allow_note),
          is_enabled: Boolean(settings.is_enabled),
          custom_message: settings.custom_message || ''
        });
      }
    } catch (error) {
      console.error('フォーム設定の読み込みエラー:', error);
      const errorMessage = error instanceof Error ? error.message : '設定の読み込みに失敗しました';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // APIに送信するデータ（新しいスキーマのフィールドのみ）
      const apiData = {
        preset_id: preset.id,
        show_price: formData.show_price,
        require_phone: formData.require_phone,
        require_furigana: formData.require_furigana,
        allow_note: formData.allow_note,
        is_enabled: formData.is_enabled,
        custom_message: formData.custom_message || null
      };

      const method = existingSettingsId ? 'PUT' : 'POST';
      const url = existingSettingsId 
        ? `/api/admin/form-settings/${existingSettingsId}`
        : '/api/admin/form-settings';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });

      if (!response.ok) {
        let errorMessage = '保存に失敗しました';
        try {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          
          // Try to parse as JSON first
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If not JSON, use the raw text
            errorMessage = errorText || errorMessage;
          }
        } catch {
          // Fallback error message
          errorMessage = `HTTP ${response.status}: 保存に失敗しました`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Save success:', result);

      alert('フォーム設定を保存しました');
      onSave();
      onClose();
    } catch (error) {
      console.error('フォーム設定保存エラー:', error);
      alert(`保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof FormSettingsData, value: boolean | string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            フォーム設定 - {preset.preset_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 表示項目設定 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">フォーム項目設定</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">価格表示</label>
                  <p className="text-xs text-gray-500">商品の価格を表示します</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.show_price}
                    onChange={(e) => updateFormData('show_price', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-600">有効</span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">電話番号入力（必須）</label>
                  <p className="text-xs text-gray-500">顧客の電話番号を必須で入力させます</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.require_phone}
                    onChange={(e) => updateFormData('require_phone', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-600">有効</span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">ふりがな入力（必須）</label>
                  <p className="text-xs text-gray-500">顧客名のふりがなを必須で入力させます</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.require_furigana}
                    onChange={(e) => updateFormData('require_furigana', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-600">有効</span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">備考欄</label>
                  <p className="text-xs text-gray-500">顧客が備考やリクエストを入力できます</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allow_note}
                    onChange={(e) => updateFormData('allow_note', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-600">有効</span>
                </label>
              </div>
            </div>
          </div>

          {/* カスタムメッセージ設定 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">カスタムメッセージ</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                フォーム上部に表示するメッセージ
              </label>
              <textarea
                value={formData.custom_message}
                onChange={(e) => updateFormData('custom_message', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：ご注文ありがとうございます。引き取り日時をご確認ください。"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                空白の場合は表示されません
              </p>
            </div>
          </div>

          {/* フォーム状態 */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">フォーム状態</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">フォーム公開状態</label>
                <p className="text-xs text-gray-500">
                  {formData.is_enabled ? 
                    'フォームは現在公開中です' : 
                    'フォームは現在非公開です（アクセスできません）'
                  }
                </p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_enabled}
                  onChange={(e) => updateFormData('is_enabled', e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-600">公開</span>
              </label>
            </div>
          </div>

          {/* プレビューリンク */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">プレビュー</h4>
            <p className="text-sm text-yellow-700 mb-2">
              設定を保存後、以下のリンクでフォームの動作を確認できます
            </p>
            <span className="text-blue-600 text-sm">
              {typeof window !== 'undefined' ? `${window.location.origin}/form/${preset.id}` : `/form/${preset.id}`}
            </span>
          </div>
        </div>

        <div className="flex justify-end items-center p-6 border-t bg-gray-50 space-x-2">
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
            {loading ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </div>
    </div>
  );
}