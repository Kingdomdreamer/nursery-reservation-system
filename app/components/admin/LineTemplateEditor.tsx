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
      <div className="d-flex justify-content-center align-items-center" style={{ height: '256px' }}>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="row g-0" style={{ height: '600px' }}>
      {/* 左側: テンプレート一覧 */}
      <div className="col-lg-4 col-md-5">
        <div className="card h-100">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">LINEテンプレート</h6>
              <button
                onClick={handleCreateNewTemplate}
                className="btn btn-primary btn-sm"
              >
                <i className="bi bi-plus-lg me-1"></i>新規作成
              </button>
            </div>
          </div>

          <div className="card-body overflow-auto">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`card mb-3 cursor-pointer ${
                  selectedTemplate?.id === template.id
                    ? 'border-primary bg-primary-subtle'
                    : 'border-light'
                }`}
                onClick={() => setSelectedTemplate(template)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fs-5">
                        {templateTypes.find(t => t.value === template.template_type)?.icon}
                      </span>
                      <div>
                        <div className="fw-medium small">{template.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {templateTypes.find(t => t.value === template.template_type)?.label}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleActive(template.id)
                        }}
                        className={`btn btn-sm ${
                          template.is_active ? 'btn-success' : 'btn-outline-secondary'
                        }`}
                      >
                        <i className={`bi ${template.is_active ? 'bi-check' : 'bi-circle'}`}></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTemplate(template.id)
                        }}
                        className="btn btn-outline-danger btn-sm"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    最終更新: {new Date(template.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 中央・右側: テンプレート編集エリア */}
      {selectedTemplate && (
        <div className="col-lg-8 col-md-7">
          <div className="card h-100">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">テンプレート編集</h5>
                <div className="d-flex gap-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`btn btn-sm ${
                      previewMode ? 'btn-warning' : 'btn-outline-secondary'
                    }`}
                  >
                    <i className={`bi ${previewMode ? 'bi-pencil' : 'bi-eye'} me-1`}></i>
                    {previewMode ? '編集' : 'プレビュー'}
                  </button>
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveTemplate}
                        className="btn btn-success btn-sm"
                      >
                        <i className="bi bi-check-lg me-1"></i>保存
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="btn btn-secondary btn-sm"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn btn-primary btn-sm"
                    >
                      <i className="bi bi-pencil me-1"></i>編集
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card-body overflow-auto">
              {previewMode ? (
                /* プレビューモード */
                <div>
                  <div className="alert alert-success border">
                    <h6 className="alert-heading fw-medium">
                      <i className="bi bi-phone me-2"></i>LINEメッセージ プレビュー
                    </h6>
                    <div className="bg-white rounded p-3 border mt-3">
                      <div className="fw-medium text-muted mb-2 small">
                        件名: {selectedTemplate.subject}
                      </div>
                      <div className="text-dark" style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                        {getPreviewMessage()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 編集モード */
                <div>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
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
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
                        テンプレートタイプ
                      </label>
                      <select
                        value={selectedTemplate.template_type}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          template_type: e.target.value as LineTemplate['template_type']
                        })}
                        disabled={!isEditing}
                        className="form-select"
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
                      className="form-control"
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