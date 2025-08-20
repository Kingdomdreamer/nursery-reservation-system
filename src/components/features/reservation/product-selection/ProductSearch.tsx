/**
 * 商品検索・フィルタリングコンポーネント
 */
import React from 'react';
import { Input, Button } from '@/components/ui';

interface ProductSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Array<{ id: string; name: string; count?: number }>;
  onClearFilters: () => void;
  disabled?: boolean;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  onClearFilters,
  disabled = false
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 検索フィールド */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            商品名で検索
          </label>
          <Input
            type="text"
            placeholder="商品名を入力..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* カテゴリフィルタ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            カテゴリ
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            disabled={disabled}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">すべてのカテゴリ</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.count !== undefined && ` (${category.count}件)`}
              </option>
            ))}
          </select>
        </div>

        {/* クリアボタン */}
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClearFilters}
            disabled={disabled || (!searchTerm && !selectedCategory)}
            className="w-full"
          >
            フィルタをクリア
          </Button>
        </div>
      </div>

      {/* アクティブフィルタの表示 */}
      {(searchTerm || selectedCategory) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">適用中のフィルタ:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                検索: "{searchTerm}"
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                カテゴリ: {categories.find(c => c.id === selectedCategory)?.name}
                <button
                  type="button"
                  onClick={() => onCategoryChange('')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};