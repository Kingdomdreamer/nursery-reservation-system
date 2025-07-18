'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      const data = await ProductService.getAllCategories()
      setCategories(data)
    } catch (error) {
      console.error('カテゴリの取得に失敗しました:', error)
      showError('カテゴリの取得に失敗しました', 'カテゴリ情報を読み込めませんでした。ページを再読み込みしてください。')
      setCategories([])
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        resolve(result)
      }
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
      reader.readAsDataURL(file)
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('ファイルサイズが大きすぎます', '5MB以下のファイルを選択してください。')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        showError('不正なファイル形式です', '画像ファイルを選択してください。')
        return
      }
      
      setImageFile(file)
    }
  }

  const uploadImage = async () => {
    if (!imageFile) return ''
    
    setUploadingImage(true)
    try {
      const dataUrl = await handleImageUpload(imageFile)
      return dataUrl
    } catch (error) {
      console.error('画像アップロードエラー:', error)
      showError('画像のアップロードに失敗しました', '画像の処理中にエラーが発生しました。')
      return ''
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSingleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = formData.image_url
      
      if (imageFile) {
        imageUrl = await uploadImage()
        if (!imageUrl) {
          setLoading(false)
          return
        }
      }

      await ProductService.createProduct({
        ...formData,
        category_id: formData.category_id || undefined,
        image_url: imageUrl
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
      setImageFile(null)
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
    if (!csvFile) {
      showError('ファイル未選択', 'CSVファイルを選択してください')
      return
    }
    
    try {
      console.log('CSVファイル情報:', {
        name: csvFile.name,
        size: csvFile.size,
        type: csvFile.type,
        lastModified: new Date(csvFile.lastModified).toISOString()
      })
      
      // ファイルサイズチェック（10MB制限）
      if (csvFile.size > 10 * 1024 * 1024) {
        throw new Error('ファイルサイズが大きすぎます（10MB以下のファイルをアップロードしてください）')
      }
      
      // ファイルサイズチェック（最小サイズ）
      if (csvFile.size === 0) {
        throw new Error('ファイルが空です')
      }
      
      // ファイル形式チェック
      if (!csvFile.name.toLowerCase().endsWith('.csv') && !csvFile.name.toLowerCase().endsWith('.txt')) {
        throw new Error('CSVファイル（.csv または .txt）をアップロードしてください')
      }
      
      // FileReaderを使用してより安全にファイルを読み取り
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve(event.target.result as string)
          } else {
            reject(new Error('ファイルの読み込みに失敗しました'))
          }
        }
        
        reader.onerror = () => {
          reject(new Error(`ファイル読み込みエラー: ${reader.error?.message || '不明なエラー'}`))
        }
        
        reader.onabort = () => {
          reject(new Error('ファイルの読み込みが中断されました'))
        }
        
        // UTF-8でテキストとして読み込み
        reader.readAsText(csvFile, 'UTF-8')
      })
      
      console.log('ファイル読み込み成功。サイズ:', text.length, '文字')
      
      // BOMを除去（UTF-8 BOMが存在する場合）
      const cleanText = text.replace(/^\uFEFF/, '')
      
      // 基本的な内容チェック
      if (!cleanText.trim()) {
        throw new Error('ファイルが空または読み取れませんでした')
      }
      
      // 行数チェック
      const lines = cleanText.split(/\r?\n/).filter(line => line.trim())
      if (lines.length < 2) {
        throw new Error('CSVファイルにはヘッダー行とデータ行が必要です（最低2行）')
      }
      
      console.log('CSV行数:', lines.length)
      console.log('ヘッダー行:', lines[0])
      
      setCsvData(cleanText)
      
      const parsed = ProductService.parseCSV(cleanText)
      setCsvPreview(parsed)
      setShowPreview(true)
      
      // プレビュー成功メッセージ
      if (parsed.length > 0) {
        console.log(`✅ ${parsed.length}件の商品データを読み込みました`)
        showSuccess('CSVプレビュー成功', `${parsed.length}件の商品データを読み込みました`)
      } else {
        showWarning('データなし', '有効な商品データが見つかりませんでした')
      }
      
    } catch (error: any) {
      console.error('CSVファイルの解析に失敗しました:', error)
      
      let errorMessage = error?.message || 'ファイルの読み込みに失敗しました'
      
      // より具体的なエラーメッセージを生成
      if (errorMessage.includes('Permission')) {
        errorMessage = 'ファイルへのアクセス権限がありません。ファイルを再選択してください。'
      } else if (errorMessage.includes('encoding')) {
        errorMessage = 'ファイルの文字エンコーディングが正しくありません。UTF-8形式で保存し直してください。'
      } else if (errorMessage.includes('required')) {
        errorMessage = 'CSVファイルに必須列（name）が含まれていません。'
      }
      
      showError('CSVファイルの解析に失敗しました', `${errorMessage}\n\n以下を確認してください:\n• ファイル形式：CSV形式（.csv または .txt）\n• 文字エンコーディング：UTF-8推奨\n• 必須列：name列の存在\n• ファイルサイズ：10MB以下\n• 権限：ファイルにアクセス可能`)
      
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
    <div>
      {/* ヘッダー */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h3 fw-bold text-dark">商品追加</h2>
              <p className="text-muted">新しい商品を登録または一括アップロードします</p>
            </div>
            <div className="d-flex gap-3">
              <button
                onClick={downloadCSVTemplate}
                className="btn btn-outline-secondary d-flex align-items-center gap-2"
                title="CSV形式のテンプレートファイルをダウンロード"
              >
                <i className="bi bi-file-earmark-spreadsheet"></i>
                CSVテンプレート
              </button>
              <button
                onClick={exportProductsCSV}
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                title="現在の商品データをCSV形式でエクスポート"
              >
                <i className="bi bi-download"></i>
                商品エクスポート
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="card">
        <div className="card-header bg-light">
          <nav className="nav nav-tabs card-header-tabs">
            <button
              onClick={() => setActiveTab('single')}
              className={`nav-link ${activeTab === 'single' ? 'active' : ''}`}
              style={activeTab === 'single' ? {
                background: 'linear-gradient(135deg, #8bc34a 0%, #7cb342 100%)',
                color: 'white',
                border: 'none'
              } : {}}
            >
              <i className="bi bi-plus-circle me-2"></i>
              単一商品追加
              <span className="badge bg-light text-dark ms-2">推奨</span>
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`nav-link ${activeTab === 'csv' ? 'active' : ''}`}
              style={activeTab === 'csv' ? {
                background: 'linear-gradient(135deg, #8bc34a 0%, #7cb342 100%)',
                color: 'white',
                border: 'none'
              } : {}}
            >
              <i className="bi bi-file-earmark-spreadsheet me-2"></i>
              CSV一括追加
              <span className="badge bg-warning text-dark ms-2">上級者向け</span>
            </button>
          </nav>
        </div>

        <div className="card-body">
          {activeTab === 'single' ? (
            /* 単一商品追加フォーム */
            <form onSubmit={handleSingleProductSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-medium">
                    商品名 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="form-control"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">
                    カテゴリ
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="form-select"
                  >
                    <option value="">カテゴリを選択</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">
                    価格 *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                    min="0"
                    step="0.01"
                    className="form-control"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">
                    JANコード
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">
                    価格バリエーション名
                  </label>
                  <input
                    type="text"
                    value={formData.variation_name}
                    onChange={(e) => setFormData({ ...formData, variation_name: e.target.value })}
                    placeholder="例: 通常価格、予約価格"
                    className="form-control"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">
                    税区分
                  </label>
                  <select
                    value={formData.tax_type}
                    onChange={(e) => setFormData({ ...formData, tax_type: e.target.value })}
                    className="form-select"
                  >
                    <option value="inclusive">税込</option>
                    <option value="exclusive">税抜</option>
                  </select>
                </div>
              </div>

              <div className="row g-3 mt-3">
                <div className="col-12">
                  <label className="form-label fw-medium">
                    商品説明
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="form-control"
                  />
                </div>
              </div>

              {/* 画像アップロード */}
              <div className="row g-3 mt-3">
                <div className="col-12">
                  <label className="form-label fw-medium">
                    商品画像
                  </label>
                  <div className="d-flex flex-column gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="d-none"
                      id="image-upload"
                    />
                    <label 
                      htmlFor="image-upload" 
                      className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 w-fit"
                    >
                      <i className="bi bi-cloud-upload"></i>
                      画像を選択
                    </label>
                    
                    {imageFile && (
                      <div className="d-flex align-items-center gap-3">
                        <div className="text-muted small">
                          選択されたファイル: {imageFile.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => setImageFile(null)}
                          className="btn btn-outline-danger btn-sm"
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      </div>
                    )}
                    
                    {imageFile && (
                      <div className="mt-2">
                        <img 
                          src={URL.createObjectURL(imageFile)} 
                          alt="商品画像プレビュー" 
                          className="rounded border"
                          style={{ width: '128px', height: '128px', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    
                    <div className="text-muted small">
                      推奨サイズ: 400x400px以上、最大5MB
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-3 mt-3">
                <div className="col-12">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="is_available"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                      className="form-check-input"
                    />
                    <label htmlFor="is_available" className="form-check-label fw-medium">
                      販売中として追加
                    </label>
                  </div>
                </div>
              </div>

              <div className="row g-3 mt-4">
                <div className="col-12">
                  <div className="d-flex justify-content-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
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
                        setImageFile(null)
                      }}
                      className="btn btn-outline-secondary"
                    >
                      リセット
                    </button>
                    <button
                      type="submit"
                      disabled={loading || uploadingImage}
                      className="btn text-white"
                      style={{ 
                        background: 'linear-gradient(135deg, #8bc34a 0%, #7cb342 100%)',
                        border: 'none'
                      }}
                    >
                      {loading || uploadingImage ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          {uploadingImage ? '画像処理中...' : '追加中...'}
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          商品を追加する
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* CSV一括追加 */
            <div>
              <div className="alert alert-info">
                <h5 className="alert-heading">CSV形式について</h5>
                <p className="mb-3">
                  以下の列を含むCSVファイルをアップロードしてください：
                </p>
                <div className="small">
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

              <div className="mb-4">
                <label className="form-label fw-medium">
                  CSVファイルをアップロード
                </label>
                <div className="d-flex flex-column gap-3">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="d-none"
                    id="csv-upload"
                  />
                  <label 
                    htmlFor="csv-upload" 
                    className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 w-fit"
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-file-earmark-spreadsheet fs-5"></i>
                    {csvFile ? 'ファイルを変更' : 'CSVファイルを選択'}
                  </label>
                  
                  {csvFile && (
                    <div className="p-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-file-earmark-spreadsheet text-primary fs-5"></i>
                        <div>
                          <div className="fw-medium text-primary">{csvFile.name}</div>
                          <div className="small text-primary text-opacity-75">
                            ファイルサイズ: {(csvFile.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="d-flex gap-3 mb-4">
                <button
                  onClick={handleCSVPreview}
                  disabled={!csvFile}
                  className="btn btn-outline-primary d-flex align-items-center gap-2"
                >
                  <i className="bi bi-eye"></i>
                  プレビュー
                </button>
                {showPreview && (
                  <button
                    onClick={handleCSVImport}
                    disabled={loading || csvPreview.length === 0}
                    className="btn text-white"
                    style={{ 
                      background: 'linear-gradient(135deg, #8bc34a 0%, #7cb342 100%)',
                      border: 'none'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        インポート中...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-upload me-2"></i>
                        {csvPreview.length}件をインポート
                      </>
                    )}
                  </button>
                )}
              </div>

              {showPreview && csvPreview.length > 0 && (
                <div className="card">
                  <div className="card-header bg-light">
                    <h5 className="card-title mb-0">プレビュー ({csvPreview.length}件)</h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-striped table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="px-3 py-2 fw-medium text-secondary">商品名</th>
                            <th className="px-3 py-2 fw-medium text-secondary">価格</th>
                            <th className="px-3 py-2 fw-medium text-secondary">バリエーション</th>
                            <th className="px-3 py-2 fw-medium text-secondary">JANコード</th>
                            <th className="px-3 py-2 fw-medium text-secondary">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.map((product, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2">{product.name}</td>
                              <td className="px-3 py-2">¥{(product.price || 0).toLocaleString()}</td>
                              <td className="px-3 py-2 text-muted">{product.variation_name || '-'}</td>
                              <td className="px-3 py-2 text-muted">{product.barcode || '-'}</td>
                              <td className="px-3 py-2">
                                <span className={`badge ${
                                  product.id ? 'bg-warning text-dark' : 'bg-success'
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}