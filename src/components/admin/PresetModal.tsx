'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ProductPreset } from '@/types';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  preset?: ProductPreset | null;
  mode: 'create' | 'edit' | 'duplicate';
}

export default function PresetModal({
  isOpen,
  onClose,
  onSave,
  preset,
  mode
}: PresetModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    preset_name: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (preset && (mode === 'edit' || mode === 'duplicate')) {
      setFormData({
        preset_name: mode === 'duplicate' ? `${preset.preset_name}のコピー` : preset.preset_name
      });
    } else {
      setFormData({ preset_name: '' });
    }
    setErrors({});
  }, [preset, mode, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.preset_name.trim()) {
      newErrors.preset_name = 'プリセット名は必須です';
    } else if (formData.preset_name.length > 100) {
      newErrors.preset_name = 'プリセット名は100文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === 'create' || mode === 'duplicate') {
        // 新規作成または複製
        const { data: newPreset, error } = await supabase
          .from('product_presets')
          .insert({
            preset_name: formData.preset_name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        // 複製の場合、元のプリセットの設定をコピー
        if (mode === 'duplicate' && preset) {
          await duplicatePresetSettings(preset.id, (newPreset as any).id);
        } else {
          // 新規作成の場合、デフォルト設定を作成
          await createDefaultFormSettings((newPreset as any).id);
        }
        
        alert('プリセットを作成しました');
      } else if (mode === 'edit' && preset) {
        // 編集
        const { error } = await supabase
          .from('product_presets')
          .update({
            preset_name: formData.preset_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', preset.id);

        if (error) throw error;
        alert('プリセットを更新しました');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('プリセット保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const duplicatePresetSettings = async (sourceId: number, targetId: number) => {
    // フォーム設定をコピー
    const { data: formSettings } = await supabase
      .from('form_settings')
      .select('*')
      .eq('preset_id', sourceId)
      .single();

    if (formSettings) {
      const { id, preset_id, created_at, updated_at, ...settingsData } = formSettings;
      await supabase
        .from('form_settings')
        .insert({
          ...settingsData,
          preset_id: targetId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    // 引き取り期間設定をコピー
    const { data: pickupWindows } = await supabase
      .from('pickup_windows')
      .select('*')
      .eq('preset_id', sourceId);

    if (pickupWindows && pickupWindows.length > 0) {
      const newWindows = pickupWindows.map(window => {
        const { id, preset_id, created_at, updated_at, ...windowData } = window;
        return {
          ...windowData,
          preset_id: targetId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      await supabase
        .from('pickup_windows')
        .insert(newWindows);
    }
  };

  const createDefaultFormSettings = async (presetId: number) => {
    await supabase
      .from('form_settings')
      .insert({
        preset_id: presetId,
        show_price: true,
        require_address: false,
        enable_gender: false,
        enable_birthday: false,
        enable_furigana: true,
        is_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return '新しいプリセットを作成';
      case 'edit': return 'プリセットを編集';
      case 'duplicate': return 'プリセットを複製';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {getModalTitle()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プリセット名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.preset_name}
              onChange={(e) => setFormData({ ...formData, preset_name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.preset_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="例: 春の野菜セット予約"
              disabled={loading}
            />
            {errors.preset_name && (
              <p className="mt-1 text-sm text-red-600">{errors.preset_name}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">作成後の設定について</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• プリセット作成後、フォーム設定タブで詳細設定を行えます</li>
              <li>• デフォルトでふりがな入力と価格表示が有効になります</li>
              <li>• プレビュー機能で実際のフォームを確認できます</li>
            </ul>
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
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}