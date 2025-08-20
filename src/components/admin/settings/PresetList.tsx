/**
 * プリセット一覧表示コンポーネント
 */
'use client';

import React from 'react';
import { Button } from '@/components/ui';
import type { SimplePreset } from '@/types/admin';

interface PresetListProps {
  presets: SimplePreset[];
  onEditPreset: (preset: SimplePreset) => void;
  onDeletePreset: (preset: SimplePreset) => void;
}

export const PresetList: React.FC<PresetListProps> = ({
  presets,
  onEditPreset,
  onDeletePreset
}) => {
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

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          既存のフォーム ({presets.length}件)
        </h3>
        
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
                  <Button
                    size="sm"
                    onClick={() => onEditPreset(preset)}
                  >
                    編集
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeletePreset(preset)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    削除
                  </Button>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(getFormUrl(preset.id))}
                        className="text-green-600 border-green-300 hover:bg-green-50 whitespace-nowrap"
                      >
                        📋 コピー
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-3">
                  <a
                    href={`/admin/preview/${preset.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                  >
                    👀 プレビュー
                  </a>
                  <a
                    href={getFormUrl(preset.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    🔗 フォームを開く
                  </a>
                  <a
                    href={`/admin/reservations?preset_id=${preset.id}`}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
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
  );
};