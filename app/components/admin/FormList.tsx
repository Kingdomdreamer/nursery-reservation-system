'use client'

import React, { useState, useEffect } from 'react'
import { FormService, FormField } from '../../lib/services/FormService'
import { FormConfiguration, Product, ProductCategory } from '../../../lib/supabase'
import { ProductService } from '../../lib/services/ProductService'

interface FormTemplate extends FormConfiguration {
  field_count: number
  response_count: number
}

// 事前定義されたフィールド
const PREDEFINED_FIELDS: FormField[] = [
  {
    id: 'customer_name',
    type: 'text',
    label: 'お客様名',
    required: true,
    placeholder: '山田太郎'
  },
  {
    id: 'customer_furigana',
    type: 'text',
    label: 'フリガナ',
    required: false,
    placeholder: 'ヤマダタロウ'
  },
  {
    id: 'customer_phone',
    type: 'tel',
    label: '電話番号',
    required: true,
    placeholder: '090-1234-5678'
  },
  {
    id: 'customer_email',
    type: 'email',
    label: 'メールアドレス',
    required: false,
    placeholder: 'example@example.com'
  },
  {
    id: 'customer_postal_code',
    type: 'text',
    label: '郵便番号',
    required: false,
    placeholder: '123-4567'
  },
  {
    id: 'customer_address',
    type: 'textarea',
    label: '住所',
    required: false,
    placeholder: '東京都渋谷区...'
  },
  {
    id: 'customer_birth_date',
    type: 'date',
    label: '生年月日',
    required: false
  },
  {
    id: 'customer_gender',
    type: 'radio',
    label: '性別',
    required: false,
    options: ['男性', '女性', 'その他']
  },
  {
    id: 'reservation_date',
    type: 'date',
    label: '受取希望日',
    required: true
  },
  {
    id: 'special_requests',
    type: 'textarea',
    label: 'ご要望・備考',
    required: false,
    placeholder: 'ご要望があればお書きください'
  }
]

const FIELD_TYPES = [
  { value: 'text', label: 'テキスト' },
  { value: 'email', label: 'メールアドレス' },
  { value: 'tel', label: '電話番号' },
  { value: 'number', label: '数値' },
  { value: 'textarea', label: '複数行テキスト' },
  { value: 'select', label: '選択（プルダウン）' },
  { value: 'radio', label: '選択（ラジオボタン）' },
  { value: 'checkbox', label: '複数選択' },
  { value: 'date', label: '日付' }
]

export default function FormList() {
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newForm, setNewForm] = useState({
    name: '',
    description: '',
    valid_from: '',
    valid_to: ''
  })
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [productSearch, setProductSearch] = useState('')
  const [showProductSection, setShowProductSection] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'fields' | 'products'>('basic')
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [showFieldModal, setShowFieldModal] = useState(false)

  useEffect(() => {
    fetchForms()
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const products = await ProductService.getAllProducts()
      setAvailableProducts(products)
    } catch (error) {
      console.error('商品の取得に失敗しました:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const categories = await ProductService.getAllCategories()
      setCategories(categories)
    } catch (error) {
      console.error('カテゴリの取得に失敗しました:', error)
    }
  }

  const fetchForms = async () => {
    try {
      const data = await FormService.getAllForms()
      setForms(data)
    } catch (error) {
      console.error('フォーム一覧の取得に失敗しました:', error)
      setForms([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (formId: string, currentStatus: boolean) => {
    try {
      await FormService.toggleFormStatus(formId, !currentStatus)
      
      setForms(forms.map(form => 
        form.id === formId 
          ? { ...form, is_active: !currentStatus }
          : form
      ))
    } catch (error) {
      console.error('フォームステータスの更新に失敗しました:', error)
      alert('フォームステータスの更新に失敗しました。')
    }
  }

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('このフォームを削除しますか？この操作は元に戻せません。')) return

    try {
      await FormService.deleteForm(formId)
      
      setForms(forms.filter(form => form.id !== formId))
      alert('フォームが削除されました。')
    } catch (error) {
      console.error('フォームの削除に失敗しました:', error)
      alert('フォームの削除に失敗しました。')
    }
  }

  const handleAddProduct = (product: Product) => {
    // 重複チェック
    if (selectedProducts.find(p => p.id === product.id)) {
      return
    }
    
    setSelectedProducts([...selectedProducts, product])
  }

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId))
  }

  // 商品のフィルタリング
  const filteredProducts = availableProducts.filter(product => {
    // 既に選択されている商品を除外
    if (selectedProducts.find(p => p.id === product.id)) return false
    
    // カテゴリフィルタ
    if (selectedCategory !== 'all' && product.category_id !== selectedCategory) return false
    
    // 検索フィルタ
    if (productSearch && !product.name.toLowerCase().includes(productSearch.toLowerCase())) return false
    
    return true
  })

  // フィールド管理機能
  const handleAddPredefinedField = (predefinedField: FormField) => {
    // 重複チェック
    if (formFields.find(f => f.id === predefinedField.id)) {
      return
    }
    
    setFormFields([...formFields, { ...predefinedField }])
  }

  const handleAddCustomField = () => {
    const newField: FormField = {
      id: `custom_${Date.now()}`,
      type: 'text',
      label: '新しいフィールド',
      required: false,
      placeholder: ''
    }
    
    setEditingField(newField)
    setShowFieldModal(true)
  }

  const handleEditField = (field: FormField) => {
    setEditingField({ ...field })
    setShowFieldModal(true)
  }

  const handleSaveField = () => {
    if (!editingField) return
    
    const existingIndex = formFields.findIndex(f => f.id === editingField.id)
    
    if (existingIndex >= 0) {
      // 既存フィールドの更新
      const updatedFields = [...formFields]
      updatedFields[existingIndex] = editingField
      setFormFields(updatedFields)
    } else {
      // 新規フィールドの追加
      setFormFields([...formFields, editingField])
    }
    
    setEditingField(null)
    setShowFieldModal(false)
  }

  const handleDeleteField = (fieldId: string) => {
    if (confirm('このフィールドを削除しますか？')) {
      setFormFields(formFields.filter(f => f.id !== fieldId))
    }
  }

  const handleMoveField = (fromIndex: number, toIndex: number) => {
    const updatedFields = [...formFields]
    const [movedField] = updatedFields.splice(fromIndex, 1)
    updatedFields.splice(toIndex, 0, movedField)
    setFormFields(updatedFields)
  }

  const handleCreateForm = async () => {
    try {
      const formData = {
        name: newForm.name.trim(),
        description: newForm.description.trim(),
        fields: formFields,
        isActive: false,
        validFrom: newForm.valid_from || undefined,
        validTo: newForm.valid_to || undefined,
        selectedProducts: selectedProducts.map(p => p.id)
      }

      const createdForm = await FormService.createForm(formData)
      
      // フォーム一覧を再読み込み
      await fetchForms()
      
      // モーダルを閉じてフォームをリセット
      setShowCreateModal(false)
      setNewForm({
        name: '',
        description: '',
        valid_from: '',
        valid_to: ''
      })
      setSelectedProducts([])
      setShowProductSection(false)
      setSelectedCategory('all')
      setProductSearch('')
      setFormFields([])
      setActiveTab('basic')
      setEditingField(null)
      setShowFieldModal(false)
      
      // フォームビルダーページに遷移
      window.location.href = `/admin?page=form-builder&id=${createdForm.id}`
      
    } catch (error) {
      console.error('フォームの作成に失敗しました:', error)
      alert('フォームの作成に失敗しました。')
    }
  }

  const filteredForms = forms.filter(form => {
    if (selectedStatus === 'all') return true
    if (selectedStatus === 'active') return form.is_active
    if (selectedStatus === 'inactive') return !form.is_active
    return true
  })

  const getStatusBadge = (form: FormTemplate) => {
    const status = FormService.getFormStatus(form as FormConfiguration)
    
    const statusConfig = {
      inactive: { bg: 'bg-secondary-subtle', text: 'text-secondary', label: '無効' },
      pending: { bg: 'bg-info-subtle', text: 'text-info', label: '開始前' },
      expired: { bg: 'bg-danger-subtle', text: 'text-danger', label: '期限切れ' },
      active: { bg: 'bg-success-subtle', text: 'text-success', label: '公開中' }
    }

    const config = statusConfig[status]
    
    return (
      <span className={`badge ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getValidityInfo = (form: FormTemplate) => {
    return FormService.getValidityPeriodText(form.valid_from, form.valid_to)
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '256px' }}>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h2 fw-bold text-dark">フォーム一覧</h2>
              <p className="text-muted">作成済みのフォームを管理できます</p>
            </div>
            <div className="d-flex gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select form-select-sm px-5"
              >
                <option value="all">すべて</option>
                <option value="active">有効</option>
                <option value="inactive">無効</option>
              </select>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary btn-sm px-2"
                style={{ padding: '0.375rem 0.75rem', minWidth: '150px' }}
              >
                <i className="bi bi-plus-lg me-2"></i>
                新しいフォーム
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="row g-4 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="dashboard-widget">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="dashboard-widget-icon bg-success-subtle text-success">
                  <i className="bi bi-check-circle"></i>
                </div>
                <div className="dashboard-widget-value">{forms.filter(f => f.is_active).length}</div>
                <div className="dashboard-widget-label">有効なフォーム</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="dashboard-widget">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="dashboard-widget-icon bg-primary-subtle text-primary">
                  <i className="bi bi-file-earmark-text"></i>
                </div>
                <div className="dashboard-widget-value">{forms.length}</div>
                <div className="dashboard-widget-label">総フォーム数</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="dashboard-widget">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="dashboard-widget-icon bg-info-subtle text-info">
                  <i className="bi bi-bar-chart"></i>
                </div>
                <div className="dashboard-widget-value">{forms.reduce((sum, f) => sum + f.response_count, 0)}</div>
                <div className="dashboard-widget-label">総回答数</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="dashboard-widget">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="dashboard-widget-icon bg-warning-subtle text-warning">
                  <i className="bi bi-list-ol"></i>
                </div>
                <div className="dashboard-widget-value">
                  {forms.length > 0 ? Math.round(forms.reduce((sum, f) => sum + f.field_count, 0) / forms.length) : 0}
                </div>
                <div className="dashboard-widget-label">平均フィールド数</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* フォーム一覧 */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">フォーム一覧 ({filteredForms.length}件)</h5>
            </div>
            <div className="card-body p-0">
              {filteredForms.map((form) => (
                <div key={form.id} className="border-bottom p-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-3 mb-2">
                        <h5 className="mb-0 fw-medium">{form.name}</h5>
                        {getStatusBadge(form)}
                      </div>
                      <p className="text-muted mb-3">{form.description}</p>
                      
                      <div className="row g-3 small">
                        <div className="col-lg-3 col-md-6">
                          <span className="text-muted">フィールド数:</span>
                          <span className="fw-medium ms-1">{form.field_count}個</span>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <span className="text-muted">回答数:</span>
                          <span className="fw-medium ms-1 text-primary">{form.response_count}件</span>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <span className="text-muted">有効期間:</span>
                          <span className="fw-medium ms-1">{getValidityInfo(form)}</span>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <span className="text-muted">更新日:</span>
                          <span className="fw-medium ms-1">{new Date(form.updated_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-1 ms-3">
                      <button
                        onClick={() => window.location.href = `/admin?page=form-builder&id=${form.id}`}
                        className="btn btn-outline-primary btn-sm"
                        title="フォームを編集"
                      >
                        <i className="bi bi-pencil me-1"></i>編集
                      </button>
                      <button
                        onClick={() => window.open(`/form/${form.id}`, '_blank')}
                        className="btn btn-outline-secondary btn-sm"
                        title="フォームをプレビュー"
                      >
                        <i className="bi bi-eye me-1"></i>プレビュー
                      </button>
                      <button
                        onClick={() => handleToggleStatus(form.id, form.is_active)}
                        className={`btn btn-sm ${form.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        title={form.is_active ? 'フォームを無効にする' : 'フォームを有効にする'}
                      >
                        <i className={`bi ${form.is_active ? 'bi-pause' : 'bi-play'}`}></i>
                      </button>
                      <button
                        onClick={() => handleDeleteForm(form.id)}
                        className="btn btn-outline-danger btn-sm"
                        title="フォームを削除"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredForms.length === 0 && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-file-earmark-text text-muted" style={{ fontSize: '4rem' }}></i>
                <h5 className="fw-medium text-dark mt-3 mb-2">
                  フォームが見つかりません
                </h5>
                <p className="text-muted mb-4">
                  {selectedStatus !== 'all' 
                    ? `${selectedStatus === 'active' ? '有効な' : '無効な'}フォームはありません。`
                    : 'まだフォームが作成されていません。'}
                  <br />
                  新しいフォームを作成してください。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* フォーム作成モーダル */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl" style={{ maxWidth: '90vw' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">新しいフォームを作成</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* タブナビゲーション */}
                <ul className="nav nav-tabs mb-4" id="formTabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'basic' ? 'active' : ''}`}
                      onClick={() => setActiveTab('basic')}
                      type="button"
                    >
                      <i className="bi bi-info-circle me-1"></i>基本情報
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'fields' ? 'active' : ''}`}
                      onClick={() => setActiveTab('fields')}
                      type="button"
                    >
                      <i className="bi bi-ui-checks me-1"></i>フォームフィールド
                      {formFields.length > 0 && <span className="badge bg-primary ms-1">{formFields.length}</span>}
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
                      onClick={() => setActiveTab('products')}
                      type="button"
                    >
                      <i className="bi bi-box-seam me-1"></i>商品選択
                      {selectedProducts.length > 0 && <span className="badge bg-primary ms-1">{selectedProducts.length}</span>}
                    </button>
                  </li>
                </ul>

                {/* タブコンテンツ */}
                <div className="tab-content">
                  {/* 基本情報タブ */}
                  {activeTab === 'basic' && (
                    <div className="tab-pane fade show active">
                      <div className="row justify-content-center">
                        <div className="col-md-8">
                          <div className="mb-4">
                            <label htmlFor="formName" className="form-label">フォーム名 <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              className="form-control"
                              id="formName"
                              value={newForm.name}
                              onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                              placeholder="フォーム名を入力してください"
                              required
                            />
                          </div>
                          <div className="mb-4">
                            <label htmlFor="formDescription" className="form-label">説明</label>
                            <textarea
                              className="form-control"
                              id="formDescription"
                              rows={4}
                              value={newForm.description}
                              onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                              placeholder="フォームの説明を入力してください"
                            ></textarea>
                          </div>
                          <div className="row">
                            <div className="col-md-6">
                              <div className="mb-4">
                                <label htmlFor="validFrom" className="form-label">有効期間 開始日</label>
                                <input
                                  type="datetime-local"
                                  className="form-control"
                                  id="validFrom"
                                  value={newForm.valid_from}
                                  onChange={(e) => setNewForm({ ...newForm, valid_from: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-4">
                                <label htmlFor="validTo" className="form-label">有効期間 終了日</label>
                                <input
                                  type="datetime-local"
                                  className="form-control"
                                  id="validTo"
                                  value={newForm.valid_to}
                                  onChange={(e) => setNewForm({ ...newForm, valid_to: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* フォームフィールドタブ */}
                  {activeTab === 'fields' && (
                    <div className="tab-pane fade show active">
                      <div className="row">
                        {/* 左側: フィールド一覧 */}
                        <div className="col-lg-6">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0">設定済みフィールド</h6>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={handleAddCustomField}
                            >
                              <i className="bi bi-plus-lg me-1"></i>カスタムフィールド
                            </button>
                          </div>

                          {formFields.length > 0 ? (
                            <div className="list-group">
                              {formFields.map((field, index) => (
                                <div key={field.id} className="list-group-item">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                      <div className="d-flex align-items-center mb-1">
                                        <span className="fw-medium">{field.label}</span>
                                        {field.required && <span className="text-danger ms-1">*</span>}
                                        <span className="badge bg-secondary ms-2">{FIELD_TYPES.find(t => t.value === field.type)?.label}</span>
                                      </div>
                                      <small className="text-muted">
                                        {field.placeholder && `プレースホルダー: ${field.placeholder}`}
                                        {field.options && ` | 選択肢: ${field.options.join(', ')}`}
                                      </small>
                                    </div>
                                    <div className="btn-group">
                                      <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => handleEditField(field)}
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => handleDeleteField(field.id)}
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-muted p-4 border rounded">
                              <i className="bi bi-ui-checks display-4"></i>
                              <p className="mb-0 mt-2">フィールドが設定されていません</p>
                              <small>事前定義されたフィールドから選択するか、カスタムフィールドを作成してください</small>
                            </div>
                          )}
                        </div>

                        {/* 右側: 事前定義フィールド */}
                        <div className="col-lg-6">
                          <h6 className="fw-bold mb-3">事前定義フィールド</h6>
                          <div className="row g-2">
                            {PREDEFINED_FIELDS.map((field) => (
                              <div key={field.id} className="col-12">
                                <div className="card card-body p-2">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div className="flex-grow-1">
                                      <div className="d-flex align-items-center">
                                        <span className="fw-medium small">{field.label}</span>
                                        {field.required && <span className="text-danger ms-1">*</span>}
                                      </div>
                                      <small className="text-muted">{FIELD_TYPES.find(t => t.value === field.type)?.label}</small>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => handleAddPredefinedField(field)}
                                      disabled={formFields.some(f => f.id === field.id)}
                                    >
                                      {formFields.some(f => f.id === field.id) ? (
                                        <i className="bi bi-check"></i>
                                      ) : (
                                        <i className="bi bi-plus"></i>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 商品選択タブ */}
                  {activeTab === 'products' && (
                    <div className="tab-pane fade show active">
                      <div className="row">
                        {/* 左側: 選択済み商品 */}
                        <div className="col-lg-6">
                          <h6 className="fw-bold mb-3">選択済み商品 ({selectedProducts.length}件)</h6>
                          {selectedProducts.length > 0 ? (
                            <div className="border rounded p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                              {selectedProducts.map((product) => (
                                <div key={product.id} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                                  <div className="flex-grow-1">
                                    <div className="fw-medium">{product.name}</div>
                                    <small className="text-muted">¥{product.price?.toLocaleString()}</small>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleRemoveProduct(product.id)}
                                  >
                                    <i className="bi bi-x"></i>
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-muted p-4 border rounded">
                              <i className="bi bi-box-seam display-4"></i>
                              <p className="mb-0 mt-2">商品が選択されていません</p>
                              <small>右側の商品一覧から選択してください</small>
                            </div>
                          )}
                        </div>

                        {/* 右側: 商品選択 */}
                        <div className="col-lg-6">
                          <h6 className="fw-bold mb-3">商品一覧</h6>
                          
                          {/* 検索・フィルタ */}
                          <div className="row mb-3">
                            <div className="col-md-6">
                              <select
                                className="form-select form-select-sm"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                              >
                                <option value="all">すべてのカテゴリ</option>
                                {categories.map(category => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-6">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="商品名で検索..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* 商品一覧 */}
                          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {filteredProducts.length > 0 ? (
                              <div className="row g-2">
                                {filteredProducts.map((product) => (
                                  <div key={product.id} className="col-12">
                                    <div 
                                      className="card card-body p-2 cursor-pointer hover-bg-light"
                                      onClick={() => handleAddProduct(product)}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      <div className="d-flex justify-content-between align-items-center">
                                        <div className="flex-grow-1">
                                          <div className="fw-medium small">{product.name}</div>
                                          <small className="text-muted">¥{product.price?.toLocaleString()}</small>
                                        </div>
                                        <button 
                                          type="button"
                                          className="btn btn-outline-primary btn-sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleAddProduct(product)
                                          }}
                                        >
                                          <i className="bi bi-plus"></i>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-muted p-3">
                                <i className="bi bi-search"></i>
                                <p className="mb-0 small">条件に一致する商品がありません</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateForm}
                  disabled={!newForm.name.trim()}
                >
                  作成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* フィールド編集モーダル */}
      {showFieldModal && editingField && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingField.id.startsWith('custom_') ? 'カスタムフィールドを作成' : 'フィールドを編集'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowFieldModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">フィールドタイプ</label>
                  <select
                    className="form-select"
                    value={editingField.type}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      type: e.target.value as FormField['type']
                    })}
                  >
                    {FIELD_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">ラベル</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingField.label}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      label: e.target.value
                    })}
                    placeholder="フィールドのラベルを入力"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">プレースホルダー</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingField.placeholder || ''}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      placeholder: e.target.value
                    })}
                    placeholder="プレースホルダーテキストを入力（任意）"
                  />
                </div>

                {(editingField.type === 'select' || editingField.type === 'radio' || editingField.type === 'checkbox') && (
                  <div className="mb-3">
                    <label className="form-label">選択肢（1行に1つずつ入力）</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={editingField.options?.join('\n') || ''}
                      onChange={(e) => setEditingField({
                        ...editingField,
                        options: e.target.value.split('\n').filter(option => option.trim())
                      })}
                      placeholder="選択肢1&#10;選択肢2&#10;選択肢3"
                    />
                  </div>
                )}

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="fieldRequired"
                    checked={editingField.required || false}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      required: e.target.checked
                    })}
                  />
                  <label className="form-check-label" htmlFor="fieldRequired">
                    必須項目にする
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowFieldModal(false)}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveField}
                  disabled={!editingField.label.trim()}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}