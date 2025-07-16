'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase, Product, ProductCategory } from '../../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'

export default function ProductList() {
  const { showSuccess, showError } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showStockAlert, setShowStockAlert] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(*)
        `)
        .order('display_order', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('商品の取得に失敗しました:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('カテゴリの取得に失敗しました:', error)
      setCategories([])
    }
  }

  const handleToggleAvailable = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !currentStatus })
        .eq('id', productId)

      if (error) throw error
      
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, is_available: !currentStatus }
          : product
      ))
    } catch (error: any) {
      console.error('商品ステータスの更新に失敗しました:', error)
      showError('ステータス更新に失敗しました', error?.message || '商品ステータスの更新中にエラーが発生しました。')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('この商品を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      
      setProducts(products.filter(product => product.id !== productId))
      showSuccess('商品を削除しました', '商品が正常に削除されました。')
    } catch (error: any) {
      console.error('商品の削除に失敗しました:', error)
      showError('商品の削除に失敗しました', error?.message || '商品の削除中にエラーが発生しました。')
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '256px' }}>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      {/* ヘッダー */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="h2 fw-bold text-dark">商品一覧</h2>
            <div className="d-flex gap-3">
              <button 
                onClick={() => window.location.href = '/admin/products/add'}
                className="btn btn-success"
              >
                <i className="bi bi-plus-circle me-2"></i>
                新規商品追加
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-lg-4 col-md-6">
                  <label className="form-label fw-medium">
                    カテゴリ
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="all">すべてのカテゴリ</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-lg-4 col-md-6">
                  <label className="form-label fw-medium">
                    商品検索
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="商品名で検索..."
                    className="form-control"
                  />
                </div>
                <div className="col-lg-4 col-md-6 d-flex align-items-end">
                  <div className="text-muted small">
                    {filteredProducts.length} 件の商品
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 商品リスト */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            {/* デスクトップ用テーブル表示 */}
            <div className="d-none d-lg-block">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-medium text-muted text-uppercase small">
                        商品情報
                      </th>
                      <th className="fw-medium text-muted text-uppercase small">
                        カテゴリ
                      </th>
                      <th className="fw-medium text-muted text-uppercase small">
                        価格・単位
                      </th>
                      <th className="fw-medium text-muted text-uppercase small">
                        ステータス
                      </th>
                      <th className="fw-medium text-muted text-uppercase small">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-3 py-3">
                          <div className="d-flex align-items-center">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                width={64}
                                height={64}
                                className="rounded me-3"
                                style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                                unoptimized
                              />
                            ) : (
                              <div className="bg-light rounded d-flex align-items-center justify-content-center me-3" style={{ width: '64px', height: '64px' }}>
                                <i className="bi bi-box text-muted" style={{ fontSize: '1.5rem' }}></i>
                              </div>
                            )}
                            <div>
                              <div className="fw-medium text-dark">
                                {product.name}
                              </div>
                              {product.description && (
                                <div className="small text-muted text-truncate" style={{ maxWidth: '200px' }}>
                                  {product.description}
                                </div>
                              )}
                              {product.barcode && (
                                <div className="small text-muted">
                                  JAN: {product.barcode}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="badge bg-primary-subtle text-primary">
                            {product.category?.name || '未分類'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="fw-medium text-dark">
                            ¥{product.price.toLocaleString()}
                          </div>
                          <div className="small text-muted">
                            {product.unit}
                          </div>
                          {product.variation_name && (
                            <div className="small text-muted">
                              {product.variation_name}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => handleToggleAvailable(product.id, product.is_available)}
                            className={`btn btn-sm ${
                              product.is_available
                                ? 'btn-outline-success'
                                : 'btn-outline-danger'
                            }`}
                          >
                            {product.is_available ? (
                              <><i className="bi bi-check-circle me-1"></i>販売中</>
                            ) : (
                              <><i className="bi bi-x-circle me-1"></i>停止中</>
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <div className="d-flex gap-1">
                            <button 
                              onClick={() => window.location.href = `/admin/products/edit/${product.id}`}
                              className="btn btn-outline-primary btn-sm"
                            >
                              <i className="bi bi-pencil me-1"></i>
                              編集
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="btn btn-outline-danger btn-sm"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* モバイル・タブレット用カード表示 */}
            <div className="d-lg-none">
              <div className="card-body p-0">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="border-bottom p-3">
                    <div className="d-flex align-items-center mb-3">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={56}
                          height={56}
                          className="rounded me-3"
                          style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                          unoptimized
                        />
                      ) : (
                        <div className="bg-light rounded d-flex align-items-center justify-content-center me-3" style={{ width: '56px', height: '56px' }}>
                          <i className="bi bi-box text-muted" style={{ fontSize: '1.25rem' }}></i>
                        </div>
                      )}
                      <div className="flex-grow-1">
                        <div className="fw-medium text-dark">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="small text-muted text-truncate">
                            {product.description}
                          </div>
                        )}
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <span className="badge bg-primary-subtle text-primary">
                            {product.category?.name || '未分類'}
                          </span>
                          <button
                            onClick={() => handleToggleAvailable(product.id, product.is_available)}
                            className={`btn btn-sm ${
                              product.is_available
                                ? 'btn-outline-success'
                                : 'btn-outline-danger'
                            }`}
                          >
                            {product.is_available ? (
                              <><i className="bi bi-check-circle me-1"></i>販売中</>
                            ) : (
                              <><i className="bi bi-x-circle me-1"></i>停止中</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="row g-3 mb-3 small">
                      <div className="col-6">
                        <span className="text-muted">価格:</span>
                        <div className="fw-medium">¥{product.price.toLocaleString()}</div>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">単位:</span>
                        <div>{product.unit}</div>
                      </div>
                      {product.barcode && (
                        <div className="col-12">
                          <span className="text-muted">JAN:</span>
                          <div className="small">{product.barcode}</div>
                        </div>
                      )}
                      {product.variation_name && (
                        <div className="col-12">
                          <span className="text-muted">バリエーション:</span>
                          <div className="small">{product.variation_name}</div>
                        </div>
                      )}
                    </div>

                    <div className="d-flex justify-content-end gap-1">
                      <button 
                        onClick={() => window.location.href = `/admin/products/edit/${product.id}`}
                        className="btn btn-outline-primary btn-sm"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="btn btn-outline-danger btn-sm"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <i className="bi bi-box text-muted" style={{ fontSize: '4rem' }}></i>
              <h3 className="h5 fw-medium text-dark mt-3 mb-2">商品が見つかりません</h3>
              <p className="text-muted">検索条件を変更するか、新しい商品を追加してください。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}