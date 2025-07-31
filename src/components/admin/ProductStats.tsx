'use client';

import { PaginationInfo, ProductFilters } from '@/types';

interface ProductStatsProps {
  pagination: PaginationInfo;
  filters: ProductFilters;
  loading?: boolean;
}

export default function ProductStats({ pagination, filters, loading = false }: ProductStatsProps) {
  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-blue-200 rounded w-3/4"></div>
            <div className="h-3 bg-blue-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFilters = Object.keys(filters).some(
    key => key !== 'sort_by' && key !== 'sort_order' && filters[key as keyof ProductFilters]
  );

  const getActiveFiltersText = () => {
    const activeFilters: string[] = [];
    
    if (filters.name) activeFilters.push(`商品名: "${filters.name}"`);
    if (filters.category_id) activeFilters.push(`カテゴリID: ${filters.category_id}`);
    if (filters.min_price) activeFilters.push(`最低価格: ¥${parseInt(filters.min_price).toLocaleString()}`);
    if (filters.max_price) activeFilters.push(`最高価格: ¥${parseInt(filters.max_price).toLocaleString()}`);
    if (filters.variation_type) {
      const variationLabels = {
        'none': 'バリエーションなし',
        'price': '価格バリエーション',
        'size': 'サイズバリエーション',
        'weight': '重量バリエーション',
        'other': 'その他'
      };
      activeFilters.push(`バリエーション: ${variationLabels[filters.variation_type as keyof typeof variationLabels] || filters.variation_type}`);
    }
    
    return activeFilters.join(', ');
  };

  const getSortText = () => {
    const sortLabels = {
      'created_at': '作成日',
      'name': '商品名',
      'price': '価格',
      'category_id': 'カテゴリ'
    };
    const orderLabel = filters.sort_order === 'asc' ? '昇順' : '降順';
    const sortLabel = sortLabels[filters.sort_by as keyof typeof sortLabels] || filters.sort_by;
    return `${sortLabel}${orderLabel}`;
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            検索結果: {pagination.totalItems.toLocaleString()}件
          </h3>
          
          {hasActiveFilters && (
            <div className="space-y-1">
              <p className="text-sm text-blue-800">
                <span className="font-medium">絞り込み条件:</span> {getActiveFiltersText()}
              </p>
            </div>
          )}
          
          <p className="text-sm text-blue-700 mt-1">
            <span className="font-medium">並び順:</span> {getSortText()}
          </p>
          
          {pagination.totalPages > 1 && (
            <p className="text-sm text-blue-700">
              <span className="font-medium">ページ:</span> {pagination.page} / {pagination.totalPages}
            </p>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-900">
            {pagination.totalItems.toLocaleString()}
          </div>
          <div className="text-sm text-blue-700">商品</div>
        </div>
      </div>
    </div>
  );
}