'use client';

import { useState, useEffect } from 'react';
import { ProductFilters } from '@/types';

interface ProductSearchProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}

export default function ProductSearch({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  loading = false
}: ProductSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (field: keyof ProductFilters, value: string) => {
    const newFilters = { ...localFilters, [field]: value || undefined };
    setLocalFilters(newFilters);
  };

  const handleSearch = () => {
    onFiltersChange(localFilters);
    onSearch();
  };

  const handleReset = () => {
    const resetFilters: ProductFilters = {
      sort_by: 'created_at',
      sort_order: 'desc'
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onReset();
  };

  const hasActiveFilters = Object.keys(localFilters).some(
    key => key !== 'sort_by' && key !== 'sort_order' && localFilters[key as keyof ProductFilters]
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">商品検索</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {isExpanded ? '簡単検索' : '詳細検索'}
        </button>
      </div>

      {/* 基本検索 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            商品名
          </label>
          <input
            type="text"
            value={localFilters.name || ''}
            onChange={(e) => handleFilterChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="商品名を入力"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            カテゴリID
          </label>
          <input
            type="number"
            value={localFilters.category_id || ''}
            onChange={(e) => handleFilterChange('category_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1"
            min="1"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ソート
          </label>
          <div className="flex space-x-2">
            <select
              value={localFilters.sort_by || 'created_at'}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="created_at">作成日</option>
              <option value="name">商品名</option>
              <option value="price">価格</option>
              <option value="category_id">カテゴリ</option>
            </select>
            <select
              value={localFilters.sort_order || 'desc'}
              onChange={(e) => handleFilterChange('sort_order', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="desc">降順</option>
              <option value="asc">昇順</option>
            </select>
          </div>
        </div>
      </div>

      {/* 詳細検索 */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最低価格
            </label>
            <input
              type="number"
              value={localFilters.min_price || ''}
              onChange={(e) => handleFilterChange('min_price', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最高価格
            </label>
            <input
              type="number"
              value={localFilters.max_price || ''}
              onChange={(e) => handleFilterChange('max_price', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10000"
              min="0"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              バリエーション種別
            </label>
            <select
              value={localFilters.variation_type || ''}
              onChange={(e) => handleFilterChange('variation_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">全て</option>
              <option value="none">バリエーションなし</option>
              <option value="price">価格バリエーション</option>
              <option value="size">サイズバリエーション</option>
              <option value="weight">重量バリエーション</option>
              <option value="other">その他</option>
            </select>
          </div>
        </div>
      )}

      {/* ボタン */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            検索実行
          </button>
          
          <button
            onClick={handleReset}
            disabled={loading}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50"
          >
            リセット
          </button>
        </div>

        {hasActiveFilters && (
          <div className="text-sm text-blue-600">
            絞り込み条件が適用されています
          </div>
        )}
      </div>
    </div>
  );
}