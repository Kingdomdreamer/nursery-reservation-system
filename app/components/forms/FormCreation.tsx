'use client'

import React, { useState, useEffect } from 'react'
import { FormService } from '@/services/FormService'
import { ProductService } from '@/services/ProductService'
import { FormField, Product, ProductCategory, FormConfiguration, PricingDisplaySettings } from '@/types/forms'

const PREDEFINED_FIELDS: FormField[] = [
  // 基本顧客情報
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
  
  // 住所情報
  {
    id: 'customer_postal_code',
    type: 'text',
    label: '郵便番号',
    required: false,
    placeholder: '123-4567'
  },
  {
    id: 'customer_prefecture',
    type: 'text',
    label: '都道府県',
    required: false,
    placeholder: '東京都'
  },
  {
    id: 'customer_city',
    type: 'text',
    label: '市区町村',
    required: false,
    placeholder: '渋谷区'
  },
  {
    id: 'customer_address',
    type: 'textarea',
    label: '住所（番地・建物名）',
    required: false,
    placeholder: '1-1-1 サンプルマンション101'
  },
  
  // 個人情報
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
  
  // 予約情報
  {
    id: 'reservation_date',
    type: 'date',
    label: '受取希望日',
    required: true
  },
  {
    id: 'pickup_time_slot',
    type: 'select',
    label: '受取時間帯',
    required: true,
    options: ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00']
  },
  
  // 種苗店特有項目
  {
    id: 'cultivation_purpose',
    type: 'select',
    label: '栽培目的',
    required: false,
    options: ['家庭菜園', '観賞用', '贈答用', '商業栽培', 'その他']
  },
  {
    id: 'cultivation_location',
    type: 'select',
    label: '栽培場所',
    required: false,
    options: ['露地', 'ハウス', 'ベランダ', 'プランター', 'その他']
  },
  {
    id: 'experience_level',
    type: 'select',
    label: '栽培経験',
    required: false,
    options: ['初心者', '1-2年', '3-5年', '5年以上', 'プロ・専門家']
  },
  {
    id: 'preferred_contact_method',
    type: 'radio',
    label: '希望連絡方法',
    required: false,
    options: ['電話', 'メール', 'LINE', 'いずれでも']
  },
  
  // その他
  {
    id: 'special_requests',
    type: 'textarea',
    label: 'ご要望・備考',
    required: false,
    placeholder: 'ご要望があればお書きください'
  },
  {
    id: 'referral_source',
    type: 'select',
    label: 'お知りになったきっかけ',
    required: false,
    options: ['知人の紹介', 'インターネット検索', 'SNS', 'チラシ・広告', '通りがかり', 'その他']
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

const FORM_TEMPLATES = [
  {
    id: 'custom',
    name: 'カスタムフォーム',
    description: '1からフォームを作成',
    fields: []
  },
  {
    id: 'basic_reservation',
    name: '基本予約フォーム',
    description: '必要最小限の項目で構成された予約フォーム',
    fields: ['customer_name', 'customer_phone', 'customer_email', 'reservation_date', 'pickup_time_slot', 'special_requests']
  },
  {
    id: 'detailed_reservation',
    name: '詳細予約フォーム',
    description: '詳細な顧客情報と栽培情報を含む予約フォーム',
    fields: ['customer_name', 'customer_furigana', 'customer_phone', 'customer_email', 'customer_postal_code', 'customer_prefecture', 'customer_city', 'customer_address', 'reservation_date', 'pickup_time_slot', 'cultivation_purpose', 'cultivation_location', 'experience_level', 'preferred_contact_method', 'special_requests', 'referral_source']
  },
  {
    id: 'consultation_form',
    name: '栽培相談フォーム',
    description: '栽培相談に特化したフォーム',
    fields: ['customer_name', 'customer_phone', 'customer_email', 'cultivation_purpose', 'cultivation_location', 'experience_level', 'special_requests']
  },
  {
    id: 'feedback_form',
    name: 'お客様アンケート',
    description: '購入後のフィードバック収集フォーム',
    fields: ['customer_name', 'customer_email', 'cultivation_purpose', 'experience_level', 'special_requests', 'referral_source']
  }
]

interface FormCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function FormCreationModal({ isOpen, onClose, onSuccess }: FormCreationModalProps) {
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
  const [activeTab, setActiveTab] = useState<'basic' | 'fields' | 'products' | 'pricing'>('basic')
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom')
  const [pricingDisplay, setPricingDisplay] = useState<PricingDisplaySettings>({
    show_item_prices: true,
    show_subtotal: true,
    show_total_amount: true,
    show_item_quantity: true,
    pricing_display_mode: 'full'
  })

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      fetchCategories()
    }
  }, [isOpen])

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

  const handleAddProduct = (product: Product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      return
    }
    
    setSelectedProducts([...selectedProducts, product])
  }

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId))
  }

  const filteredProducts = availableProducts.filter(product => {
    if (selectedProducts.find(p => p.id === product.id)) return false
    if (selectedCategory !== 'all' && product.category_id !== selectedCategory) return false
    if (productSearch && !product.name.toLowerCase().includes(productSearch.toLowerCase())) return false
    
    return true
  })

  const handleAddPredefinedField = (predefinedField: FormField) => {
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
      const updatedFields = [...formFields]
      updatedFields[existingIndex] = editingField
      setFormFields(updatedFields)
    } else {
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

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = FORM_TEMPLATES.find(t => t.id === templateId)
    
    if (template && template.fields.length > 0) {
      const templateFields = template.fields.map(fieldId => {
        const predefinedField = PREDEFINED_FIELDS.find(f => f.id === fieldId)
        return predefinedField ? { ...predefinedField } : null
      }).filter(field => field !== null) as FormField[]
      
      setFormFields(templateFields)
    } else {
      setFormFields([])
    }
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
      
      resetForm()
      onSuccess()
      
      window.location.href = `/admin?page=form-builder&id=${createdForm.id}`
      
    } catch (error) {
      console.error('フォームの作成に失敗しました:', error)
      alert('フォームの作成に失敗しました。')
    }
  }

  const resetForm = () => {
    setNewForm({
      name: '',
      description: '',
      valid_from: '',
      valid_to: ''
    })
    setSelectedProducts([])
    setSelectedCategory('all')
    setProductSearch('')
    setFormFields([])
    setActiveTab('basic')
    setEditingField(null)
    setShowFieldModal(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl" style={{ maxWidth: '90vw' }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">新しいフォームを作成</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === 'pricing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pricing')}
                  type="button"
                >
                  <i className="bi bi-currency-dollar me-1"></i>価格表示設定
                </button>
              </li>
            </ul>

            <div className="tab-content">
              {activeTab === 'basic' && (
                <div className="tab-pane fade show active">
                  <div className="row justify-content-center">
                    <div className="col-md-8">
                      {/* テンプレート選択 */}
                      <div className="mb-4">
                        <label className="form-label">フォームテンプレート</label>
                        <div className="row g-3">
                          {FORM_TEMPLATES.map((template) => (
                            <div key={template.id} className="col-md-6">
                              <div className={`card h-100 cursor-pointer ${selectedTemplate === template.id ? 'border-primary' : ''}`} 
                                   onClick={() => handleTemplateSelect(template.id)}
                                   style={{ cursor: 'pointer' }}>
                                <div className="card-body">
                                  <div className="d-flex align-items-center mb-2">
                                    <input
                                      type="radio"
                                      name="template"
                                      value={template.id}
                                      checked={selectedTemplate === template.id}
                                      onChange={() => handleTemplateSelect(template.id)}
                                      className="me-2"
                                    />
                                    <h6 className="card-title mb-0">{template.name}</h6>
                                  </div>
                                  <p className="card-text text-muted small">{template.description}</p>
                                  {template.fields.length > 0 && (
                                    <small className="text-muted">
                                      {template.fields.length}個のフィールド
                                    </small>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

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

              {activeTab === 'fields' && (
                <div className="tab-pane fade show active">
                  <div className="row">
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
                          {formFields.map((field) => (
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

              {activeTab === 'products' && (
                <div className="tab-pane fade show active">
                  <div className="row">
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

                    <div className="col-lg-6">
                      <h6 className="fw-bold mb-3">商品一覧</h6>
                      
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

              {activeTab === 'pricing' && (
                <div className="tab-pane fade show active">
                  <div className="row justify-content-center">
                    <div className="col-md-8">
                      <div className="card">
                        <div className="card-header">
                          <h5 className="card-title mb-0">
                            <i className="bi bi-currency-dollar me-2"></i>価格表示設定
                          </h5>
                        </div>
                        <div className="card-body">
                          {/* 価格表示モード */}
                          <div className="mb-4">
                            <label className="form-label">価格表示モード</label>
                            <div className="row g-3">
                              <div className="col-md-6">
                                <div className={`card h-100 cursor-pointer ${pricingDisplay.pricing_display_mode === 'full' ? 'border-primary bg-light' : ''}`}
                                     onClick={() => setPricingDisplay({...pricingDisplay, pricing_display_mode: 'full'})}
                                     style={{ cursor: 'pointer' }}>
                                  <div className="card-body">
                                    <div className="d-flex align-items-center mb-2">
                                      <input
                                        type="radio"
                                        name="pricing_mode"
                                        value="full"
                                        checked={pricingDisplay.pricing_display_mode === 'full'}
                                        onChange={() => setPricingDisplay({...pricingDisplay, pricing_display_mode: 'full'})}
                                        className="me-2"
                                      />
                                      <h6 className="card-title mb-0">完全表示</h6>
                                    </div>
                                    <p className="card-text text-muted small">すべての価格情報を表示</p>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className={`card h-100 cursor-pointer ${pricingDisplay.pricing_display_mode === 'summary' ? 'border-primary bg-light' : ''}`}
                                     onClick={() => setPricingDisplay({...pricingDisplay, pricing_display_mode: 'summary'})}
                                     style={{ cursor: 'pointer' }}>
                                  <div className="card-body">
                                    <div className="d-flex align-items-center mb-2">
                                      <input
                                        type="radio"
                                        name="pricing_mode"
                                        value="summary"
                                        checked={pricingDisplay.pricing_display_mode === 'summary'}
                                        onChange={() => setPricingDisplay({...pricingDisplay, pricing_display_mode: 'summary'})}
                                        className="me-2"
                                      />
                                      <h6 className="card-title mb-0">要約表示</h6>
                                    </div>
                                    <p className="card-text text-muted small">合計金額のみ表示</p>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className={`card h-100 cursor-pointer ${pricingDisplay.pricing_display_mode === 'hidden' ? 'border-primary bg-light' : ''}`}
                                     onClick={() => setPricingDisplay({...pricingDisplay, pricing_display_mode: 'hidden'})}
                                     style={{ cursor: 'pointer' }}>
                                  <div className="card-body">
                                    <div className="d-flex align-items-center mb-2">
                                      <input
                                        type="radio"
                                        name="pricing_mode"
                                        value="hidden"
                                        checked={pricingDisplay.pricing_display_mode === 'hidden'}
                                        onChange={() => setPricingDisplay({...pricingDisplay, pricing_display_mode: 'hidden'})}
                                        className="me-2"
                                      />
                                      <h6 className="card-title mb-0">価格非表示</h6>
                                    </div>
                                    <p className="card-text text-muted small">価格情報を一切表示しない</p>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className={`card h-100 cursor-pointer ${pricingDisplay.pricing_display_mode === 'custom' ? 'border-primary bg-light' : ''}`}
                                     onClick={() => setPricingDisplay({...pricingDisplay, pricing_display_mode: 'custom'})}
                                     style={{ cursor: 'pointer' }}>
                                  <div className="card-body">
                                    <div className="d-flex align-items-center mb-2">
                                      <input
                                        type="radio"
                                        name="pricing_mode"
                                        value="custom"
                                        checked={pricingDisplay.pricing_display_mode === 'custom'}
                                        onChange={() => setPricingDisplay({...pricingDisplay, pricing_display_mode: 'custom'})}
                                        className="me-2"
                                      />
                                      <h6 className="card-title mb-0">カスタム</h6>
                                    </div>
                                    <p className="card-text text-muted small">個別に設定</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* カスタム設定 */}
                          {pricingDisplay.pricing_display_mode === 'custom' && (
                            <div className="mb-4">
                              <h6 className="mb-3">詳細設定</h6>
                              <div className="row g-3">
                                <div className="col-md-6">
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id="show_item_prices"
                                      checked={pricingDisplay.show_item_prices}
                                      onChange={(e) => setPricingDisplay({...pricingDisplay, show_item_prices: e.target.checked})}
                                    />
                                    <label className="form-check-label" htmlFor="show_item_prices">
                                      商品単価を表示
                                    </label>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id="show_item_quantity"
                                      checked={pricingDisplay.show_item_quantity}
                                      onChange={(e) => setPricingDisplay({...pricingDisplay, show_item_quantity: e.target.checked})}
                                    />
                                    <label className="form-check-label" htmlFor="show_item_quantity">
                                      商品数量を表示
                                    </label>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id="show_subtotal"
                                      checked={pricingDisplay.show_subtotal}
                                      onChange={(e) => setPricingDisplay({...pricingDisplay, show_subtotal: e.target.checked})}
                                    />
                                    <label className="form-check-label" htmlFor="show_subtotal">
                                      小計を表示
                                    </label>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id="show_total_amount"
                                      checked={pricingDisplay.show_total_amount}
                                      onChange={(e) => setPricingDisplay({...pricingDisplay, show_total_amount: e.target.checked})}
                                    />
                                    <label className="form-check-label" htmlFor="show_total_amount">
                                      合計金額を表示
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* プレビュー */}
                          <div className="mb-4">
                            <h6 className="mb-3">プレビュー</h6>
                            <div className="card bg-light">
                              <div className="card-body">
                                <div className="row">
                                  <div className="col-8">
                                    <h6 className="mb-1">サンプル商品</h6>
                                    {(pricingDisplay.pricing_display_mode === 'custom' ? pricingDisplay.show_item_quantity : pricingDisplay.pricing_display_mode !== 'hidden') && (
                                      <small className="text-muted">数量: 2個</small>
                                    )}
                                  </div>
                                  <div className="col-4 text-end">
                                    {(pricingDisplay.pricing_display_mode === 'custom' ? pricingDisplay.show_item_prices : pricingDisplay.pricing_display_mode === 'full') && (
                                      <div className="small text-muted">単価: ¥500</div>
                                    )}
                                    {(pricingDisplay.pricing_display_mode === 'custom' ? pricingDisplay.show_subtotal : pricingDisplay.pricing_display_mode === 'full') && (
                                      <div className="small">小計: ¥1,000</div>
                                    )}
                                  </div>
                                </div>
                                <hr className="my-2" />
                                <div className="d-flex justify-content-between align-items-center">
                                  <strong>合計</strong>
                                  <strong>
                                    {(pricingDisplay.pricing_display_mode === 'custom' ? pricingDisplay.show_total_amount : pricingDisplay.pricing_display_mode !== 'hidden') ? '¥1,000' : '※価格は店舗にてお知らせします'}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* モード別の説明 */}
                          <div className="alert alert-info">
                            <i className="bi bi-info-circle me-2"></i>
                            {pricingDisplay.pricing_display_mode === 'full' && '商品の単価、小計、合計金額がすべて表示されます。'}
                            {pricingDisplay.pricing_display_mode === 'summary' && '合計金額のみが表示されます。'}
                            {pricingDisplay.pricing_display_mode === 'hidden' && '価格情報は一切表示されません。'}
                            {pricingDisplay.pricing_display_mode === 'custom' && '選択した項目のみが表示されます。'}
                          </div>
                        </div>
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
              onClick={handleClose}
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