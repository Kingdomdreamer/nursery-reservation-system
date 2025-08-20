/**
 * 商品削除確認モーダルコンポーネント
 */
import React, { useState } from 'react';
import { Button, LoadingSpinner } from '@/components/ui';
import { getProductDisplayName, getProductPriceDisplay } from '@/lib/utils/dataTransformers';
import type { Product } from '@/types';

interface ProductDeleteModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (productId: number) => Promise<void>;
}

export const ProductDeleteModal: React.FC<ProductDeleteModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!product || deleting) return;

    setDeleting(true);
    try {
      await onConfirm(product.id);
      onClose();
    } catch (error) {
      console.error('商品削除エラー:', error);
      // エラーハンドリングは親コンポーネントで行う
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            商品削除の確認
          </h3>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    削除の確認
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>この操作は取り消せません。削除する前に以下をご確認ください：</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>この商品を使用している予約やプリセットがないか</li>
                      <li>商品データのバックアップが必要でないか</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">削除対象の商品</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">商品名:</span> {getProductDisplayName(product)}
              </div>
              <div>
                <span className="font-medium">価格:</span> {getProductPriceDisplay(product)}
              </div>
              {product.product_code && (
                <div>
                  <span className="font-medium">商品コード:</span> {product.product_code}
                </div>
              )}
              <div>
                <span className="font-medium">商品ID:</span> {product.id}
              </div>
              <div>
                <span className="font-medium">作成日:</span> {new Date(product.created_at).toLocaleDateString('ja-JP')}
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-6">
            <p><strong>注意:</strong> 削除された商品データは復元できません。本当に削除してもよろしいですか？</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleting}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                削除中...
              </>
            ) : (
              '削除する'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};