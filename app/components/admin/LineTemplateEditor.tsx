'use client'

import React, { useState, useEffect } from 'react'
import { supabase, LineTemplate } from '../../../lib/supabase'


export default function LineTemplateEditor() {
  const [templates, setTemplates] = useState<LineTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<LineTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [loading, setLoading] = useState(true)

  const templateTypes = [
    { value: 'reservation_confirmation', label: '予約確定通知', icon: '✅' },
    { value: 'reservation_reminder', label: '予約リマインダー', icon: '⏰' },
    { value: 'payment_confirmation', label: '支払い確認通知', icon: '💰' },
    { value: 'cancellation', label: 'キャンセル通知', icon: '❌' }
  ]

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('line_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
      if (data && data.length > 0) {
        setSelectedTemplate(data[0])
      }
    } catch (error) {
      console.error('テンプレートの取得に失敗しました:', error)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return

    try {
      const { error } = await supabase
        .from('line_templates')
        .update({
          name: selectedTemplate.name,
          template_type: selectedTemplate.template_type,
          subject: selectedTemplate.subject,
          message: selectedTemplate.message,
          is_active: selectedTemplate.is_active
        })
        .eq('id', selectedTemplate.id)

      if (error) throw error
      
      await fetchTemplates()
      setIsEditing(false)
      alert('テンプレートが保存されました！')
    } catch (error) {
      console.error('テンプレートの保存に失敗しました:', error)
      alert('テンプレートの保存に失敗しました。')
    }
  }

  const handleCreateNewTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('line_templates')
        .insert([{
          name: '新しいテンプレート',
          template_type: 'reservation_confirmation',
          subject: '',
          message: '',
          is_active: false
        }])
        .select()
        .single()

      if (error) throw error
      
      await fetchTemplates()
      setSelectedTemplate(data)
      setIsEditing(true)
    } catch (error) {
      console.error('テンプレートの作成に失敗しました:', error)
      alert('テンプレートの作成に失敗しました。')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('このテンプレートを削除しますか？')) {
      try {
        const { error } = await supabase
          .from('line_templates')
          .delete()
          .eq('id', templateId)

        if (error) throw error
        
        await fetchTemplates()
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(templates[0] || null)
        }
        alert('テンプレートが削除されました。')
      } catch (error) {
        console.error('テンプレートの削除に失敗しました:', error)
        alert('テンプレートの削除に失敗しました。')
      }
    }
  }

  const handleToggleActive = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    try {
      const { error } = await supabase
        .from('line_templates')
        .update({ is_active: !template.is_active })
        .eq('id', templateId)

      if (error) throw error
      
      await fetchTemplates()
    } catch (error) {
      console.error('テンプレートの有効/無効の切り替えに失敗しました:', error)
      alert('テンプレートの有効/無効の切り替えに失敗しました。')
    }
  }

  const getPreviewMessage = () => {
    if (!selectedTemplate) return ''
    
    const sampleData = {
      customer_name: '山田太郎',
      reservation_id: 'R20240101001',
      phone_number: '090-1234-5678',
      reservation_date: '2024年1月15日',
      pickup_time: '10:00-12:00',
      product_list: '有機肥料A × 2袋\nトマト苗 × 10株',
      total_amount: '15,000',
      payment_amount: '15,000',
      payment_method: 'クレジットカード',
      payment_date: '2024年1月14日 15:30',
      cancellation_date: '2024年1月14日 16:00',
      cancellation_reason: 'お客様都合',
      shop_name: 'グリーンファーム種苗店',
      shop_phone: '03-1234-5678'
    }

    let message = selectedTemplate.message
    Object.entries(sampleData).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value)
    })
    
    return message
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* 左側: テンプレート一覧 */}
      <div className="w-1/3 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">LINEテンプレート</h3>
            <button
              onClick={handleCreateNewTemplate}
              className="btn-modern btn-primary-modern btn-sm"
            >
              + 新規作成
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {templateTypes.find(t => t.value === template.template_type)?.icon}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-500">
                      {templateTypes.find(t => t.value === template.template_type)?.label}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleActive(template.id)
                    }}
                    className={`btn-modern btn-sm btn-icon-only ${
                      template.is_active ? 'btn-success-modern' : 'btn-secondary-modern'
                    }`}
                  >
                    {template.is_active ? '✓' : '○'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTemplate(template.id)
                    }}
                    className="btn-modern btn-danger-modern btn-sm btn-icon-only"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                最終更新: {new Date(template.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 中央・右側: テンプレート編集エリア */}
      {selectedTemplate && (
        <div className="flex-1 flex">
          {/* 編集エリア */}
          <div className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">テンプレート編集</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`btn-modern btn-sm ${
                      previewMode ? 'btn-warning-modern' : 'btn-secondary-modern'
                    }`}
                  >
                    {previewMode ? '📝 編集' : '👁️ プレビュー'}
                  </button>
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveTemplate}
                        className="btn-modern btn-success-modern btn-sm"
                      >
                        💾 保存
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="btn-modern btn-secondary-modern btn-sm"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-modern btn-primary-modern btn-sm"
                    >
                      ✏️ 編集
                    </button>
                  )}
                </div>
              </div>

              {previewMode ? (
                /* プレビューモード */
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">📱 LINEメッセージ プレビュー</h4>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="text-sm font-medium text-gray-600 mb-2">
                        件名: {selectedTemplate.subject}
                      </div>
                      <div className="whitespace-pre-line text-sm leading-relaxed">
                        {getPreviewMessage()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 編集モード */
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        テンプレート名
                      </label>
                      <input
                        type="text"
                        value={selectedTemplate.name}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          name: e.target.value
                        })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        テンプレートタイプ
                      </label>
                      <select
                        value={selectedTemplate.template_type}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          template_type: e.target.value as LineTemplate['template_type']
                        })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      >
                        {templateTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      件名
                    </label>
                    <input
                      type="text"
                      value={selectedTemplate.subject}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        subject: e.target.value
                      })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      placeholder="メッセージの件名を入力"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メッセージ本文
                    </label>
                    <textarea
                      value={selectedTemplate.message}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        message: e.target.value
                      })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      rows={12}
                      placeholder="メッセージ本文を入力してください。変数は {variable_name} の形式で使用できます。"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      利用可能な変数
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="space-y-1">
                          <div><code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{customer_name}'}</code> - お客様名</div>
                          <div><code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{reservation_id}'}</code> - 予約番号</div>
                          <div><code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{phone_number}'}</code> - 電話番号</div>
                          <div><code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{reservation_date}'}</code> - 予約日</div>
                        </div>
                        <div className="space-y-1">
                          <div><code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{product_list}'}</code> - 商品一覧</div>
                          <div><code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{total_amount}'}</code> - 合計金額</div>
                          <div><code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{shop_name}'}</code> - 店舗名</div>
                          <div><code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{shop_phone}'}</code> - 店舗電話</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={selectedTemplate.is_active}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        is_active: e.target.checked
                      })}
                      disabled={!isEditing}
                      className="mr-2"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      このテンプレートを有効にする
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}