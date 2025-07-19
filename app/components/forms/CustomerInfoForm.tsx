'use client'

import React, { useState, useEffect } from 'react'
import { searchAddressByPostalCode, formatPostalCode } from '@/utils/addressSearch'
import { Icons, Icon } from '../icons/Icons'

interface CustomerData {
  full_name: string
  phone: string
  email?: string
  postal_code?: string
  address?: string
  line_user_id?: string
}

interface CustomerInfoFormProps {
  initialData?: Partial<CustomerData>
  onSubmit: (data: CustomerData) => void
  onCancel?: () => void
  liffProfile?: {
    userId?: string
    displayName?: string
    pictureUrl?: string
    statusMessage?: string
  } | null
  isLiffReady?: boolean
  showOptionalFields?: boolean
  requiredFields?: string[]
}

const DEFAULT_REQUIRED_FIELDS = ['full_name', 'phone']

export default function CustomerInfoForm({
  initialData = {},
  onSubmit,
  onCancel,
  liffProfile,
  isLiffReady,
  showOptionalFields = true,
  requiredFields = DEFAULT_REQUIRED_FIELDS
}: CustomerInfoFormProps) {
  const [formData, setFormData] = useState<CustomerData>({
    full_name: '',
    phone: '',
    email: '',
    postal_code: '',
    address: '',
    line_user_id: '',
    ...initialData
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isZipcodeLoading, setIsZipcodeLoading] = useState(false)
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set())

  // LIFFプロフィール情報の自動入力
  useEffect(() => {
    if (liffProfile && isLiffReady) {
      const updates: Partial<CustomerData> = {}
      
      if (liffProfile.displayName && !formData.full_name) {
        updates.full_name = liffProfile.displayName
      }
      
      if (liffProfile.userId) {
        updates.line_user_id = liffProfile.userId
      }
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }))
        setAutoFilledFields(new Set(Object.keys(updates)))
      }
    }
  }, [liffProfile, isLiffReady])

  const handleInputChange = (field: keyof CustomerData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleZipcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostalCode(e.target.value)
    setFormData(prev => ({ ...prev, postal_code: formatted }))

    // 自動入力をクリア
    if (formatted.replace(/[^0-9]/g, '').length < 7 && autoFilledFields.size > 0) {
      setFormData(prev => ({
        ...prev,
        prefecture: '',
        city: '',
        address: ''
      }))
      setAutoFilledFields(new Set())
    }

    if (errors.postal_code) {
      setErrors(prev => ({ ...prev, postal_code: '' }))
    }
  }

  const handleAddressSearch = async () => {
    const zipcode = formData.postal_code || ''
    const numbers = zipcode.replace(/[^0-9]/g, '')
    
    if (numbers.length !== 7) return

    setIsZipcodeLoading(true)
    try {
      const result = await searchAddressByPostalCode(numbers)
      if (result) {
        const fullAddress = `${result.prefecture || ''}${result.city || ''}${result.address || ''}`
        setFormData(prev => ({
          ...prev,
          address: fullAddress
        }))
        setAutoFilledFields(new Set(['address']))
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
      address: ''
    }))
    setAutoFilledFields(new Set())
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 必須フィールドのチェック
    requiredFields.forEach(field => {
      if (!formData[field as keyof CustomerData]?.trim()) {
        newErrors[field] = 'この項目は必須です'
      }
    })

    // 電話番号の形式チェック
    if (formData.phone && !/^[0-9\-\+\(\)\s]{10,15}$/.test(formData.phone)) {
      newErrors.phone = '有効な電話番号を入力してください'
    }

    // メールアドレスの形式チェック
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください'
    }

    // 郵便番号の形式チェック
    if (formData.postal_code && !/^\d{3}-\d{4}$/.test(formData.postal_code)) {
      newErrors.postal_code = '郵便番号は123-4567の形式で入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const getInputClassName = (field: string) => {
    const baseClass = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500'
    
    if (errors[field]) {
      return `${baseClass} border-red-300 bg-red-50`
    }
    
    if (autoFilledFields.has(field) && field === 'address') {
      return `${baseClass} border-green-300 bg-green-50`
    }
    
    return `${baseClass} border-gray-300`
  }

  const isFieldRequired = (field: string) => requiredFields.includes(field)
  const isFieldReadOnly = (field: string) => autoFilledFields.has(field) && field === 'address'

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">お客様情報</h2>
        <p className="text-gray-600">以下の情報をご入力ください</p>
      </div>

      {/* LIFF情報表示 */}
      {liffProfile && isLiffReady && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Icon icon={Icons.user} size="sm" className="text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">
              LINEアカウント: {liffProfile.displayName} と連携中
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            基本情報
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                お名前 {isFieldRequired('full_name') && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={handleInputChange('full_name')}
                className={getInputClassName('full_name')}
                placeholder="山田太郎"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
              )}
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電話番号 {isFieldRequired('phone') && <span className="text-red-500">*</span>}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                className={getInputClassName('phone')}
                placeholder="090-1234-5678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス {isFieldRequired('email') && <span className="text-red-500">*</span>}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                className={getInputClassName('email')}
                placeholder="example@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* 住所情報 */}
        {showOptionalFields && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              住所情報
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                郵便番号
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={handleZipcodeChange}
                  className={`flex-1 ${getInputClassName('postal_code')}`}
                  placeholder="123-4567"
                  maxLength={8}
                />
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  disabled={isZipcodeLoading || (formData.postal_code?.replace(/[^0-9]/g, '').length !== 7)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isZipcodeLoading || (formData.postal_code?.replace(/[^0-9]/g, '').length !== 7)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isZipcodeLoading ? '検索中...' : '住所検索'}
                </button>
                {autoFilledFields.size > 0 && (
                  <button
                    type="button"
                    onClick={clearAutoFill}
                    className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    クリア
                  </button>
                )}
              </div>
              {errors.postal_code && (
                <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                住所
                {autoFilledFields.has('address') && (
                  <span className="text-xs text-gray-500 ml-2">(自動入力)</span>
                )}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={handleInputChange('address')}
                className={getInputClassName('address')}
                placeholder="東京都渋谷区1-1-1 サンプルマンション101"
                readOnly={isFieldReadOnly('address')}
              />
            </div>
          </div>
        )}


        {/* ボタン */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            確認
          </button>
        </div>
      </form>
    </div>
  )
}