'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminAuthWrapper from '@/components/admin/AdminAuthWrapper';
import type { Product, PaginatedResponse, ProductFilters } from '@/types';

interface ProductListItem extends Product {
  id: number;
}

interface ProductEditModalProps {
  product: ProductListItem;
  onClose: () => void;
  onSave: (productData: any) => void;
}

function ProductEditModal({ product, onClose, onSave }: ProductEditModalProps) {
  const [formData, setFormData] = useState({
    name: product.name || '',
    price: product.price || 0,
    product_code: product.product_code || '',
    barcode: product.barcode || '',
    visible: product.visible ?? true,
    variation_name: product.variation_name || '',
    tax_type: product.tax_type || '内税'
  });
  
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('商品名は必須です');
      return;
    }
    
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">商品編集</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* 商品名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商品名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="商品名を入力"
              required
            />
          </div>

          {/* 価格 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              価格
            </label>
            <input
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({...prev, price: Number(e.target.value)}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="価格を入力"
            />
          </div>

          {/* 商品コード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商品コード
            </label>
            <input
              type="text"
              value={formData.product_code}
              onChange={(e) => setFormData(prev => ({...prev, product_code: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="商品コードを入力"
            />
          </div>

          {/* バーコード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              バーコード
            </label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData(prev => ({...prev, barcode: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="バーコードを入力"
            />
          </div>

          {/* バリエーション名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              バリエーション名
            </label>
            <input
              type="text"
              value={formData.variation_name}
              onChange={(e) => setFormData(prev => ({...prev, variation_name: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="バリエーション名を入力"
            />
          </div>

          {/* 税区分 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              税区分
            </label>
            <select
              value={formData.tax_type}
              onChange={(e) => setFormData(prev => ({...prev, tax_type: e.target.value as '内税' | '外税'}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="内税">内税</option>
              <option value="外税">外税</option>
            </select>
          </div>

          {/* 表示設定 */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(e) => setFormData(prev => ({...prev, visible: e.target.checked}))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">商品を表示する</span>
            </label>
          </div>

          {/* 商品情報表示 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-sm text-gray-600">
              <div>商品ID: {product.id}</div>
              {product.category_id && <div>カテゴリID: {product.category_id}</div>}
              {product.created_at && (
                <div>作成日: {new Date(product.created_at).toLocaleDateString('ja-JP')}</div>
              )}
            </div>
          </div>
        </form>
        
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            disabled={saving || !formData.name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductsContent({ onLogout }: { onLogout: () => void }) {
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

  // CSVインポート用
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'standard' | 'pos'>('standard');
  const [presetId, setPresetId] = useState<number | undefined>(undefined);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // 編集・削除用
  const [editingProduct, setEditingProduct] = useState<ProductListItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        // pagination情報の安全な設定
        if (data.pagination) {
          setPagination(data.pagination);
        } else {
          // フォールバック用pagination
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
      }
    } catch (error) {
      console.error('商品データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadProducts(1, filters);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    loadProducts(newPage);
  };

  const handleFilterChange = (key: keyof ProductFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

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

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      if (presetId) {
        formData.append('preset_id', presetId.toString());
      }

      const endpoint = importType === 'pos' 
        ? '/api/admin/products/import-pos' 
        : '/api/admin/products/import';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        setImportResult(result.data);
        setShowImportModal(false);
        setImportFile(null);
        loadProducts(); // リロード
      } else {
        setImportResult({ 
          success: 0, 
          total: 0, 
          errors: [{ message: result.error || 'インポートエラー' }],
          warnings: [],
          insertedProducts: []
        });
      }
    } catch (error) {
      console.error('インポートエラー:', error);
      setImportResult({ 
        success: 0, 
        total: 0, 
        errors: [{ message: 'ネットワークエラー' }],
        warnings: [],
        insertedProducts: []
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async (type: 'standard' | 'pos') => {
    try {
      const endpoint = type === 'pos' 
        ? '/api/admin/products/import-pos' 
        : '/api/admin/products/import';
      
      const response = await fetch(endpoint, { method: 'GET' });
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'pos' ? 'pos_template.csv' : 'product_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('テンプレートダウンロードエラー:', error);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/products/${deletingProduct.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // 削除成功
        setShowDeleteModal(false);
        setDeletingProduct(null);
        loadProducts(pagination.page); // 現在のページを再読み込み
        alert(`商品「${deletingProduct.name}」を削除しました`);
      } else {
        throw new Error(result.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('商品削除エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '削除中にエラーが発生しました';
      alert(`エラー: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateProduct = async (productData: any) => {
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // 更新成功
        setShowEditModal(false);
        setEditingProduct(null);
        loadProducts(pagination.page); // 現在のページを再読み込み
        alert(`商品「${result.data.name}」を更新しました`);
      } else {
        throw new Error(result.error || '更新に失敗しました');
      }
    } catch (error) {
      console.error('商品更新エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '更新中にエラーが発生しました';
      alert(`エラー: ${errorMessage}`);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <AdminLayout 
      title="商品管理" 
      description="商品の一覧表示、検索、インポート"
      onLogout={onLogout}
    >
      {/* 検索・フィルターエリア */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                商品名
              </label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="商品名で検索"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリID
              </label>
              <input
                type="number"
                value={filters.category_id}
                onChange={(e) => handleFilterChange('category_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="カテゴリID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最低価格
              </label>
              <input
                type="number"
                value={filters.min_price}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="最低価格"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最高価格
              </label>
              <input
                type="number"
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="最高価格"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                バリエーション
              </label>
              <select
                value={filters.variation_type}
                onChange={(e) => handleFilterChange('variation_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">すべて</option>
                <option value="none">バリエーションなし</option>
                <option value="price">価格バリエーション</option>
                <option value="size">サイズバリエーション</option>
                <option value="weight">重量バリエーション</option>
                <option value="other">その他</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                検索
              </button>
              <button
                onClick={clearFilters}
                disabled={loading}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                クリア
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                CSVインポート
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* インポート結果表示 */}
      {importResult && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">インポート結果</h3>
            <div className="mb-4">
              <span className="text-green-600">成功: {importResult.success}件</span>
              <span className="text-gray-500 ml-4">総件数: {importResult.total}件</span>
              {importResult.errors?.length > 0 && (
                <span className="text-red-600 ml-4">エラー: {importResult.errors.length}件</span>
              )}
            </div>
            
            {importResult.errors?.length > 0 && (
              <div className="border border-red-300 rounded-md p-3 bg-red-50">
                <h4 className="text-sm font-medium text-red-800 mb-2">エラー詳細:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {importResult.errors.slice(0, 5).map((error: any, index: number) => (
                    <li key={index}>
                      {error.row && `行${error.row}: `}{error.message}
                    </li>
                  ))}
                  {importResult.errors.length > 5 && (
                    <li className="text-red-600">...他{importResult.errors.length - 5}件</li>
                  )}
                </ul>
              </div>
            )}
            
            <button
              onClick={() => setImportResult(null)}
              className="mt-4 text-sm text-gray-600 hover:text-gray-800"
            >
              結果を非表示
            </button>
          </div>
        </div>
      )}

      {/* 商品一覧 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              商品一覧 ({pagination.totalItems}件)
            </h2>
            <button
              onClick={() => loadProducts(pagination.page)}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
            >
              更新
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : products.length === 0 ? (
            <p className="text-gray-500 text-center py-8">商品データがありません</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        商品名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        価格
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        カテゴリID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        バリエーション
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        商品コード
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        表示
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        作成日
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.base_product_name && (
                              <div className="text-xs text-gray-500">
                                ベース: {product.base_product_name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ¥{product.price?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.category_id || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.variation_name ? (
                            <div>
                              <div className="text-xs text-gray-500">{product.variation_type}</div>
                              <div>{product.variation_name}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.product_code || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.visible 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.visible ? '表示' : '非表示'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.created_at 
                            ? new Date(product.created_at).toLocaleDateString('ja-JP')
                            : '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setShowEditModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => {
                                setDeletingProduct(product);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              削除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* ページネーション */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.totalItems)} / {pagination.totalItems}件
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPreviousPage}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      前へ
                    </button>
                    <span className="px-3 py-2 text-sm font-medium text-gray-700">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      次へ
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* CSVインポートモーダル */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">CSVインポート</h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  インポート形式
                </label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as 'standard' | 'pos')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard">標準形式</option>
                  <option value="pos">POS形式</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プリセットID（オプション）
                </label>
                <input
                  type="number"
                  value={presetId || ''}
                  onChange={(e) => setPresetId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="プリセットIDを入力"
                />
                <p className="text-xs text-gray-500 mt-1">
                  指定すると商品がプリセットに自動で関連付けられます
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSVファイル
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => downloadTemplate('standard')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  標準テンプレート
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => downloadTemplate('pos')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  POSテンプレート
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportResult(null);
                }}
                disabled={importing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'インポート中...' : 'インポート'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {showDeleteModal && deletingProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">商品削除の確認</h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="mb-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700 text-center">
                  以下の商品を削除してもよろしいですか？<br />
                  この操作は取り消せません。
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">商品名: {deletingProduct.name}</div>
                  <div className="text-gray-600">ID: {deletingProduct.id}</div>
                  {deletingProduct.product_code && (
                    <div className="text-gray-600">商品コード: {deletingProduct.product_code}</div>
                  )}
                  <div className="text-gray-600">価格: ¥{deletingProduct.price?.toLocaleString() || 0}</div>
                </div>
              </div>
              
              <p className="text-xs text-red-600 text-center">
                ※ アクティブなプリセットで使用されている商品は削除できません
              </p>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingProduct(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 商品編集モーダル */}
      {showEditModal && editingProduct && (
        <ProductEditModal
          product={editingProduct}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          onSave={handleUpdateProduct}
        />
      )}
    </AdminLayout>
  );
}

export default function AdminProductsPage() {
  return (
    <AdminAuthWrapper>
      {({ onLogout }: { onLogout: () => void }) => (
        <ProductsContent onLogout={onLogout} />
      )}
    </AdminAuthWrapper>
  );
}