'use client'

import React, { useState, useEffect } from 'react'
import { ProductService, CSVProduct } from '../../lib/services/ProductService'
import { ProductCategory } from '../../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'

export default function ProductAdd() {
  const { showSuccess, showError, showWarning } = useToast()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'single' | 'csv'>('single')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string>('')
  const [csvPreview, setCsvPreview] = useState<CSVProduct[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // 単一商品追加フォーム
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    price: 0,
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
      const data = await ProductService.getAllCategories()
      setCategories(data)
    } catch (error) {
      console.error('カテゴリの取得に失敗しました:', error)
      showError('カテゴリの取得に失敗しました', 'カテゴリ情報を読み込めませんでした。ページを再読み込みしてください。')
      setCategories([])
    }
  }

  const handleSingleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await ProductService.createProduct({
        ...formData,
        category_id: formData.category_id || undefined
      })

      showSuccess('商品を追加しました', '商品が正常に登録されました。')
      
      // フォームをリセット
      setFormData({
        name: '',
        category_id: '',
        description: '',
        price: 0,
        barcode: '',
        variation_name: '',
        tax_type: 'inclusive',
        image_url: '',
        is_available: true,
        display_order: 0
      })
    } catch (error: any) {
      console.error('商品の追加に失敗しました:', error)
      showError('商品の追加に失敗しました', error?.message || '商品の登録中にエラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCsvFile(file)
      setShowPreview(false)
      setCsvPreview([])
    }
  }

  const parseCSV = (csvText: string): CSVProduct[] => {
    return ProductService.parseCSV(csvText)
  }

  const handleCSVPreview = async () => {
    if (!csvFile) return
    
    try {
      const text = await csvFile.text()
      setCsvData(text)
      
      // ファイルサイズチェック（10MB制限）
      if (csvFile.size > 10 * 1024 * 1024) {
        throw new Error('ファイルサイズが大きすぎます（10MB以下のファイルをアップロードしてください）')
      }
      
      // ファイル形式チェック
      if (!csvFile.name.toLowerCase().endsWith('.csv') && !csvFile.name.toLowerCase().endsWith('.txt')) {
        throw new Error('CSVファイル（.csv または .txt）をアップロードしてください')
      }
      
      const parsed = ProductService.parseCSV(text)
      setCsvPreview(parsed)
      setShowPreview(true)
      
      // プレビュー成功メッセージ
      if (parsed.length > 0) {
        console.log(`✅ ${parsed.length}件の商品データを読み込みました`)
      }
      
    } catch (error: any) {
      console.error('CSVファイルの解析に失敗しました:', error)
      const errorMessage = error?.message || 'ファイルの読み込みに失敗しました'
      showError('CSVファイルの解析に失敗しました', `${errorMessage}\n\n以下を確認してください:\n- ファイル形式（CSV形式）\n- 文字エンコーディング（UTF-8推奨）\n- 必須列（name）の存在`)
      
      // プレビューをクリア
      setCsvPreview([])
      setShowPreview(false)
    }
  }

  const handleCSVImport = async () => {
    if (csvPreview.length === 0) return

    setLoading(true)
    
    try {
      const results = await ProductService.bulkImportProducts(csvPreview)

      // 結果の詳細表示
      let message = `処理結果:\n成功: ${results.success}件\n失敗: ${results.failed}件`
      
      if (results.warnings && results.warnings.length > 0) {
        message += `\n\n⚠️ 警告:\n${results.warnings.join('\n')}`
      }
      
      if (results.errors.length > 0) {
        message += `\n\n❌ エラー:\n${results.errors.join('\n')}`
      }
      
      if (results.failed === 0 && results.errors.length === 0) {
        message += '\n\n✅ すべての商品が正常に処理されました！'
      }

      // モーダルダイアログでの表示（アラートの代わり）
      const shouldContinue = confirm(message + '\n\n処理を完了しますか？')
      
      if (shouldContinue) {
        setCsvFile(null)
        setCsvData('')
        setCsvPreview([])
        setShowPreview(false)
      }
    } catch (error: any) {
      console.error('CSV インポートに失敗しました:', error)
      const errorMessage = error?.message || error?.toString() || '不明なエラーが発生しました'
      showError('CSV インポートに失敗しました', `${errorMessage}\n\nCSVファイルの形式を確認してください。`)
    } finally {
      setLoading(false)
    }
  }

  const generateCSVTemplate = () => {
    return ProductService.generateCSVTemplate(categories)
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
      const csvContent = await ProductService.exportToCSV()

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } catch (error: any) {
      console.error('CSV エクスポートに失敗しました:', error)
      showError('CSV エクスポートに失敗しました', error?.message || 'エクスポート処理中にエラーが発生しました。')
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">商品追加</h2>
          <p className="text-gray-600">新しい商品を登録または一括アップロードします</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadCSVTemplate}
            className="btn-modern btn-outline-modern flex items-center gap-2"
            title="CSV形式のテンプレートファイルをダウンロード"
          >
            <span className="text-lg">📄</span>
            CSVテンプレート
          </button>
          <button
            onClick={exportProductsCSV}
            className="btn-modern btn-secondary-modern flex items-center gap-2"
            title="現在の商品データをCSV形式でエクスポート"
          >
            <span className="text-lg">📤</span>
            商品エクスポート
          </button>
        </div>
      </div>

      {/* タブ */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b bg-gray-50">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'single'
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">📝</span>
              単一商品追加
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">推奨</span>
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'csv'
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">📊</span>
              CSV一括追加
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">上級者向け</span>
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

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({
                    name: '',
                    category_id: '',
                    description: '',
                    price: 0,
                    barcode: '',
                    variation_name: '',
                    tax_type: 'inclusive',
                    image_url: '',
                    is_available: true,
                    display_order: 0
                  })}
                  className="btn-modern btn-secondary-modern"
                >
                  リセット
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-modern btn-success-modern flex items-center gap-2 px-6"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      追加中...
                    </>
                  ) : (
                    <>
                      <span className="text-lg">✅</span>
                      商品を追加する
                    </>
                  )}
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
                  <div><strong>barcode:</strong> JANコード（任意）</div>
                  <div><strong>price:</strong> 価格（任意、デフォルト0）</div>
                  <div><strong>variation_name:</strong> 価格バリエーション名（任意）</div>
                  <div><strong>tax_type:</strong> 税区分（任意、inclusive/exclusive）</div>
                  <div><strong>category_id:</strong> カテゴリID（任意）</div>
                  <div><strong>description:</strong> 商品説明（任意）</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSVファイルをアップロード
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-8 w-8" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="text-gray-600">
                      {csvFile ? (
                        <>
                          <span className="font-medium text-blue-600">{csvFile.name}</span>
                          <p className="text-sm text-gray-500 mt-1">クリックして別のファイルを選択</p>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">クリックしてCSVファイルをアップロード</span>
                          <p className="text-sm text-gray-500 mt-1">またはファイルをドラッグ&ドロップ</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
                {csvFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    ファイルサイズ: {(csvFile.size / 1024).toFixed(1)} KB
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCSVPreview}
                  disabled={!csvFile}
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
                            <td className="px-4 py-2 text-sm">¥{(product.price || 0).toLocaleString()}</td>
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