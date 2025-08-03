'use client';

import { useState } from 'react';

interface ProductVariation {
  id: string;
  variation_name: string;
  price: string;
  comment: string;
}

interface ProductVariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function ProductVariationModal({
  isOpen,
  onClose,
  onSave
}: ProductVariationModalProps) {
  const [loading, setLoading] = useState(false);
  const [baseName, setBaseName] = useState('');
  const [externalId, setExternalId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [variations, setVariations] = useState<ProductVariation[]>([
    { id: '1', variation_name: '', price: '', comment: '' }
  ]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addVariation = () => {
    setVariations([
      ...variations,
      { id: generateId(), variation_name: '', price: '', comment: '' }
    ]);
  };

  const removeVariation = (id: string) => {
    if (variations.length > 1) {
      setVariations(variations.filter(v => v.id !== id));
    }
  };

  const updateVariation = (id: string, field: keyof ProductVariation, value: string) => {
    setVariations(variations.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // 基本商品名チェック
    if (!baseName.trim()) {
      newErrors.baseName = '基本商品名は必須です';
    } else if (baseName.length > 50) {
      newErrors.baseName = '基本商品名は50文字以内で入力してください';
    }

    // バリエーションチェック
    let hasValidVariation = false;
    (variations || []).forEach((variation, index) => {
      const variationKey = `variation_${variation.id}`;

      if (!variation.variation_name.trim()) {
        newErrors[`${variationKey}_name`] = 'バリエーション名は必須です';
      } else if (variation.variation_name.length > 50) {
        newErrors[`${variationKey}_name`] = 'バリエーション名は50文字以内で入力してください';
      }

      if (!variation.price.trim()) {
        newErrors[`${variationKey}_price`] = '価格は必須です';
      } else if (isNaN(Number(variation.price)) || Number(variation.price) < 0) {
        newErrors[`${variationKey}_price`] = '正しい価格を入力してください';
      }

      if (variation.variation_name.trim() && variation.price.trim() && !isNaN(Number(variation.price))) {
        hasValidVariation = true;
      }
    });

    if (!hasValidVariation) {
      newErrors.variations = '少なくとも1つの有効なバリエーションが必要です';
    }

    // 重複チェック
    const variationNames = variations.map(v => v.variation_name.trim()).filter(name => name);
    const uniqueNames = new Set(variationNames);
    if (variationNames.length !== uniqueNames.size) {
      newErrors.duplicateVariations = 'バリエーション名が重複しています';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 各バリエーションを個別の商品として作成
      const products = variations.map((variation, index) => ({
        name: `${baseName.trim()}（${variation.variation_name.trim()}）`,
        external_id: externalId.trim() ? `${externalId.trim()}_${index + 1}` : null,
        category_id: categoryId ? parseInt(categoryId) : null,
        price: parseInt(variation.price)
      }));

      const response = await fetch('/api/admin/products/variations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_name: baseName.trim(),
          products: products,
          variations: variations.map(v => ({
            variation_name: v.variation_name.trim(),
            comment: v.comment.trim() || null
          }))
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '作成に失敗しました');
      }

      alert(`${products.length}個のバリエーション商品を作成しました`);
      
      // フォームリセット
      setBaseName('');
      setExternalId('');
      setCategoryId('');
      setVariations([{ id: generateId(), variation_name: '', price: '', comment: '' }]);
      setErrors({});
      
      onSave();
      onClose();
    } catch (error) {
      console.error('バリエーション商品作成エラー:', error);
      alert('作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              バリエーション商品作成
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              同一基本商品で複数の価格バリエーションを一度に作成できます
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本情報 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">基本商品情報</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  基本商品名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={baseName}
                  onChange={(e) => setBaseName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.baseName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="例: 野菜セット"
                  disabled={loading}
                />
                {errors.baseName && (
                  <p className="mt-1 text-sm text-red-600">{errors.baseName}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  実際の商品名は「基本商品名（バリエーション名）」となります
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  外部システムID
                </label>
                <input
                  type="text"
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: VEG"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  各バリエーションに連番が付きます（VEG_1, VEG_2...）
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリID
                </label>
                <input
                  type="number"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
                  min="1"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* バリエーション一覧 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">価格バリエーション</h3>
              <button
                onClick={addVariation}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                + バリエーション追加
              </button>
            </div>

            {errors.variations && (
              <p className="mb-4 text-sm text-red-600">{errors.variations}</p>
            )}
            {errors.duplicateVariations && (
              <p className="mb-4 text-sm text-red-600">{errors.duplicateVariations}</p>
            )}

            <div className="space-y-4">
              {variations.map((variation, index) => (
                <div key={variation.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">バリエーション {index + 1}</h4>
                    {variations.length > 1 && (
                      <button
                        onClick={() => removeVariation(variation.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        削除
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        バリエーション名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={variation.variation_name}
                        onChange={(e) => updateVariation(variation.id, 'variation_name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`variation_${variation.id}_name`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="例: 小サイズ"
                        disabled={loading}
                      />
                      {errors[`variation_${variation.id}_name`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`variation_${variation.id}_name`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        価格（円） <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={variation.price}
                        onChange={(e) => updateVariation(variation.id, 'price', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`variation_${variation.id}_price`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="1000"
                        min="0"
                        disabled={loading}
                      />
                      {errors[`variation_${variation.id}_price`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`variation_${variation.id}_price`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        説明・コメント
                      </label>
                      <input
                        type="text"
                        value={variation.comment}
                        onChange={(e) => updateVariation(variation.id, 'comment', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例: お一人様用"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* プレビュー */}
                  <div className="mt-3 p-2 bg-white border border-gray-200 rounded">
                    <p className="text-sm text-gray-600">
                      <strong>商品名プレビュー:</strong> 
                      {baseName.trim() && variation.variation_name.trim() 
                        ? ` ${baseName.trim()}（${variation.variation_name.trim()}）`
                        : ' 基本商品名とバリエーション名を入力してください'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
            {loading ? '作成中...' : `${variations.length}個のバリエーション商品を作成`}
          </button>
        </div>
      </div>
    </div>
  );
}