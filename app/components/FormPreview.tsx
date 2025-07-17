'use client'

import React, { useState } from 'react'
import { searchAddressByZipcode, formatZipcode } from '../utils/addressSearch'
import { LineAuthService } from '../../services/LineAuthService'

interface FormField {
  id: string
  type: string
  label: string
  required?: boolean
  placeholder?: string
  enabled?: boolean
  options?: string[]
}

interface FormPreviewProps {
  formConfig: {
    name: string
    description: string
    fields: FormField[]
    products?: Array<{
      id: string
      name: string
      price: number
      category_name?: string
    }>
    pricingSettings?: {
      show_item_prices: boolean
      show_subtotal: boolean
      show_total_amount: boolean
      show_item_quantity: boolean
      pricing_display_mode: 'full' | 'summary' | 'hidden' | 'custom'
    }
  }
  liffProfile?: {
    userId?: string
    displayName?: string
    pictureUrl?: string
    statusMessage?: string
  } | null
  isLiffReady?: boolean
}

export default function FormPreview({ formConfig, liffProfile, isLiffReady }: FormPreviewProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set())
  const [isZipcodeLoading, setIsZipcodeLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // LIFFプロフィール情報の自動入力
  React.useEffect(() => {
    if (liffProfile && isLiffReady) {
      const updates: Record<string, string> = {}
      
      // 名前フィールドの自動入力
      if (liffProfile.displayName) {
        const nameField = formConfig.fields.find(f => f.id === 'full_name' || f.id === 'name')
        if (nameField && !formData[nameField.id]) {
          updates[nameField.id] = liffProfile.displayName
        }
      }
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }))
        setAutoFilledFields(new Set(Object.keys(updates)))
      }
    }
  }, [liffProfile, isLiffReady, formConfig.fields])

  const handleInputChange = (fieldId: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [fieldId]: e.target.value
    })
  }

  const handleZipcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatZipcode(e.target.value)
    setFormData({
      ...formData,
      postal_code: formatted
    })

    // 自動入力がクリアされた場合はマークも削除
    if (formatted.replace(/[^0-9]/g, '').length < 7 && autoFilledFields.size > 0) {
      setFormData(prev => ({
        ...prev,
        prefecture: '',
        city: '',
        address: ''
      }))
      setAutoFilledFields(new Set())
    }
  }

  const handleAddressSearch = async () => {
    const zipcode = formData.postal_code || ''
    const numbers = zipcode.replace(/[^0-9]/g, '')
    
    if (numbers.length !== 7) return

    setIsZipcodeLoading(true)
    try {
      const result = await searchAddressByZipcode(numbers)
      if (result) {
        setFormData(prev => ({
          ...prev,
          prefecture: result.prefecture || '',
          city: result.city || '',
          address: result.town || ''
        }))
        setAutoFilledFields(new Set(['prefecture', 'city']))
      }
    } catch (error) {
      console.error('住所検索エラー:', error)
    } finally {
      setIsZipcodeLoading(false)
    }
  }

  const clearAutoFill = () => {
    setFormData(prev => ({
      ...prev,
      prefecture: '',
      city: '',
      address: ''
    }))
    setAutoFilledFields(new Set())
  }

  const getInputClassName = (fieldId: string) => {
    if (autoFilledFields.has(fieldId) && (fieldId === 'prefecture' || fieldId === 'city')) {
      return 'w-full px-3 py-2 border border-green-300 bg-green-50 rounded-md text-sm'
    }
    return 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  }

  const isFieldReadOnly = (fieldId: string) => {
    return autoFilledFields.has(fieldId) && (fieldId === 'prefecture' || fieldId === 'city')
  }

  const getSearchButtonTooltip = () => {
    const numbers = (formData.postal_code || '').replace(/[^0-9]/g, '')
    if (numbers.length === 0) {
      return '郵便番号を入力してください'
    } else if (numbers.length < 7) {
      return `あと${7 - numbers.length}桁入力してください`
    } else if (numbers.length === 7) {
      return 'タップして住所を検索'
    }
    return ''
  }

  const enabledFields = formConfig.fields.filter(field => field.enabled !== false)

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      // フォームデータの検証
      const requiredFields = enabledFields.filter(field => field.required)
      const missingFields = requiredFields.filter(field => !formData[field.id]?.trim())
      
      if (missingFields.length > 0) {
        setSubmitError(`必須項目が未入力です: ${missingFields.map(f => f.label).join(', ')}`)
        return
      }

      // 顧客データの準備
      const customerData = {
        name: formData.customer_name || formData.name || formData.full_name || '',
        furigana: formData.customer_furigana || formData.furigana || '',
        email: formData.customer_email || formData.email || '',
        phone: formData.customer_phone || formData.phone || '',
        postal_code: formData.postal_code || '',
        prefecture: formData.prefecture || '',
        city: formData.city || '',
        address: formData.address || '',
        birth_date: formData.customer_birth_date || formData.birth_date || '',
        gender: formData.customer_gender || formData.gender || ''
      }

      // LINE認証情報がある場合は自動連携
      if (liffProfile?.userId && isLiffReady) {
        try {
          const customer = await LineAuthService.autoLinkExistingCustomer(
            liffProfile.userId,
            {
              userId: liffProfile.userId,
              displayName: liffProfile.displayName || '',
              pictureUrl: liffProfile.pictureUrl,
              statusMessage: liffProfile.statusMessage
            },
            customerData
          )
          
          console.log('LINE認証情報と顧客データを連携しました:', customer)
        } catch (error) {
          console.error('LINE認証情報の連携に失敗しました:', error)
          // LINE連携に失敗しても予約は続行
        }
      }

      // TODO: 実際の予約処理をここに実装
      // 現在はプレビュー用のため、実際の予約は行わない
      
      // 成功時の処理
      alert('予約が完了しました！')
      
    } catch (error) {
      console.error('予約処理中にエラーが発生しました:', error)
      setSubmitError('予約処理中にエラーが発生しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.id] || ''

    // 郵便番号フィールドの特別な処理
    if (field.id === 'postal_code') {
      return (
        <div key={field.id} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
            {isZipcodeLoading && <span className="text-sm text-blue-600 ml-2">住所を検索中...</span>}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={value}
              onChange={handleZipcodeChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={field.placeholder || "例: 123-4567"}
              maxLength={8}
            />
            <button
              type="button"
              onClick={handleAddressSearch}
              disabled={isZipcodeLoading || (value.replace(/[^0-9]/g, '').length !== 7)}
              title={getSearchButtonTooltip()}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isZipcodeLoading || (value.replace(/[^0-9]/g, '').length !== 7)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isZipcodeLoading ? '検索中...' : '住所検索'}
            </button>
            {autoFilledFields.size > 0 && (
              <button
                type="button"
                onClick={clearAutoFill}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                クリア
              </button>
            )}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>📍 郵便番号を7桁入力後、「住所検索」ボタンをタップで住所が自動入力されます</p>
            <p>🔒 都道府県・市区町村は自動入力、町名以降は編集できます</p>
          </div>
        </div>
      )
    }

    // 都道府県・市区町村の特別な処理
    if (field.id === 'prefecture' || field.id === 'city') {
      return (
        <div key={field.id} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
            {autoFilledFields.has(field.id) && (
              <span className="text-xs text-gray-500 ml-2">(自動入力)</span>
            )}
          </label>
          <input
            type="text"
            value={value}
            onChange={handleInputChange(field.id)}
            className={getInputClassName(field.id)}
            placeholder={field.placeholder}
            readOnly={isFieldReadOnly(field.id)}
          />
        </div>
      )
    }

    // 通常フィールドの処理
    return (
      <div key={field.id} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.type === 'textarea' ? (
          <textarea
            value={value}
            onChange={handleInputChange(field.id)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        ) : field.type === 'select' ? (
          <select 
            value={value}
            onChange={handleInputChange(field.id)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        ) : field.type === 'radio' ? (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={handleInputChange(field.id)}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        ) : field.type === 'checkbox' ? (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        ) : (
          <input
            type={field.type}
            value={value}
            onChange={handleInputChange(field.id)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto bg-white border rounded-lg p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{formConfig.name}</h2>
        <p className="text-gray-600 text-sm">{formConfig.description}</p>
      </div>

      <form className="space-y-6">
        {enabledFields.map(renderField)}

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">商品選択</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">選択された商品がここに表示されます</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-semibold">
              <span className="text-gray-600">小計: </span>
              <span className="text-gray-900">¥0</span>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isSubmitting
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isSubmitting ? '送信中...' : '予約内容を確認する'}
        </button>
      </form>

      <div className="text-center text-xs text-gray-500">
        ※ これはプレビューです。実際の予約はできません。
      </div>
    </div>
  )
}