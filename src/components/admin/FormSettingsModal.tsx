'use client';

import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { FormSettings, ProductPreset } from '@/types';

interface FormSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  preset: ProductPreset;
}

export default function FormSettingsModal({
  isOpen,
  onClose,
  onSave,
  preset
}: FormSettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    show_price: true,
    require_address: false,
    enable_gender: false,
    enable_birthday: false,
    enable_furigana: true,
    pickup_start: '',
    pickup_end: '',
    valid_until: '',
    is_enabled: true
  });
  const [existingSettings, setExistingSettings] = useState<FormSettings | null>(null);

  useEffect(() => {
    if (isOpen && preset) {
      loadFormSettings();
    }
  }, [isOpen, preset]);

  if (!isOpen) return null;

  const loadFormSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseAdmin
        .from('form_settings')
        .select('*')
        .eq('preset_id', preset.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (data) {
        const formSettings = data as any;
        setExistingSettings(formSettings);
        setFormData({
          show_price: formSettings.show_price,
          require_address: formSettings.require_address,
          enable_gender: formSettings.enable_gender,
          enable_birthday: formSettings.enable_birthday,
          enable_furigana: formSettings.enable_furigana,
          pickup_start: formSettings.pickup_start ? formSettings.pickup_start.split('T')[0] : '',
          pickup_end: formSettings.pickup_end ? formSettings.pickup_end.split('T')[0] : '',
          valid_until: formSettings.valid_until ? formSettings.valid_until.split('T')[0] : '',
          is_enabled: formSettings.is_enabled
        });
      }
    } catch (error) {
      console.error('フォーム設定の読み込みエラー:', error);
      alert('設定の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const settingsData = {
        preset_id: preset.id,
        show_price: formData.show_price,
        require_address: formData.require_address,
        enable_gender: formData.enable_gender,
        enable_birthday: formData.enable_birthday,
        enable_furigana: formData.enable_furigana,
        pickup_start: formData.pickup_start ? new Date(formData.pickup_start).toISOString() : null,
        pickup_end: formData.pickup_end ? new Date(formData.pickup_end).toISOString() : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        is_enabled: formData.is_enabled,
        updated_at: new Date().toISOString()
      };

      if (existingSettings) {
        // 更新
        const { error } = await supabaseAdmin
          .from('form_settings')
          .update(settingsData)
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        // 新規作成
        const { error } = await supabaseAdmin
          .from('form_settings')
          .insert({
            ...settingsData,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      alert('フォーム設定を保存しました');
      onSave();
      onClose();
    } catch (error) {
      console.error('フォーム設定保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleBooleanChange = (field: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: string, value: string) => {
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">表示項目設定</h3>
            
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
                    onChange={(e) => handleBooleanChange('show_price', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-600">有効</span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">ふりがな入力</label>
                  <p className="text-xs text-gray-500">顧客名のふりがなを入力させます</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.enable_furigana}
                    onChange={(e) => handleBooleanChange('enable_furigana', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-600">有効</span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">住所入力（必須）</label>
                  <p className="text-xs text-gray-500">配送用住所を必須で入力させます</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.require_address}
                    onChange={(e) => handleBooleanChange('require_address', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-600">有効</span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">性別入力</label>
                  <p className="text-xs text-gray-500">性別を選択させます</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.enable_gender}
                    onChange={(e) => handleBooleanChange('enable_gender', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-600">有効</span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">生年月日入力</label>
                  <p className="text-xs text-gray-500">生年月日を入力させます</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.enable_birthday}
                    onChange={(e) => handleBooleanChange('enable_birthday', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-600">有効</span>
                </label>
              </div>
            </div>
          </div>

          {/* 期間設定 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">期間設定</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  引き取り期間開始日
                </label>
                <input
                  type="date"
                  value={formData.pickup_start}
                  onChange={(e) => handleDateChange('pickup_start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  引き取り期間終了日
                </label>
                <input
                  type="date"
                  value={formData.pickup_end}
                  onChange={(e) => handleDateChange('pickup_end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  フォーム有効期限
                </label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => handleDateChange('valid_until', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  この日時以降、フォームは表示されません（空白の場合は無期限）
                </p>
              </div>
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
                  onChange={(e) => handleBooleanChange('is_enabled', e.target.checked)}
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
            <a
              href={`/form/${preset.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              {window.location.origin}/form/{preset.id}
            </a>
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