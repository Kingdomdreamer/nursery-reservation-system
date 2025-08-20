/**
 * 商品管理フィルター・検索コンポーネント
 */
import React from 'react';
import { Button, Input } from '@/components/ui';

export interface ProductFilters {
  name: string;
  category_id: string;
  min_price: string;
  max_price: string;
  variation_type: string;
  sort_by: string;
  sort_order: string;
}

interface ProductFiltersProps {
  filters: ProductFilters;
  onFilterChange: (key: keyof ProductFilters, value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  loading?: boolean;
}

export const ProductFiltersComponent: React.FC<ProductFiltersProps> = ({
  filters,
  onFilterChange,
  onSearch,
  onClear,
  loading = false
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        {/* 商品名検索 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            商品名
          </label>
          <Input
            type="text"
            placeholder="商品名で検索"
            value={filters.name}
            onChange={(e) => onFilterChange('name', e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
        </div>

        {/* カテゴリ（バリエーション）フィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            バリエーション
          </label>
          <select
            value={filters.variation_type}
            onChange={(e) => onFilterChange('variation_type', e.target.value)}
            disabled={loading}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            <option value="通常価格">通常価格</option>
            <option value="特価">特価</option>
            <option value="セール">セール</option>
            <option value="会員価格">会員価格</option>
            <option value="その他">その他</option>
          </select>
        </div>

        {/* 最低価格 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            最低価格
          </label>
          <Input
            type="number"
            placeholder="0"
            value={filters.min_price}
            onChange={(e) => onFilterChange('min_price', e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            min="0"
          />
        </div>

        {/* 最高価格 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            最高価格
          </label>
          <Input
            type="number"
            placeholder="999999"
            value={filters.max_price}
            onChange={(e) => onFilterChange('max_price', e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            min="0"
          />
        </div>
      </div>

      {/* ソート設定 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            並び替え基準
          </label>
          <select
            value={filters.sort_by}
            onChange={(e) => onFilterChange('sort_by', e.target.value)}
            disabled={loading}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at">作成日時</option>
            <option value="updated_at">更新日時</option>
            <option value="name">商品名</option>
            <option value="price">価格</option>
            <option value="display_order">表示順</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            並び順
          </label>
          <select
            value={filters.sort_order}
            onChange={(e) => onFilterChange('sort_order', e.target.value)}
            disabled={loading}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">降順</option>
            <option value="asc">昇順</option>
          </select>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <Button
            type="button"
            onClick={onSearch}
            disabled={loading}
          >
            {loading ? '検索中...' : '検索'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClear}
            disabled={loading}
          >
            クリア
          </Button>
        </div>

        {/* アクティブフィルターの表示 */}
        <div className="text-sm text-gray-500">
          {Object.values(filters).some(v => v) ? (
            <span className="text-blue-600">フィルター適用中</span>
          ) : (
            <span>すべての商品を表示</span>
          )}
        </div>
      </div>
    </div>
  );
};