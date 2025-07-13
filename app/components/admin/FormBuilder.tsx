'use client'

import React, { useState, useEffect } from 'react'
import { supabase, Product, ProductCategory } from '../../../lib/supabase'

// 定義済みフォーム項目
const PREDEFINED_FIELDS = {
  customer_name: {
    id: 'customer_name',
    type: 'text' as const,
    label: 'お名前',
    placeholder: '山田 太郎',
    required: true,
    description: 'フルネームでご記入ください',
    category: 'customer'
  },
  customer_email: {
    id: 'customer_email',
    type: 'email' as const,
    label: 'メールアドレス',
    placeholder: 'example@email.com',
    required: false,
    description: '確認メールをお送りします',
    category: 'customer'
  },
  customer_phone: {
    id: 'customer_phone',
    type: 'tel' as const,
    label: '電話番号',
    placeholder: '090-1234-5678',
    required: true,
    description: '緊急時のご連絡先',
    category: 'customer'
  },
  customer_postal_code: {
    id: 'customer_postal_code',
    type: 'text' as const,
    label: '郵便番号',
    placeholder: '123-4567',
    required: false,
    category: 'customer'
  },
  customer_address: {
    id: 'customer_address',
    type: 'textarea' as const,
    label: 'ご住所',
    placeholder: '東京都渋谷区...',
    required: false,
    category: 'customer'
  },
  reservation_date: {
    id: 'reservation_date',
    type: 'date' as const,
    label: '受取希望日',
    required: true,
    description: '商品をお受け取りいただく日をお選びください',
    category: 'reservation'
  },
  pickup_time: {
    id: 'pickup_time',
    type: 'select' as const,
    label: '受取時間帯',
    required: false,
    options: ['9:00-12:00', '12:00-15:00', '15:00-18:00'],
    category: 'reservation'
  },
  payment_method: {
    id: 'payment_method',
    type: 'radio' as const,
    label: 'お支払い方法',
    required: true,
    options: ['現金', 'クレジットカード', '銀行振込'],
    category: 'payment'
  },
  special_requests: {
    id: 'special_requests',
    type: 'textarea' as const,
    label: 'ご要望・備考',
    placeholder: 'その他ご要望がございましたらご記入ください',
    required: false,
    category: 'other'
  }
}

export interface FormField {
  id: string
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  description?: string
  category: string
  enabled: boolean
}

export interface FormProduct {
  id: string
  name: string
  category_name?: string
  price: number
  variation_name?: string
  selected_price?: number
  selected_variation?: string
}

export interface FormConfig {
  id: string
  name: string
  description: string
  fields: FormField[]
  products: FormProduct[]
  settings: {
    showProgress: boolean
    allowEdit: boolean
    confirmationMessage: string
    businessName: string
  }
}

export default function FormBuilder() {
  const [formConfig, setFormConfig] = useState<FormConfig>({
    id: 'reservation-form',
    name: '商品予約フォーム',
    description: '片桐商店 ベジライスの商品予約を承ります',
    fields: Object.values(PREDEFINED_FIELDS).map(field => ({ ...field, enabled: true })),
    products: [],
    settings: {
      showProgress: true,
      allowEdit: true,
      confirmationMessage: 'ご予約ありがとうございました。確認のお電話をさせていただきます。',
      businessName: '片桐商店 ベジライス'
    }
  })

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

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
        .eq('is_available', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('商品の取得に失敗しました:', error)
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

  const toggleField = (fieldId: string) => {
    setFormConfig({
      ...formConfig,
      fields: formConfig.fields.map(field =>
        field.id === fieldId ? { ...field, enabled: !field.enabled } : field
      )
    })
  }

  const addProduct = (product: Product, selectedPrice?: number, selectedVariation?: string) => {
    const formProduct: FormProduct = {
      id: product.id,
      name: product.name,
      category_name: product.category?.name,
      price: product.price,
      variation_name: product.variation_name,
      selected_price: selectedPrice || product.price,
      selected_variation: selectedVariation || product.variation_name
    }

    setFormConfig({
      ...formConfig,
      products: [...formConfig.products, formProduct]
    })
    setShowProductSelector(false)
  }

  const removeProduct = (productId: string) => {
    setFormConfig({
      ...formConfig,
      products: formConfig.products.filter(p => p.id !== productId)
    })
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const notAlreadySelected = !formConfig.products.find(p => p.id === product.id)
    
    return matchesCategory && matchesSearch && notAlreadySelected
  })

  const categoryGroups = {
    customer: { title: '顧客情報', icon: '👤' },
    reservation: { title: '予約情報', icon: '📅' },
    payment: { title: '支払い情報', icon: '💰' },
    other: { title: 'その他', icon: '📝' }
  }

  const generateFormURL = () => {
    const baseURL = window.location.origin
    return `${baseURL}/form/${formConfig.id}`
  }

  const generateQRCode = () => {
    const url = generateFormURL()
    const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
    return qrURL
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">予約フォーム設定</h2>
          <p className="text-gray-600">フォーム項目と予約対象商品を設定します</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowQRCode(!showQRCode)}
            className="btn-modern btn-outline-modern"
          >
            📱 QRコード表示
          </button>
          <button className="btn-modern btn-success-modern">
            💾 設定を保存
          </button>
        </div>
      </div>

      {/* QRコード表示モーダル */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">フォームQRコード</h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="btn-modern btn-ghost-modern btn-sm"
              >
                ✕
              </button>
            </div>
            <div className="text-center">
              <img
                src={generateQRCode()}
                alt="フォームQRコード"
                className="mx-auto mb-4"
              />
              <p className="text-sm text-gray-600 mb-3">このQRコードで予約フォームにアクセスできます</p>
              <div className="text-xs bg-gray-100 p-2 rounded break-all">
                {generateFormURL()}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(generateFormURL())}
                className="btn-modern btn-secondary-modern mt-3"
              >
                URLをコピー
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側: 設定パネル */}
        <div className="space-y-6">
          {/* 基本設定 */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">基本設定</h3>
            </div>
            <div className="admin-card-content space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  フォーム名
                </label>
                <input
                  type="text"
                  value={formConfig.name}
                  onChange={(e) => setFormConfig({ ...formConfig, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  説明文
                </label>
                <textarea
                  value={formConfig.description}
                  onChange={(e) => setFormConfig({ ...formConfig, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* フォーム項目設定 */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">フォーム項目設定</h3>
            </div>
            <div className="admin-card-content">
              {Object.entries(categoryGroups).map(([categoryKey, category]) => (
                <div key={categoryKey} className="mb-6">
                  <h4 className="flex items-center gap-2 font-medium text-gray-900 mb-3">
                    <span>{category.icon}</span>
                    {category.title}
                  </h4>
                  <div className="space-y-2">
                    {formConfig.fields
                      .filter(field => field.category === categoryKey)
                      .map(field => (
                        <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{field.label}</div>
                            <div className="text-sm text-gray-500">
                              {field.type} {field.required && '(必須)'}
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.enabled}
                              onChange={() => toggleField(field.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 予約対象商品 */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="flex justify-between items-center">
                <h3 className="admin-card-title">予約対象商品</h3>
                <button
                  onClick={() => setShowProductSelector(true)}
                  className="btn-modern btn-primary-modern btn-sm"
                >
                  📦 商品を追加
                </button>
              </div>
            </div>
            <div className="admin-card-content">
              {formConfig.products.length > 0 ? (
                <div className="space-y-3">
                  {formConfig.products.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          ¥{product.selected_price?.toLocaleString()} 
                          {product.selected_variation && ` (${product.selected_variation})`}
                          {product.category_name && ` - ${product.category_name}`}
                        </div>
                      </div>
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="btn-modern btn-danger-modern btn-sm btn-icon-only"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📦</div>
                  <p>予約対象商品が設定されていません</p>
                  <p className="text-sm">「商品を追加」ボタンから商品を選択してください</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右側: プレビュー */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">フォームプレビュー</h3>
          </div>
          <div className="admin-card-content">
            <div className="max-w-md mx-auto bg-white border rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{formConfig.name}</h2>
              <p className="text-gray-600 mb-6">{formConfig.description}</p>

              <form className="space-y-4">
                {formConfig.fields
                  .filter(field => field.enabled)
                  .map(field => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          rows={2}
                        />
                      ) : field.type === 'select' ? (
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                          <option>選択してください</option>
                          {field.options?.map((option, index) => (
                            <option key={index}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'radio' ? (
                        <div className="space-y-2">
                          {field.options?.map((option, index) => (
                            <label key={index} className="flex items-center text-sm">
                              <input type="radio" name={field.id} className="mr-2" />
                              {option}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      )}
                      {field.description && (
                        <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                      )}
                    </div>
                  ))}

                {formConfig.products.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ご希望の商品 <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {formConfig.products.map(product => (
                        <label key={product.id} className="flex items-center text-sm p-2 border rounded">
                          <input type="checkbox" className="mr-2" />
                          <span className="flex-1">{product.name}</span>
                          <span className="text-gray-600">¥{product.selected_price?.toLocaleString()}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  予約を送信
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 商品選択モーダル */}
      {showProductSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">商品を選択</h3>
                <button
                  onClick={() => setShowProductSelector(false)}
                  className="btn-modern btn-ghost-modern btn-sm"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="商品名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全カテゴリ</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map(product => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-gray-500">{product.category?.name}</p>
                        {product.description && (
                          <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-lg font-bold text-blue-600">
                        ¥{product.price.toLocaleString()}
                      </div>
                      {product.variation_name && (
                        <div className="text-sm text-gray-500">{product.variation_name}</div>
                      )}
                      <div className="text-sm text-gray-500">在庫: {product.stock_quantity}</div>
                    </div>

                    <button
                      onClick={() => addProduct(product)}
                      className="w-full btn-modern btn-primary-modern btn-sm"
                    >
                      フォームに追加
                    </button>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>条件に合う商品が見つかりません</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}