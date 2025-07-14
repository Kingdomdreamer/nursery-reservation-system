'use client'

import React, { useState, useEffect } from 'react'
import { supabase, Product, ProductCategory } from '../../../lib/supabase'
import { Icons, Icon } from '../icons/Icons'

export interface ProductSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onProductSelect: (product: Product, selectedPrice?: number, selectedVariation?: string, quantity?: number) => void
  excludeProductIds?: string[]
}

export interface ProductWithVariations extends Product {
  stock_quantity?: number
  variations?: Array<{
    id: string
    name: string
    price: number
    stock_quantity: number
  }>
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  isOpen,
  onClose,
  onProductSelect,
  excludeProductIds = []
}) => {
  const [products, setProducts] = useState<ProductWithVariations[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithVariations | null>(null)
  const [selectedVariation, setSelectedVariation] = useState<string>('')
  const [selectedPrice, setSelectedPrice] = useState<number>(0)
  const [quantity, setQuantity] = useState<number>(1)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      fetchCategories()
    }
  }, [isOpen])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(*),
          variations:product_variations(*)
        `)
        .eq('is_available', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('商品の取得に失敗しました:', error)
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
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const notExcluded = !excludeProductIds.includes(product.id)
    
    return matchesCategory && matchesSearch && notExcluded
  })

  const handleProductClick = (product: ProductWithVariations) => {
    if (product.variations && product.variations.length > 0) {
      // バリエーションがある場合は詳細モーダルを表示
      setSelectedProduct(product)
      setSelectedVariation(product.variations[0].id)
      setSelectedPrice(product.variations[0].price)
      setQuantity(1)
      setShowDetailModal(true)
    } else {
      // バリエーションがない場合は直接追加
      handleProductAdd(product)
    }
  }

  const handleProductAdd = (product: ProductWithVariations, variation?: string, price?: number, qty?: number) => {
    onProductSelect(product, price || product.price, variation, qty || 1)
    handleClose()
  }

  const handleDetailConfirm = () => {
    if (selectedProduct) {
      const variation = selectedProduct.variations?.find(v => v.id === selectedVariation)
      handleProductAdd(
        selectedProduct,
        variation?.name,
        selectedPrice,
        quantity
      )
    }
    setShowDetailModal(false)
  }

  const handleClose = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedProduct(null)
    setSelectedVariation('')
    setSelectedPrice(0)
    setQuantity(1)
    setShowDetailModal(false)
    onClose()
  }

  const handleVariationChange = (variationId: string) => {
    setSelectedVariation(variationId)
    const variation = selectedProduct?.variations?.find(v => v.id === variationId)
    if (variation) {
      setSelectedPrice(variation.price)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* メイン商品選択モーダル */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden">
          {/* ヘッダー */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Icon icon={Icons.packageIcon} size="lg" />
                <span>商品を選択</span>
              </h3>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon icon={Icons.closeIcon} size="md" />
              </button>
            </div>
            
            {/* 検索・フィルター */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon icon={Icons.searchIcon} size="sm" className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="商品名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全カテゴリ</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchProducts}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <Icon icon={Icons.refresh} size="sm" />
              </button>
            </div>
          </div>

          {/* 商品リスト */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Icon icon={Icons.loading} size="lg" className="animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">商品を読み込み中...</span>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    {/* 商品画像エリア */}
                    <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      <Icon icon={Icons.packageIcon} size="xl" className="text-gray-400" />
                    </div>

                    {/* 商品情報 */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 line-clamp-2">{product.name}</h4>
                      <p className="text-sm text-gray-500">{product.category?.name}</p>
                      
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-bold text-blue-600">
                            ¥{product.price.toLocaleString()}
                          </div>
                          {product.variations && product.variations.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {product.variations.length}種類の選択肢
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {product.stock_quantity !== undefined && product.stock_quantity !== null && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              product.stock_quantity > 10 
                                ? 'bg-green-100 text-green-800' 
                                : product.stock_quantity > 0 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              在庫: {product.stock_quantity}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleProductClick(product)
                        }}
                      >
                        {product.variations && product.variations.length > 0 ? '詳細設定' : '追加'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Icon icon={Icons.searchIcon} size="xl" className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">条件に合う商品が見つかりません</p>
                <p className="text-sm text-gray-500 mt-2">検索条件を変更してお試しください</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 商品詳細設定モーダル */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">商品設定</h4>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">{selectedProduct.name}</h5>
                <p className="text-sm text-gray-600">{selectedProduct.description}</p>
              </div>

              {selectedProduct.variations && selectedProduct.variations.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    バリエーション
                  </label>
                  <select
                    value={selectedVariation}
                    onChange={(e) => handleVariationChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {selectedProduct.variations.map(variation => (
                      <option key={variation.id} value={variation.id}>
                        {variation.name} - ¥{variation.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  価格
                </label>
                <input
                  type="number"
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  デフォルト数量
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>

            <div className="p-6 pt-0 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDetailConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProductSelectionModal