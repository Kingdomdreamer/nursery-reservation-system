'use client';

import { useState, useEffect } from 'react';
import { ProductFilters } from '@/types';

interface PresetProductSearchProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
  selectedCount: number;
}

export default function PresetProductSearch({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  loading = false,
  selectedCount
}: PresetProductSearchProps) {
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
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">商品検索</h3>
          {selectedCount > 0 && (
            <p className="text-sm text-blue-600 mt-1">
              {selectedCount}個の商品が選択されています
            </p>
          )}
        </div>
      </div>

      {/* 検索フィールド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            商品名
          </label>
          <input
            type="text"
            value={localFilters.name || ''}
            onChange={(e) => handleFilterChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="1"
            min="1"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            価格範囲
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={localFilters.min_price || ''}
              onChange={(e) => handleFilterChange('min_price', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="最低"
              min="0"
              disabled={loading}
            />
            <input
              type="number"
              value={localFilters.max_price || ''}
              onChange={(e) => handleFilterChange('max_price', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="最高"
              min="0"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ソート
          </label>
          <div className="flex space-x-1">
            <select
              value={localFilters.sort_by || 'created_at'}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="flex-1 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
              className="px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={loading}
            >
              <option value="desc">↓</option>
              <option value="asc">↑</option>
            </select>
          </div>
        </div>
      </div>

      {/* バリエーション種別 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          バリエーション種別
        </label>
        <select
          value={localFilters.variation_type || ''}
          onChange={(e) => handleFilterChange('variation_type', e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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

      {/* ボタン */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            検索
          </button>
          
          <button
            onClick={handleReset}
            disabled={loading}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50 text-sm"
          >
            リセット
          </button>
        </div>

        {hasActiveFilters && (
          <div className="text-sm text-blue-600">
            検索条件が適用されています
          </div>
        )}
      </div>
    </div>
  );
}