'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { FormConfig } from '../../components/admin/FormBuilder'
import FormPreview from '../../components/FormPreview'
import { Icons, Icon } from '../../components/icons/Icons'

export default function FormPage() {
  const params = useParams()
  const formId = params.formId as string
  
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiff, setIsLiff] = useState(false)

  useEffect(() => {
    if (formId) {
      fetchFormConfig()
      checkLiffEnvironment()
    }
  }, [formId])

  const checkLiffEnvironment = () => {
    // LIFFの環境チェック
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent
      const isLineApp = userAgent.includes('Line/')
      setIsLiff(isLineApp)
    }
  }

  const fetchFormConfig = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // フォーム設定を取得
      const { data: formData, error: formError } = await supabase
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
        .eq('is_active', true)
        .single()

      if (formError) throw formError
      
      if (!formData) {
        setError('フォームが見つかりません')
        return
      }

      // 現在時刻での受付可能チェック
      const now = new Date()
      if (formData.valid_from && new Date(formData.valid_from) > now) {
        setError('このフォームはまだ受付開始時刻になっていません')
        return
      }
      
      if (formData.valid_to && new Date(formData.valid_to) < now) {
        setError('このフォームの受付は終了しました')
        return
      }

      // FormConfigの形式に変換
      const config: FormConfig = {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        fields: (formData.form_fields || []).map((field: any) => ({
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
        products: (formData.form_products || []).map((fp: any) => ({
          id: fp.product.id,
          name: fp.product.name,
          category_name: fp.product.category?.name,
          price: fp.product.price,
          variation_name: fp.variation_name,
          selected_price: fp.selected_price || fp.product.price,
          selected_variation: fp.variation_name
        })),
        settings: {
          showProgress: formData.show_progress || true,
          allowEdit: formData.allow_edit || true,
          confirmationMessage: formData.confirmation_message || 'ご予約ありがとうございました。',
          businessName: formData.business_name || '',
          validFrom: formData.valid_from,
          validTo: formData.valid_to,
          isActive: formData.is_active
        }
      }

      setFormConfig(config)
    } catch (error) {
      console.error('フォーム設定の取得に失敗しました:', error)
      setError('フォーム設定の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon icon={Icons.loading} size="xl" className="animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">フォームを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Icon icon={Icons.error} size="xl" className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">アクセスできません</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            戻る
          </button>
        </div>
      </div>
    )
  }

  if (!formConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Icon icon={Icons.warning} size="xl" className="text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">フォームが見つかりません</h2>
          <p className="text-gray-600 mb-4">指定されたフォームは存在しないか、無効になっています。</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isLiff ? 'bg-white' : 'bg-gray-50'}`}>
      {/* LINEアプリ以外ではヘッダーを表示 */}
      {!isLiff && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center space-x-3">
              <Icon icon={Icons.plant} size="lg" className="text-green-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {formConfig.settings.businessName || '種苗店予約システム'}
                </h1>
                <p className="text-sm text-gray-600">予約フォーム</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* フォーム本体 */}
      <div className={`${isLiff ? 'p-0' : 'p-4'}`}>
        <div className={`${isLiff ? '' : 'max-w-lg mx-auto'}`}>
          <FormPreview formConfig={formConfig} />
        </div>
      </div>

      {/* フッター（LINEアプリ以外） */}
      {!isLiff && (
        <div className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-lg mx-auto px-4 py-6 text-center">
            <p className="text-sm text-gray-500">
              Powered by {formConfig.settings.businessName || '種苗店予約システム'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}