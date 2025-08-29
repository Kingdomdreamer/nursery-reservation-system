/**
 * 商品管理メインコンテナコンポーネント
 */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { ProductTable } from './ProductTable';
import { ProductFiltersComponent, type ProductFilters } from './ProductFilters';
import { ProductEditModal } from './ProductEditModal';
import { ProductDeleteModal } from './ProductDeleteModal';
import { ProductImportModal } from './ProductImportModal';
import Pagination from '@/components/common/Pagination';
import type { Product, PaginatedResponse } from '@/types';

interface ProductsContainerProps {
  onLogout: () => void;
}

interface ProductListItem extends Product {
  id: number;
}

export const ProductsContainer: React.FC<ProductsContainerProps> = ({ onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // 検索・フィルター状態
  const [filters, setFilters] = useState<ProductFilters>({
    name: '',
    category_id: '',
    min_price: '',
    max_price: '',
    variation_type: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // モーダル状態
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductListItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductListItem | null>(null);

  // 商品データ読み込み
  const loadProducts = async (page = 1, newFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(newFilters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/admin/products?${params}`);
      const data: PaginatedResponse<ProductListItem> = await response.json();

      if (response.ok) {
        setProducts(data.data || []);
        
        // 安全なpagination設定
        if (data.pagination && typeof data.pagination === 'object') {
          setPagination({
            page: data.pagination.page || 1,
            limit: data.pagination.limit || 20,
            totalItems: data.pagination.totalItems || 0,
            totalPages: data.pagination.totalPages || 1,
            hasNextPage: data.pagination.hasNextPage || false,
            hasPreviousPage: data.pagination.hasPreviousPage || false
          });
        } else {
          // フォールバック値
          setPagination({
            page: 1,
            limit: 20,
            totalItems: (data.data || []).length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
          });
        }
      } else {
        console.error('商品データ取得エラー:', data);
        alert('商品データの取得に失敗しました');
      }
    } catch (error) {
      console.error('商品データ読み込みエラー:', error);
      alert('商品データの読み込み中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    loadProducts();
  }, []);

  // フィルター変更ハンドラ
  const handleFilterChange = (key: keyof ProductFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 検索実行
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadProducts(1, filters);
  };

  // フィルタークリア
  const clearFilters = () => {
    const clearedFilters: ProductFilters = {
      name: '',
      category_id: '',
      min_price: '',
      max_price: '',
      variation_type: '',
      sort_by: 'created_at',
      sort_order: 'desc'
    };
    setFilters(clearedFilters);
    loadProducts(1, clearedFilters);
  };

  // ページ変更
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    loadProducts(newPage);
  };

  // 商品編集
  const handleEditProduct = (product: ProductListItem) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (productData: Partial<Product>) => {
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        await loadProducts(pagination.page);
        setShowEditModal(false);
        setEditingProduct(null);
        alert('商品を更新しました');
      } else {
        const error = await response.json();
        throw new Error(error.error || '商品の更新に失敗しました');
      }
    } catch (error) {
      console.error('商品更新エラー:', error);
      alert(error instanceof Error ? error.message : '商品の更新中にエラーが発生しました');
    }
  };

  // 商品削除
  const handleDeleteProduct = (product: ProductListItem) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (productId: number) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadProducts(pagination.page);
        setShowDeleteModal(false);
        setDeletingProduct(null);
        alert('商品を削除しました');
      } else {
        const error = await response.json();
        throw new Error(error.error || '商品の削除に失敗しました');
      }
    } catch (error) {
      console.error('商品削除エラー:', error);
      alert(error instanceof Error ? error.message : '商品の削除中にエラーが発生しました');
    }
  };

  // CSVインポート関連
  const handleImport = async (file: File, type: 'standard' | 'pos', presetId?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    if (presetId) {
      formData.append('preset_id', presetId.toString());
    }

    const endpoint = type === 'pos' 
      ? '/api/admin/products/import-pos' 
      : '/api/admin/products/import';

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok) {
      await loadProducts(); // リロード
      return result.data;
    } else {
      throw new Error(result.error || result.message || 'インポートエラー');
    }
  };

  const handleDownloadTemplate = async (type: 'standard' | 'pos') => {
    const endpoint = type === 'pos' 
      ? '/api/admin/products/import-pos' 
      : '/api/admin/products/import';

    const response = await fetch(endpoint, { method: 'GET' });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_products_template.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      throw new Error('テンプレートのダウンロードに失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      {/* アクションヘッダー */}
      <div className="flex justify-end items-center">
        <div className="flex space-x-3">
          <Button onClick={() => setShowImportModal(true)}>
            CSV インポート
          </Button>
        </div>
      </div>

      {/* フィルター・検索 */}
      <ProductFiltersComponent
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onClear={clearFilters}
        loading={loading}
      />

      {/* 商品テーブル */}
      <ProductTable
        products={products}
        loading={loading}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      />

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}

      {/* モーダル群 */}
      <ProductImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
        onDownloadTemplate={handleDownloadTemplate}
      />

      {showEditModal && editingProduct && (
        <ProductEditModal
          product={editingProduct}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          onSave={handleUpdateProduct}
        />
      )}

      <ProductDeleteModal
        product={deletingProduct}
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingProduct(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};