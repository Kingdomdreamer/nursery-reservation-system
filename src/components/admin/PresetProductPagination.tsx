'use client';

import { PaginationInfo } from '@/types';

interface PresetProductPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export default function PresetProductPagination({ pagination, onPageChange }: PresetProductPaginationProps) {
  const { page, totalPages, hasNextPage, hasPreviousPage, totalItems, limit } = pagination;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between py-3 border-t border-gray-200">
      {/* 結果表示 */}
      <div className="text-sm text-gray-600">
        {(page - 1) * limit + 1}〜{Math.min(page * limit, totalItems)}件 / 全{totalItems}件
      </div>

      {/* ページネーション */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          前
        </button>

        <span className="px-3 py-1 text-sm text-gray-700">
          {page} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          次
        </button>
      </div>
    </div>
  );
}