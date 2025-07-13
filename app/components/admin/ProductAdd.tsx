'use client'

import React, { useState, useEffect } from 'react'
import { supabase, Product, ProductCategory } from '../../../lib/supabase'

interface CSVProduct {
  id?: string
  name: string
  barcode?: string
  price: number
  variation_name?: string
  tax_type?: string
  category_id?: string
  description?: string
  unit?: string
  stock_quantity?: number
  min_order_quantity?: number
  max_order_quantity?: number
}

export default function ProductAdd() {
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'single' | 'csv'>('single')
  const [csvData, setCsvData] = useState<string>('')
  const [csvPreview, setCsvPreview] = useState<CSVProduct[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // 単一商品追加フォーム
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    price: 0,
    unit: '個',
    stock_quantity: 0,
    min_order_quantity: 1,
    max_order_quantity: undefined as number | undefined,
    barcode: '',
    variation_name: '',
    tax_type: 'inclusive',
    image_url: '',
    is_available: true,
    display_order: 0
  })

  useEffect(() => {
    fetchCategories()
  }, [])

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

  const handleSingleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          ...formData,
          category_id: formData.category_id || null,
          max_order_quantity: formData.max_order_quantity || null
        }])

      if (error) throw error

      alert('商品が正常に追加されました！')
      
      // フォームをリセット
      setFormData({
        name: '',
        category_id: '',
        description: '',
        price: 0,
        unit: '個',
        stock_quantity: 0,
        min_order_quantity: 1,
        max_order_quantity: undefined,
        barcode: '',
        variation_name: '',
        tax_type: 'inclusive',
        image_url: '',
        is_available: true,
        display_order: 0
      })
    } catch (error) {
      console.error('商品の追加に失敗しました:', error)
      alert('商品の追加に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const parseCSV = (csvText: string): CSVProduct[] => {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data: CSVProduct[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const product: any = {}

      headers.forEach((header, index) => {
        const value = values[index] || ''
        
        switch (header.toLowerCase()) {
          case 'id':
            if (value) product.id = value
            break
          case 'name':
            product.name = value
            break
          case 'barcode':
            if (value) product.barcode = value
            break
          case 'price':
            product.price = parseFloat(value) || 0
            break
          case 'variation_name':
            if (value) product.variation_name = value
            break
          case 'tax_type':
            if (value) product.tax_type = value
            break
          case 'category_id':
            if (value) product.category_id = value
            break
          case 'description':
            if (value) product.description = value
            break
          case 'unit':
            if (value) product.unit = value
            break
          case 'stock_quantity':
            if (value) product.stock_quantity = parseInt(value) || 0
            break
          case 'min_order_quantity':
            if (value) product.min_order_quantity = parseInt(value) || 1
            break
          case 'max_order_quantity':
            if (value) product.max_order_quantity = parseInt(value)
            break
        }
      })

      if (product.name && product.price !== undefined) {
        data.push(product)
      }
    }

    return data
  }

  const handleCSVPreview = () => {
    const parsed = parseCSV(csvData)
    setCsvPreview(parsed)
    setShowPreview(true)
  }

  const handleCSVImport = async () => {
    if (csvPreview.length === 0) return

    setLoading(true)
    
    try {
      const errors: string[] = []
      
      for (const product of csvPreview) {
        try {
          if (product.id) {
            // 既存商品の更新
            const { error } = await supabase
              .from('products')
              .update({
                name: product.name,
                barcode: product.barcode,
                price: product.price,
                variation_name: product.variation_name,
                tax_type: product.tax_type || 'inclusive',
                category_id: product.category_id || null,
                description: product.description,
                unit: product.unit || '個',
                stock_quantity: product.stock_quantity ?? 0,
                min_order_quantity: product.min_order_quantity ?? 1,
                max_order_quantity: product.max_order_quantity || null
              })
              .eq('id', product.id)
            
            if (error) throw error
          } else {
            // 新規商品の追加
            const { error } = await supabase
              .from('products')
              .insert([{
                name: product.name,
                barcode: product.barcode,
                price: product.price,
                variation_name: product.variation_name,
                tax_type: product.tax_type || 'inclusive',
                category_id: product.category_id || null,
                description: product.description,
                unit: product.unit || '個',
                stock_quantity: product.stock_quantity ?? 0,
                min_order_quantity: product.min_order_quantity ?? 1,
                max_order_quantity: product.max_order_quantity || null,
                is_available: true,
                display_order: 0
              }])
            
            if (error) throw error
          }
        } catch (error) {
          errors.push(`商品「${product.name}」: ${error}`)
        }
      }

      if (errors.length > 0) {
        alert(`一部の商品でエラーが発生しました:\n${errors.join('\n')}`)
      } else {
        alert(`${csvPreview.length}件の商品が正常に処理されました！`)
      }
      
      setCsvData('')
      setCsvPreview([])
      setShowPreview(false)
    } catch (error) {
      console.error('CSV インポートに失敗しました:', error)
      alert('CSV インポートに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const generateCSVTemplate = () => {
    const headers = [
      'id', 'name', 'barcode', 'price', 'variation_name', 'tax_type',
      'category_id', 'description', 'unit', 'stock_quantity', 'min_order_quantity', 'max_order_quantity'
    ]
    
    const sampleData = [
      '', 'トマト苗', '4901234567890', '300', '通常価格', 'inclusive',
      categories[0]?.id || '', '中玉トマトの苗', '株', '50', '1', '20'
    ]

    return headers.join(',') + '\n' + sampleData.join(',')
  }

  const downloadCSVTemplate = () => {
    const csv = generateCSVTemplate()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'product_template.csv'
    link.click()
  }

  const exportProductsCSV = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const headers = [
        'id', 'name', 'barcode', 'price', 'variation_name', 'tax_type',
        'category_id', 'description', 'unit', 'stock_quantity', 'min_order_quantity', 'max_order_quantity'
      ]

      const csvContent = [
        headers.join(','),
        ...data.map(product => [
          product.id,
          `"${product.name}"`,
          product.barcode || '',
          product.price,
          product.variation_name || '',
          product.tax_type || '',
          product.category_id || '',
          `"${product.description || ''}"`,
          product.unit,
          product.stock_quantity,
          product.min_order_quantity,
          product.max_order_quantity || ''
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } catch (error) {
      console.error('CSV エクスポートに失敗しました:', error)
      alert('CSV エクスポートに失敗しました。')
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">商品追加</h2>
        <div className="flex gap-3">
          <button
            onClick={downloadCSVTemplate}
            className="btn-modern btn-outline-modern"
          >
            📄 CSVテンプレート
          </button>
          <button
            onClick={exportProductsCSV}
            className="btn-modern btn-secondary-modern"
          >
            📤 商品CSVエクスポート
          </button>
        </div>
      </div>

      {/* タブ */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'single'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              単一商品追加
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'csv'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              CSV一括追加
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'single' ? (
            /* 単一商品追加フォーム */
            <form onSubmit={handleSingleProductSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品名 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリ
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">カテゴリを選択</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    価格 *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    単位
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    初期在庫数
                  </label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    JANコード
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    価格バリエーション名
                  </label>
                  <input
                    type="text"
                    value={formData.variation_name}
                    onChange={(e) => setFormData({ ...formData, variation_name: e.target.value })}
                    placeholder="例: 通常価格、予約価格"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    税区分
                  </label>
                  <select
                    value={formData.tax_type}
                    onChange={(e) => setFormData({ ...formData, tax_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="inclusive">税込</option>
                    <option value="exclusive">税抜</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  商品説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最小注文数
                  </label>
                  <input
                    type="number"
                    value={formData.min_order_quantity}
                    onChange={(e) => setFormData({ ...formData, min_order_quantity: Number(e.target.value) })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大注文数
                  </label>
                  <input
                    type="number"
                    value={formData.max_order_quantity || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      max_order_quantity: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_available" className="text-sm font-medium text-gray-700">
                  販売中として追加
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-modern btn-primary-modern"
                >
                  {loading ? '追加中...' : '商品を追加'}
                </button>
              </div>
            </form>
          ) : (
            /* CSV一括追加 */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 mb-2">CSV形式について</h3>
                <p className="text-sm text-blue-700 mb-3">
                  以下の列を含むCSVファイルをアップロードしてください：
                </p>
                <div className="text-sm text-blue-700 space-y-1">
                  <div><strong>id:</strong> 既存商品ID（更新時のみ）</div>
                  <div><strong>name:</strong> 商品名（必須）</div>
                  <div><strong>barcode:</strong> JANコード</div>
                  <div><strong>price:</strong> 価格（必須）</div>
                  <div><strong>variation_name:</strong> 価格バリエーション名</div>
                  <div><strong>tax_type:</strong> 税区分（inclusive/exclusive）</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV データ
                </label>
                <textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  rows={10}
                  placeholder="CSVデータをここに貼り付けてください..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCSVPreview}
                  disabled={!csvData.trim()}
                  className="btn-modern btn-outline-modern"
                >
                  👁️ プレビュー
                </button>
                {showPreview && (
                  <button
                    onClick={handleCSVImport}
                    disabled={loading || csvPreview.length === 0}
                    className="btn-modern btn-success-modern"
                  >
                    {loading ? 'インポート中...' : `${csvPreview.length}件をインポート`}
                  </button>
                )}
              </div>

              {showPreview && csvPreview.length > 0 && (
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h4 className="font-medium text-gray-900">プレビュー ({csvPreview.length}件)</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">商品名</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">価格</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">バリエーション</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">JANコード</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {csvPreview.map((product, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">{product.name}</td>
                            <td className="px-4 py-2 text-sm">¥{product.price.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm">{product.variation_name || '-'}</td>
                            <td className="px-4 py-2 text-sm">{product.barcode || '-'}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                product.id ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {product.id ? '更新' : '新規'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}