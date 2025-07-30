'use client';

import { useState, useEffect } from 'react';
import type { Product } from '@/types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  product?: Product | null;
  mode: 'create' | 'edit';
}

export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  product,
  mode
}: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    external_id: '',
    category_id: '',
    price: '',
    variation: '',
    comment: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (product && mode === 'edit') {
      setFormData({
        name: product.name,
        external_id: product.external_id || '',
        category_id: product.category_id?.toString() || '',
        price: product.price.toString(),
        variation: '', // バリエーションは別管理のため空
        comment: '' // コメントは別管理のため空
      });
    } else {
      setFormData({
        name: '',
        external_id: '',
        category_id: '',
        price: '',
        variation: '',
        comment: ''
      });
    }
    setErrors({});
  }, [product, mode, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '商品名は必須です';
    } else if (formData.name.length > 100) {
      newErrors.name = '商品名は100文字以内で入力してください';
    }

    if (!formData.price) {
      newErrors.price = '価格は必須です';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = '正しい価格を入力してください';
    }

    if (formData.external_id && formData.external_id.length > 50) {
      newErrors.external_id = '外部IDは50文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const productData = {
        name: formData.name.trim(),
        external_id: formData.external_id.trim() || null,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        price: Number(formData.price)
      };

      if (mode === 'create') {
        const response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData)
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || '作成に失敗しました');
        }
        
        alert('商品を作成しました');
      } else if (mode === 'edit' && product) {
        const response = await fetch(`/api/admin/products/${product.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData)
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || '更新に失敗しました');
        }
        
        alert('商品を更新しました');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('商品保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product || mode !== 'edit') return;
    
    if (!confirm(`商品「${product.name}」を削除しますか？\n※この操作は取り消せません。`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '削除に失敗しました');
      }
      
      alert('商品を削除しました');
      onSave();
      onClose();
    } catch (error) {
      console.error('商品削除エラー:', error);
      alert('削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    return mode === 'create' ? '新しい商品を追加' : '商品を編集';
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

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="例: 春野菜セット"
              disabled={loading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              価格（円） <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="1000"
              min="0"
              disabled={loading}
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              外部システムID
            </label>
            <input
              type="text"
              value={formData.external_id}
              onChange={(e) => setFormData({ ...formData, external_id: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.external_id ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="PROD_001"
              disabled={loading}
            />
            {errors.external_id && (
              <p className="mt-1 text-sm text-red-600">{errors.external_id}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              外部システムとの連携用ID（任意）
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリID
            </label>
            <input
              type="number"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1"
              min="1"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              商品カテゴリの分類用ID（任意）
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              バリエーション名
            </label>
            <input
              type="text"
              value={formData.variation}
              onChange={(e) => setFormData({ ...formData, variation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 小サイズ、大サイズ"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              商品の価格バリエーション名（任意）
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品説明・コメント
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="商品の詳細説明..."
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              商品の詳細説明や注意事項（任意）
            </p>
          </div>
        </div>

        {/* バリエーション情報説明 */}
        <div className="px-6 pb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">価格バリエーションについて</h4>
            <p className="text-sm text-yellow-700">
              バリエーション名を設定すると、将来的にpickup_windowsでの期間設定時に価格差異を管理できます。
              例：「小サイズ 1000円」「大サイズ 1500円」として同一商品の異なる価格設定が可能です。
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div>
            {mode === 'edit' && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                削除
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
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
    </div>
  );
}