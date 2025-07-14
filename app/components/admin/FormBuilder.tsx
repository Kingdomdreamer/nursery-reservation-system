'use client'

import React, { useState, useEffect } from 'react'
import { supabase, Product, ProductCategory } from '../../../lib/supabase'
import FormPreview from '../FormPreview'
import ProductSelectionModal from './ProductSelectionModal'
import { DeleteConfirmDialog } from '../common/ConfirmDialog'
import { Icons, Icon } from '../icons/Icons'

// 定義済みフォーム項目（ReadMe.md仕様に準拠）
const PREDEFINED_FIELDS = {
  customer_name: {
    id: 'customer_name',
    type: 'text' as const,
    label: '氏名',
    placeholder: '山田 太郎',
    required: true,
    description: 'フルネームでご記入ください',
    category: 'customer'
  },
  customer_furigana: {
    id: 'customer_furigana',
    type: 'text' as const,
    label: 'フリガナ',
    placeholder: 'ヤマダ タロウ',
    required: false,
    description: 'カタカナでご記入ください',
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
    label: '住所',
    placeholder: '東京都渋谷区...',
    required: false,
    category: 'customer'
  },
  customer_birth_date: {
    id: 'customer_birth_date',
    type: 'date' as const,
    label: '生年月日',
    required: false,
    category: 'customer'
  },
  customer_gender: {
    id: 'customer_gender',
    type: 'radio' as const,
    label: '性別',
    required: false,
    options: ['男性', '女性', 'その他', '回答しない'],
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
    validFrom?: string
    validTo?: string
    isActive: boolean
  }
}

interface FormBuilderProps {
  formId?: string
  onFormSaved?: (formId: string) => void
}

export default function FormBuilder({ formId, onFormSaved }: FormBuilderProps = {}) {
  const [formConfig, setFormConfig] = useState<FormConfig>({
    id: formId || `form-${Date.now()}`,
    name: '商品予約フォーム',
    description: '片桐商店 ベジライスの商品予約を承ります',
    fields: Object.values(PREDEFINED_FIELDS).map(field => ({ ...field, enabled: true })),
    products: [],
    settings: {
      showProgress: true,
      allowEdit: true,
      confirmationMessage: 'ご予約ありがとうございました。確認のお電話をさせていただきます。',
      businessName: '片桐商店 ベジライス',
      validFrom: undefined,
      validTo: undefined,
      isActive: true
    }
  })
  
  const [isSaving, setIsSaving] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [productToDelete, setProductToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    if (formId) {
      loadFormConfig()
    }
  }, [formId])

  const loadFormConfig = async () => {
    if (!formId) return
    
    try {
      const { data, error } = await supabase
        .from('forms')
        .select(`
          *,
          form_fields(*),
          form_products(
            *,
            product:products(
              *,
              category:product_categories(*)
            )
          )
        `)
        .eq('id', formId)
        .single()

      if (error) throw error

      if (data) {
        const config: FormConfig = {
          id: data.id,
          name: data.name,
          description: data.description,
          fields: (data.form_fields || []).map((field: any) => ({
            id: field.field_id,
            type: field.field_type,
            label: field.label,
            placeholder: field.placeholder,
            required: field.is_required,
            options: field.options,
            description: field.description,
            category: field.category || 'other',
            enabled: field.is_enabled
          })),
          products: (data.form_products || []).map((fp: any) => ({
            id: fp.product.id,
            name: fp.product.name,
            category_name: fp.product.category?.name,
            price: fp.product.price,
            variation_name: fp.variation_name,
            selected_price: fp.selected_price || fp.product.price,
            selected_variation: fp.variation_name
          })),
          settings: {
            showProgress: data.show_progress || true,
            allowEdit: data.allow_edit || true,
            confirmationMessage: data.confirmation_message || 'ご予約ありがとうございました。',
            businessName: data.business_name || '',
            validFrom: data.valid_from,
            validTo: data.valid_to,
            isActive: data.is_active
          }
        }
        setFormConfig(config)
      }
    } catch (error) {
      console.error('フォーム設定の読み込みに失敗しました:', error)
    }
  }

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

  const addProduct = (product: Product, selectedPrice?: number, selectedVariation?: string, quantity?: number) => {
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
    setProductToDelete(productId)
  }

  const confirmRemoveProduct = () => {
    if (productToDelete) {
      setFormConfig({
        ...formConfig,
        products: formConfig.products.filter(p => p.id !== productToDelete)
      })
      setProductToDelete(null)
    }
  }

  const saveFormConfig = async () => {
    setIsSaving(true)
    try {
      // フォーム基本情報を保存
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .upsert({
          id: formConfig.id,
          name: formConfig.name,
          description: formConfig.description,
          show_progress: formConfig.settings.showProgress,
          allow_edit: formConfig.settings.allowEdit,
          confirmation_message: formConfig.settings.confirmationMessage,
          business_name: formConfig.settings.businessName,
          valid_from: formConfig.settings.validFrom || null,
          valid_to: formConfig.settings.validTo || null,
          is_active: formConfig.settings.isActive,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (formError) throw formError

      // 既存のフィールドとプロダクトを削除
      await supabase.from('form_fields').delete().eq('form_id', formConfig.id)
      await supabase.from('form_products').delete().eq('form_id', formConfig.id)

      // フィールドを保存
      if (formConfig.fields.length > 0) {
        const fieldsToInsert = formConfig.fields.map((field, index) => ({
          form_id: formConfig.id,
          field_id: field.id,
          field_type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          is_required: field.required,
          options: field.options,
          description: field.description,
          category: field.category,
          is_enabled: field.enabled,
          display_order: index
        }))

        const { error: fieldsError } = await supabase
          .from('form_fields')
          .insert(fieldsToInsert)

        if (fieldsError) throw fieldsError
      }

      // 商品を保存
      if (formConfig.products.length > 0) {
        const productsToInsert = formConfig.products.map((product, index) => ({
          form_id: formConfig.id,
          product_id: product.id,
          selected_price: product.selected_price,
          variation_name: product.selected_variation,
          display_order: index
        }))

        const { error: productsError } = await supabase
          .from('form_products')
          .insert(productsToInsert)

        if (productsError) throw productsError
      }

      // 保存成功時のコールバック
      if (onFormSaved) {
        onFormSaved(formConfig.id)
      }

      alert('フォーム設定を保存しました')
    } catch (error) {
      console.error('フォーム設定の保存に失敗しました:', error)
      alert('フォーム設定の保存に失敗しました。もう一度お試しください。')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const notAlreadySelected = !formConfig.products.find(p => p.id === product.id)
    
    return matchesCategory && matchesSearch && notAlreadySelected
  })

  const categoryGroups = {
    customer: { title: '顧客情報', icon: Icons.customerInfo },
    reservation: { title: '予約情報', icon: Icons.reservationInfo },
    other: { title: 'その他', icon: Icons.otherInfo }
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
            className="btn-modern btn-outline-modern flex items-center space-x-2"
          >
            <Icon icon={Icons.qrIcon} size="sm" />
            <span>QRコード表示</span>
          </button>
          <button 
            onClick={saveFormConfig}
            disabled={isSaving}
            className="btn-modern btn-success-modern flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Icon icon={Icons.loading} size="sm" className="animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Icon icon={Icons.saveIcon} size="sm" />
                <span>設定を保存</span>
              </>
            )}
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
                <Icon icon={Icons.closeIcon} size="sm" />
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    受付開始日時
                  </label>
                  <input
                    type="datetime-local"
                    value={formConfig.settings.validFrom || ''}
                    onChange={(e) => setFormConfig({ 
                      ...formConfig, 
                      settings: { ...formConfig.settings, validFrom: e.target.value || undefined }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    受付終了日時
                  </label>
                  <input
                    type="datetime-local"
                    value={formConfig.settings.validTo || ''}
                    onChange={(e) => setFormConfig({ 
                      ...formConfig, 
                      settings: { ...formConfig.settings, validTo: e.target.value || undefined }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formConfig.settings.isActive}
                    onChange={(e) => setFormConfig({ 
                      ...formConfig, 
                      settings: { ...formConfig.settings, isActive: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  フォームを有効にする
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  無効にするとフォームにアクセスできなくなります
                </p>
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
                    <Icon icon={category.icon} size="sm" />
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
                  className="btn-modern btn-primary-modern btn-sm flex items-center space-x-2"
                >
                  <Icon icon={Icons.packageIcon} size="sm" />
                  <span>商品を追加</span>
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
                        <Icon icon={Icons.deleteIcon} size="sm" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-4">
                    <Icon icon={Icons.packageIcon} size="xl" className="mx-auto text-gray-400" />
                  </div>
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
            <p className="text-sm text-gray-600">実際のフォーム画面と同じ表示・機能です</p>
          </div>
          <div className="admin-card-content">
            <FormPreview formConfig={formConfig} />
          </div>
        </div>
      </div>

      {/* 商品選択モーダル */}
      <ProductSelectionModal
        isOpen={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        onProductSelect={addProduct}
        excludeProductIds={formConfig.products.map(p => p.id)}
      />

      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        isOpen={!!productToDelete}
        title="商品の削除"
        itemName={productToDelete ? formConfig.products.find(p => p.id === productToDelete)?.name || '選択された商品' : ''}
        onConfirm={confirmRemoveProduct}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  )
}