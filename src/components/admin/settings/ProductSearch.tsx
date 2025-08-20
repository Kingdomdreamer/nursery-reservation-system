/**
 * 商品検索コンポーネント
 */
'use client';

import React from 'react';
import type { EnhancedProduct } from '@/types/admin';

interface ProductSearchProps {
  searchQuery: string;
  showProductSearch: boolean;
  filteredProducts: EnhancedProduct[];
  onSearchChange: (query: string) => void;
  onSearchVisibilityChange: (visible: boolean) => void;
  onAddProduct: (productId: number) => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  searchQuery,
  showProductSearch,
  filteredProducts,
  onSearchChange,
  onSearchVisibilityChange,
  onAddProduct
}) => {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">商品を追加</h3>
        
        {/* 商品検索・追加 */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onSearchVisibilityChange(e.target.value.length > 0);
            }}
            onFocus={() => onSearchVisibilityChange(searchQuery.length > 0)}
            placeholder="🔍 商品名・商品コードで検索..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {/* 検索結果ドロップダウン */}
          {showProductSearch && filteredProducts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredProducts.slice(0, 20).map((product) => (
                <button
                  key={product.id}
                  onClick={() => onAddProduct(product.id)}
                  className="w-full text-left px-3 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{product.display_name}</span>
                        <span className="text-sm font-semibold text-gray-900">{product.price_display}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>商品コード: {product.product_code_display}</span>
                        
                        {/* ステータスバッジ */}
                        {product.status_badges.map((badge, index) => (
                          <span 
                            key={index}
                            className={`px-1.5 py-0.5 rounded text-xs ${
                              badge === '非表示' ? 'bg-red-100 text-red-800' :
                              badge === 'サービス品' ? 'bg-yellow-100 text-yellow-800' :
                              badge === 'バリエーション' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {filteredProducts.length > 20 && (
                <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                  他 {filteredProducts.length - 20} 件...（検索条件を絞り込んでください）
                </div>
              )}
            </div>
          )}
          
          {showProductSearch && searchQuery.length > 0 && filteredProducts.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
              <p className="text-gray-500 text-sm">該当する商品が見つかりません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};