'use client';

import { useState } from 'react';
import type { ProductPreset } from '@/types';

interface CSVImportError {
  row: number;
  field?: string;
  message: string;
  data: any;
}

interface CSVImportResult {
  success: number;
  total: number;
  errors: CSVImportError[];
  warnings: string[];
  insertedProducts: any[];
}

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  presets: ProductPreset[];
  format?: 'standard' | 'pos';
}

export default function CSVImportModal({
  isOpen,
  onClose,
  onSuccess,
  presets,
  format = 'standard'
}: CSVImportModalProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      alert('CSVファイルのみアップロード可能です');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('ファイルサイズは10MB以下にしてください');
      return;
    }

    setFile(selectedFile);
    setImportResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleImport = async () => {
    if (!file) {
      alert('CSVファイルを選択してください');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedPresetId) {
        formData.append('preset_id', selectedPresetId);
      }

      const endpoint = format === 'pos' ? '/api/admin/products/import-pos' : '/api/admin/products/import';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '読み込みに失敗しました');
      }

      setImportResult(result);

      if (result.success > 0) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }

    } catch (error) {
      console.error('CSVインポートエラー:', error);
      alert('読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const endpoint = format === 'pos' ? '/api/admin/products/import-pos' : '/api/admin/products/import';
      const response = await fetch(endpoint);
      const csvContent = await response.text();
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = format === 'pos' ? 'pos_products_template.csv' : 'product_template.csv';
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('テンプレートダウンロードエラー:', error);
      alert('テンプレートのダウンロードに失敗しました');
    }
  };

  const handleClose = () => {
    setFile(null);
    setSelectedPresetId('');
    setImportResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {format === 'pos' ? 'POS形式' : '標準形式'}CSV商品一括インポート
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {format === 'pos' ? 'POS形式の' : '標準形式の'}CSVファイルから商品を一括で追加できます
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {!importResult ? (
            <>
              {/* テンプレートダウンロード */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">CSVテンプレート</h3>
                    <p className="text-sm text-blue-700">
                      正しい形式のサンプルファイルをダウンロードできます
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    テンプレートダウンロード
                  </button>
                </div>
              </div>

              {/* プリセット選択 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  関連付けるプリセット（任意）
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">プリセットを選択（任意）</option>
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.preset_name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  選択すると、インポートした商品が自動的にプリセットに関連付けられます
                </p>
              </div>

              {/* ファイルアップロード */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSVファイルを選択
                </label>
                
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragOver
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {file ? (
                    <div className="space-y-2">
                      <div className="text-green-600">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                      <button
                        onClick={() => setFile(null)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        ファイルを削除
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">
                        CSVファイルをドラッグ&ドロップ または
                      </p>
                      <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer">
                        ファイルを選択
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={loading}
                        />
                      </label>
                      <p className="text-xs text-gray-500">
                        CSV形式、最大10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* CSVフォーマット説明 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">{format === 'pos' ? 'POS形式' : '標準形式'}CSVフォーマット</h4>
                {format === 'pos' ? (
                  <>
                    <div className="text-xs text-gray-600 font-mono bg-white p-3 rounded border overflow-x-auto">
                      カテゴリーID,商品名,税設定,適用税率,価格設定,価格,バリエーション（種別1）,商品コード,バーコード...<br/>
                      1,種粕 20kg,外税,標準税率,通常,1800,通常価格,#2000000000619,#2000000000619<br/>
                      1,種粕 20kg,外税,標準税率,通常,1700,売出価格,#2000000000077,#2000000000077
                    </div>
                    <ul className="text-xs text-gray-600 mt-2 space-y-1">
                      <li>• <strong>カテゴリーID</strong>: 商品カテゴリー（必須、正の整数）</li>
                      <li>• <strong>商品名</strong>: 商品名（必須、49文字以内）</li>
                      <li>• <strong>税設定</strong>: 外税/内税（任意、デフォルト：外税）</li>
                      <li>• <strong>適用税率</strong>: 標準税率/軽減税率/非課税（任意）</li>
                      <li>• <strong>価格設定</strong>: 通常/部門打ち/量り売り（任意）</li>
                      <li>• <strong>価格</strong>: 価格（必須、0以上の整数）</li>
                      <li>• <strong>バリエーション（種別1）</strong>: 価格バリエーション名</li>
                      <li>• その他多数のPOSシステム連携フィールドに対応</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-gray-600 font-mono bg-white p-3 rounded border">
                      name,external_id,category_id,price,variation,comment,base_name<br/>
                      野菜セットA,VEG001,1,1000,,春の野菜を詰め合わせ,<br/>
                      果物セット（小サイズ）,FRUIT001,2,1500,小サイズ,季節の果物3種類,果物セット<br/>
                      果物セット（大サイズ）,FRUIT002,2,2500,大サイズ,季節の果物5種類,果物セット
                    </div>
                    <ul className="text-xs text-gray-600 mt-2 space-y-1">
                      <li>• <strong>name</strong>: 商品名（必須、100文字以内）</li>
                      <li>• <strong>external_id</strong>: 外部システムID（任意、50文字以内）</li>
                      <li>• <strong>category_id</strong>: カテゴリID（任意、正の整数）</li>
                      <li>• <strong>price</strong>: 価格（必須、0以上の整数）</li>
                      <li>• <strong>variation</strong>: バリエーション名（任意）</li>
                      <li>• <strong>comment</strong>: 商品説明（任意）</li>
                      <li>• <strong>base_name</strong>: 基本商品名（バリエーション商品用、任意）</li>
                    </ul>
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <h5 className="text-xs font-medium text-blue-800 mb-1">バリエーション商品の作成方法</h5>
                      <p className="text-xs text-blue-700">
                        <strong>base_name</strong>と<strong>variation</strong>を指定すると、「base_name（variation）」の形式で商品名が生成されます。<br/>
                        例：base_name=「果物セット」、variation=「小サイズ」→ 商品名=「果物セット（小サイズ）」
                      </p>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            /* インポート結果表示 */
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  インポート完了
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">成功:</span>
                    <span className="font-bold ml-2">{importResult.success}件</span>
                  </div>
                  <div>
                    <span className="text-gray-700">総数:</span>
                    <span className="font-bold ml-2">{importResult.total}件</span>
                  </div>
                </div>
              </div>

              {/* 警告メッセージ */}
              {importResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">注意事項</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* エラー一覧 */}
              {importResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    エラー ({importResult.errors.length}件)
                  </h4>
                  <div className="max-h-40 overflow-y-auto">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-sm text-red-700 border-b border-red-100 py-1">
                        <strong>行{error.row}:</strong> {error.message}
                        {error.field && <span className="text-red-600"> ({error.field})</span>}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p className="text-sm text-red-600 pt-2">
                        他{importResult.errors.length - 10}件のエラーがあります
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end items-center p-6 border-t bg-gray-50 space-x-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50"
          >
            {importResult ? '閉じる' : 'キャンセル'}
          </button>
          
          {!importResult && (
            <button
              onClick={handleImport}
              disabled={loading || !file}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'インポート中...' : 'インポート実行'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}