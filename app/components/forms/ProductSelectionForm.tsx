'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Icons, Icon } from '@/components/icons/Icons'

interface Product {
  id: string
  name: string
  price: number
  category_id: string
  category_name?: string
  description?: string
  unit?: string
  min_order_quantity?: number
  max_order_quantity?: number
  is_available: boolean
  image_url?: string
  seasonal_availability?: any
}

interface ProductCategory {
  id: string
  name: string
  description?: string
  is_active: boolean
  display_order?: number
}

interface SelectedProduct {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  category_name?: string
  unit?: string
}

interface ProductSelectionFormProps {
  onSelectionChange: (products: SelectedProduct[]) => void
  initialSelection?: SelectedProduct[]
  allowMultiple?: boolean
  showCategories?: boolean
  showSearch?: boolean
  showPrices?: boolean
  maxItems?: number
  restrictToCategories?: string[]
  onCancel?: () => void
}

export default function ProductSelectionForm({
  onSelectionChange,
  initialSelection = [],
  allowMultiple = true,
  showCategories = true,
  showSearch = true,
  showPrices = true,
  maxItems,
  restrictToCategories,
  onCancel
}: ProductSelectionFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(initialSelection)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    onSelectionChange(selectedProducts)
  }, [selectedProducts, onSelectionChange])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 商品とカテゴリの取得
      const [productsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            category:product_categories(*)
          `)
          .eq('is_available', true)
          .order('name'),
        supabase
          .from('product_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order')
      ])

      if (productsResponse.error) throw productsResponse.error
      if (categoriesResponse.error) throw categoriesResponse.error

      // 商品データの整形
      const productsWithCategory = productsResponse.data.map(product => ({
        ...product,
        category_name: product.category?.name || 'その他',
        min_order_quantity: product.min_order_quantity || 1,
        max_order_quantity: product.max_order_quantity || 99,
        unit: product.unit || '個'
      }))

      // カテゴリ制限がある場合はフィルタリング
      const filteredProducts = restrictToCategories
        ? productsWithCategory.filter(p => restrictToCategories.includes(p.category_id))
        : productsWithCategory

      setProducts(filteredProducts)
      setCategories(categoriesResponse.data)
    } catch (error) {
      console.error('データの取得に失敗しました:', error)
      setError('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    if (selectedCategory !== 'all' && product.category_id !== selectedCategory) {
      return false
    }
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  const addProduct = (product: Product) => {
    if (!allowMultiple && selectedProducts.length > 0) {
      // 単一選択の場合は既存を置き換え
      const newProduct: SelectedProduct = {
        product_id: product.id,
        product_name: product.name,
        quantity: product.min_order_quantity || 1,
        unit_price: product.price,
        subtotal: product.price * (product.min_order_quantity || 1),
        category_name: product.category_name,
        unit: product.unit
      }
      setSelectedProducts([newProduct])
      return
    }

    if (maxItems && selectedProducts.length >= maxItems) {
      alert(`最大${maxItems}個までしか選択できません`)
      return
    }

    const existingProduct = selectedProducts.find(p => p.product_id === product.id)
    
    if (existingProduct) {
      // 既存商品の数量を増やす
      const newQuantity = existingProduct.quantity + 1
      const maxQuantity = product.max_order_quantity || 99
      
      if (newQuantity <= maxQuantity) {
        updateProductQuantity(product.id, newQuantity)
      } else {
        alert(`${product.name}は最大${maxQuantity}個まで選択できます`)
      }
    } else {
      // 新規商品を追加
      const newProduct: SelectedProduct = {
        product_id: product.id,
        product_name: product.name,
        quantity: product.min_order_quantity || 1,
        unit_price: product.price,
        subtotal: product.price * (product.min_order_quantity || 1),
        category_name: product.category_name,
        unit: product.unit
      }
      
      setSelectedProducts(prev => [...prev, newProduct])
    }
  }

  const updateProductQuantity = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const minQuantity = product.min_order_quantity || 1
    const maxQuantity = product.max_order_quantity || 99

    if (quantity < minQuantity) {
      if (quantity <= 0) {
        removeProduct(productId)
      } else {
        alert(`${product.name}は最低${minQuantity}個から選択できます`)
      }
      return
    }

    if (quantity > maxQuantity) {
      alert(`${product.name}は最大${maxQuantity}個まで選択できます`)
      return
    }

    setSelectedProducts(prev => 
      prev.map(item => 
        item.product_id === productId 
          ? { ...item, quantity, subtotal: item.unit_price * quantity }
          : item
      )
    )
  }

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(item => item.product_id !== productId))
  }

  const getTotalAmount = () => {
    return selectedProducts.reduce((total, item) => total + item.subtotal, 0)
  }

  const getTotalQuantity = () => {
    return selectedProducts.reduce((total, item) => total + item.quantity, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon icon={Icons.loading} size="xl" className="animate-spin text-green-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <Icon icon={Icons.error} size="sm" className="text-red-400 mt-0.5" />
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">商品選択</h2>
        <p className="text-gray-600">
          {allowMultiple ? 'ご希望の商品を選択してください' : '商品を1つ選択してください'}
        </p>
      </div>

      {/* 選択済み商品の表示 */}
      {selectedProducts.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-green-900">選択済み商品</h3>
            <div className="text-sm text-green-700">
              {getTotalQuantity()}個 
              {showPrices && ` | ¥${getTotalAmount().toLocaleString()}`}
            </div>
          </div>
          <div className="space-y-2">
            {selectedProducts.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between bg-white p-3 rounded border">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.product_name}</div>
                  <div className="text-sm text-gray-600">
                    {item.category_name}
                    {showPrices && ` | ¥${item.unit_price.toLocaleString()} / ${item.unit}`}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateProductQuantity(item.product_id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">
                    {item.quantity}{item.unit}
                  </span>
                  <button
                    onClick={() => updateProductQuantity(item.product_id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeProduct(item.product_id)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <Icon icon={Icons.trash} size="sm" />
                  </button>
                </div>
                {showPrices && (
                  <div className="ml-4 font-medium text-gray-900">
                    ¥{item.subtotal.toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 検索・フィルター */}
      {(showCategories || showSearch) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {showCategories && (
            <div className="flex-1">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">すべてのカテゴリ</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {showSearch && (
            <div className="flex-1">
              <input
                type="text"
                placeholder="商品名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}
        </div>
      )}

      {/* 商品一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProducts.map((product) => {
          const isSelected = selectedProducts.some(p => p.product_id === product.id)
          const selectedItem = selectedProducts.find(p => p.product_id === product.id)
          
          return (
            <div key={product.id} className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${
              isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{product.category_name}</p>
                  {product.description && (
                    <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                  )}
                  {showPrices && (
                    <div className="mt-2">
                      <span className="text-lg font-semibold text-green-600">
                        ¥{product.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-600 ml-1">/ {product.unit}</span>
                    </div>
                  )}
                  {(product.min_order_quantity > 1 || product.max_order_quantity < 99) && (
                    <div className="mt-1 text-xs text-gray-500">
                      {product.min_order_quantity > 1 && `最小注文数: ${product.min_order_quantity}${product.unit}`}
                      {product.min_order_quantity > 1 && product.max_order_quantity < 99 && ' | '}
                      {product.max_order_quantity < 99 && `最大注文数: ${product.max_order_quantity}${product.unit}`}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex flex-col items-end">
                  {isSelected && selectedItem ? (
                    <div className="text-sm text-green-700 mb-2">
                      {selectedItem.quantity}{product.unit} 選択中
                    </div>
                  ) : null}
                  <button
                    onClick={() => addProduct(product)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isSelected 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isSelected ? '追加' : '選択'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-8">
          <Icon icon={Icons.search} size="xl" className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">条件に一致する商品がありません</p>
        </div>
      )}

      {/* フッター */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {selectedProducts.length}個の商品を選択
          {maxItems && ` (最大${maxItems}個)`}
        </div>
        <div className="flex space-x-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              キャンセル
            </button>
          )}
          <button
            onClick={() => setSelectedProducts([])}
            disabled={selectedProducts.length === 0}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            クリア
          </button>
        </div>
      </div>
    </div>
  )
}