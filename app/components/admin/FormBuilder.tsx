'use client'

import React, { useState } from 'react'

// フォームフィールドの型定義
export interface FormField {
  id: string
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio'
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // select, radio用
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  description?: string
}

export interface FormConfig {
  id: string
  name: string
  description: string
  fields: FormField[]
  settings: {
    showProgress: boolean
    allowEdit: boolean
    confirmationMessage: string
  }
}

export default function FormBuilder() {
  const [formConfig, setFormConfig] = useState<FormConfig>({
    id: 'reservation-form',
    name: '予約フォーム',
    description: '種苗店の商品予約フォーム',
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'お名前',
        placeholder: '山田 太郎',
        required: true,
        description: 'フルネームでご記入ください'
      },
      {
        id: 'email',
        type: 'email',
        label: 'メールアドレス',
        placeholder: 'example@email.com',
        required: true,
        description: '確認メールをお送りします'
      },
      {
        id: 'phone',
        type: 'tel',
        label: '電話番号',
        placeholder: '090-1234-5678',
        required: true
      }
    ],
    settings: {
      showProgress: true,
      allowEdit: true,
      confirmationMessage: 'ご予約ありがとうございました。確認のお電話をさせていただきます。'
    }
  })

  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const fieldTypes = [
    { value: 'text', label: 'テキスト', icon: '📝' },
    { value: 'email', label: 'メールアドレス', icon: '📧' },
    { value: 'tel', label: '電話番号', icon: '📞' },
    { value: 'number', label: '数値', icon: '🔢' },
    { value: 'date', label: '日付', icon: '📅' },
    { value: 'select', label: '選択肢', icon: '📋' },
    { value: 'textarea', label: 'テキストエリア', icon: '📄' },
    { value: 'checkbox', label: 'チェックボックス', icon: '☑️' },
    { value: 'radio', label: 'ラジオボタン', icon: '🔘' }
  ]

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `新しい${fieldTypes.find(ft => ft.value === type)?.label}`,
      required: false,
      ...(type === 'select' || type === 'radio' ? { options: ['選択肢1', '選択肢2'] } : {})
    }
    
    setFormConfig({
      ...formConfig,
      fields: [...formConfig.fields, newField]
    })
    setSelectedField(newField)
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    const updatedFields = formConfig.fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    )
    setFormConfig({ ...formConfig, fields: updatedFields })
    
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates })
    }
  }

  const deleteField = (fieldId: string) => {
    setFormConfig({
      ...formConfig,
      fields: formConfig.fields.filter(field => field.id !== fieldId)
    })
    if (selectedField?.id === fieldId) {
      setSelectedField(null)
    }
  }

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = formConfig.fields.findIndex(f => f.id === fieldId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= formConfig.fields.length) return

    const newFields = [...formConfig.fields]
    const [movedField] = newFields.splice(currentIndex, 1)
    newFields.splice(newIndex, 0, movedField)

    setFormConfig({ ...formConfig, fields: newFields })
  }

  const renderFieldPreview = (field: FormField) => {
    const baseProps = {
      placeholder: field.placeholder,
      required: field.required,
      className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    }

    switch (field.type) {
      case 'textarea':
        return <textarea {...baseProps} rows={3} />
      case 'select':
        return (
          <select {...baseProps}>
            <option value="">選択してください</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input type="checkbox" className="mr-2" />
                {option}
              </label>
            ))}
          </div>
        )
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input type="radio" name={field.id} className="mr-2" />
                {option}
              </label>
            ))}
          </div>
        )
      default:
        return <input type={field.type} {...baseProps} />
    }
  }

  return (
    <div className="flex h-full form-builder-container">
      {/* 左側: フィールド一覧とツール */}
      <div className="w-1/3 border-r border-gray-200 bg-white form-builder-panel">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">フォームビルダー</h3>
          <p className="text-sm text-gray-600">フィールドを追加してフォームをカスタマイズ</p>
        </div>

        {/* フィールドタイプ */}
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">フィールドを追加</h4>
          <div className="grid grid-cols-2 gap-2">
            {fieldTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => addField(type.value as FormField['type'])}
                className="btn-modern btn-outline-modern p-3 text-left"
              >
                <div className="text-lg mb-1">{type.icon}</div>
                <div className="text-sm font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* フィールド一覧 */}
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">フィールド一覧</h4>
          <div className="space-y-2">
            {formConfig.fields.map((field, index) => (
              <div
                key={field.id}
                className={`form-field-item p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedField?.id === field.id
                    ? 'selected border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedField(field)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {fieldTypes.find(ft => ft.value === field.type)?.icon}
                    </span>
                    <div>
                      <div className="font-medium">{field.label}</div>
                      <div className="text-xs text-gray-500">{field.type}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveField(field.id, 'up')
                      }}
                      disabled={index === 0}
                      className="btn-modern btn-ghost-modern btn-sm btn-icon-only disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveField(field.id, 'down')
                      }}
                      disabled={index === formConfig.fields.length - 1}
                      className="btn-modern btn-ghost-modern btn-sm btn-icon-only disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteField(field.id)
                      }}
                      className="btn-modern btn-danger-modern btn-sm btn-icon-only"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 中央: フォームプレビュー */}
      <div className="flex-1 bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">プレビュー</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`btn-modern btn-sm ${
                  showPreview ? 'btn-primary-modern' : 'btn-secondary-modern'
                }`}
              >
                📱 モバイル表示
              </button>
              <button className="btn-modern btn-success-modern">
                💾 保存
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className={`max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6 ${showPreview ? 'form-preview-mobile max-w-sm' : ''}`}>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{formConfig.name}</h2>
            <p className="text-gray-600 mb-6">{formConfig.description}</p>

            <form className="space-y-6">
              {formConfig.fields.map((field) => (
                <div key={field.id} className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderFieldPreview(field)}
                  {field.description && (
                    <p className="text-sm text-gray-500 mt-1">{field.description}</p>
                  )}
                </div>
              ))}
              
              <button
                type="submit"
                className="btn-modern btn-primary-modern w-full py-3"
              >
                送信する
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 右側: フィールド設定 */}
      {selectedField && (
        <div className="w-1/3 border-l border-gray-200 bg-white form-builder-panel">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">フィールド設定</h3>
            <p className="text-sm text-gray-600">{selectedField.label}</p>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ラベル
              </label>
              <input
                type="text"
                value={selectedField.label}
                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プレースホルダー
              </label>
              <input
                type="text"
                value={selectedField.placeholder || ''}
                onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明文
              </label>
              <textarea
                value={selectedField.description || ''}
                onChange={(e) => updateField(selectedField.id, { description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedField.required}
                  onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                  className="mr-2"
                />
                必須項目
              </label>
            </div>

            {(selectedField.type === 'select' || selectedField.type === 'radio' || selectedField.type === 'checkbox') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選択肢
                </label>
                <div className="space-y-2">
                  {selectedField.options?.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(selectedField.options || [])]
                          newOptions[index] = e.target.value
                          updateField(selectedField.id, { options: newOptions })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          const newOptions = selectedField.options?.filter((_, i) => i !== index)
                          updateField(selectedField.id, { options: newOptions })
                        }}
                        className="btn-modern btn-danger-modern btn-sm btn-icon-only"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newOptions = [...(selectedField.options || []), `選択肢${(selectedField.options?.length || 0) + 1}`]
                      updateField(selectedField.id, { options: newOptions })
                    }}
                    className="btn-modern btn-outline-modern w-full"
                  >
                    + 選択肢を追加
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}