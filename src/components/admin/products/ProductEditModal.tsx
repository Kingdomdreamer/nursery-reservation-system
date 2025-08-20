/**
 * 商品編集モーダルコンポーネント
 */
import React, { useState, useEffect } from 'react';
import { Button, Input, LoadingSpinner } from '@/components/ui';
import type { Product } from '@/types';

interface ProductEditModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: Partial<Product>) => Promise<void>;
}

interface ProductFormData {
  name: string;
  product_code: string;
  variation_name: string;
  tax_type: '内税' | '外税';
  price: string;
  barcode: string;
  visible: boolean;
  display_order: string;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    product_code: '',
    variation_name: '',
    tax_type: '内税',
    price: '0',
    barcode: '',
    visible: true,
    display_order: '0'
  });
  const [saving, setSaving] = useState(false);

  // 商品データでフォームを初期化
  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name || '',
        product_code: product.product_code || '',
        variation_name: product.variation_name || '',
        tax_type: product.tax_type || '内税',
        price: product.price?.toString() || '0',
        barcode: product.barcode || '',
        visible: product.visible !== false,
        display_order: product.display_order?.toString() || '0'
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const updatedData: Partial<Product> = {
        name: formData.name.trim(),
        product_code: formData.product_code.trim() || undefined,
        variation_name: formData.variation_name.trim(),
        tax_type: formData.tax_type,
        price: parseInt(formData.price) || 0,
        barcode: formData.barcode.trim() || undefined,
        visible: formData.visible,
        display_order: parseInt(formData.display_order) || 0
      };

      await onSave(updatedData);
      onClose();
    } catch (error) {
      console.error('商品保存エラー:', error);
      // エラーハンドリングは親コンポーネントで行う
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;
      
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            商品編集
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            商品ID: {product.id}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 商品名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商品名 <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={handleInputChange('name')}
              disabled={saving}
              required
              maxLength={255}
              className="w-full"
            />
          </div>

          {/* 商品コード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商品コード
            </label>
            <Input
              type="text"
              value={formData.product_code}
              onChange={handleInputChange('product_code')}
              disabled={saving}
              maxLength={50}
              className="w-full"
            />
          </div>

          {/* バリエーション名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              バリエーション名
            </label>
            <Input
              type="text"
              value={formData.variation_name}
              onChange={handleInputChange('variation_name')}
              disabled={saving}
              maxLength={100}
              className="w-full"
            />
          </div>

          {/* 価格と税区分 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                価格 <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={handleInputChange('price')}
                disabled={saving}
                min="0"
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                税区分
              </label>
              <select
                value={formData.tax_type}
                onChange={handleInputChange('tax_type')}
                disabled={saving}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="内税">内税</option>
                <option value="外税">外税</option>
              </select>
            </div>
          </div>

          {/* バーコード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              バーコード
            </label>
            <Input
              type="text"
              value={formData.barcode}
              onChange={handleInputChange('barcode')}
              disabled={saving}
              maxLength={50}
              className="w-full"
            />
          </div>

          {/* 表示順 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              表示順
            </label>
            <Input
              type="number"
              value={formData.display_order}
              onChange={handleInputChange('display_order')}
              disabled={saving}
              min="0"
              className="w-full"
            />
          </div>

          {/* 表示/非表示 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="visible"
              checked={formData.visible}
              onChange={handleInputChange('visible')}
              disabled={saving}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="visible" className="ml-2 block text-sm text-gray-900">
              商品を表示する
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={saving || !formData.name.trim()}
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};