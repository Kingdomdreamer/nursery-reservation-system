/**
 * 商品CSVインポートモーダルコンポーネント
 */
import React, { useState } from 'react';
import { Button, LoadingSpinner } from '@/components/ui';

interface ImportResult {
  success: number;
  total: number;
  errors: Array<{ message: string; details?: string }>;
  warnings: string[];
}

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, type: 'standard' | 'pos', presetId?: number) => Promise<ImportResult>;
  onDownloadTemplate: (type: 'standard' | 'pos') => Promise<void>;
}

export const ProductImportModal: React.FC<ProductImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  onDownloadTemplate
}) => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'standard' | 'pos'>('standard');
  const [presetId, setPresetId] = useState<number | undefined>(undefined);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setImportFile(file);
      setImportResult(null);
    } else {
      alert('CSVファイルを選択してください');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);

    try {
      const result = await onImport(importFile, importType, presetId);
      setImportResult(result);
      
      if (result.success > 0) {
        // 成功時は少し待ってからモーダルを閉じる
        setTimeout(() => {
          onClose();
          setImportFile(null);
          setImportResult(null);
        }, 2000);
      }
    } catch (error) {
      console.error('インポートエラー:', error);
      setImportResult({
        success: 0,
        total: 0,
        errors: [{ message: 'インポート処理中にエラーが発生しました' }],
        warnings: []
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async (type: 'standard' | 'pos') => {
    try {
      await onDownloadTemplate(type);
    } catch (error) {
      console.error('テンプレートダウンロードエラー:', error);
      alert('テンプレートのダウンロードに失敗しました');
    }
  };

  const handleClose = () => {
    if (!importing) {
      setImportFile(null);
      setImportResult(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            CSV商品インポート
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* テンプレートダウンロード */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              1. CSVテンプレートをダウンロード
            </h4>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('standard')}
              >
                標準形式テンプレート
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('pos')}
              >
                POS形式テンプレート
              </Button>
            </div>
          </div>

          {/* インポート設定 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              2. インポート設定
            </h4>
            
            <div className="space-y-4">
              {/* ファイル形式選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ファイル形式
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="standard"
                      checked={importType === 'standard'}
                      onChange={(e) => setImportType(e.target.value as 'standard' | 'pos')}
                      disabled={importing}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">標準形式</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="pos"
                      checked={importType === 'pos'}
                      onChange={(e) => setImportType(e.target.value as 'standard' | 'pos')}
                      disabled={importing}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">POS形式</span>
                  </label>
                </div>
              </div>

              {/* プリセット関連付け */}
              {importType === 'standard' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プリセットID（任意）
                  </label>
                  <input
                    type="number"
                    value={presetId || ''}
                    onChange={(e) => setPresetId(e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={importing}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="関連付けるプリセットIDを入力"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ファイル選択 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              3. CSVファイルを選択
            </h4>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {importFile && (
              <p className="mt-2 text-sm text-gray-600">
                選択ファイル: {importFile.name} ({Math.round(importFile.size / 1024)}KB)
              </p>
            )}
          </div>

          {/* インポート結果 */}
          {importResult && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">インポート結果</h4>
              
              <div className={`p-4 rounded-lg ${importResult.success > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="text-sm space-y-1">
                  <div>成功: {importResult.success} / {importResult.total} 件</div>
                  <div>エラー: {importResult.errors.length} 件</div>
                  <div>警告: {importResult.warnings.length} 件</div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-red-800 mb-1">エラー詳細:</div>
                    <div className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index}>
                          {error.message}
                          {error.details && (
                            <div className="ml-2 text-red-600">{error.details}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={importing}
          >
            {importResult?.success && importResult.success > 0 ? '閉じる' : 'キャンセル'}
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!importFile || importing}
          >
            {importing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                インポート中...
              </>
            ) : (
              'インポート開始'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};