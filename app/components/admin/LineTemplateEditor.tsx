'use client'

import React, { useState } from 'react'
import { mockLineTemplates, isDemoMode } from '../../../lib/mockData'

interface LineTemplate {
  id: string
  name: string
  type: 'reservation_confirmation' | 'reservation_reminder' | 'payment_confirmation' | 'cancellation'
  subject: string
  message: string
  variables: string[]
  isActive: boolean
  lastModified: Date
}

export default function LineTemplateEditor() {
  const [templates, setTemplates] = useState<LineTemplate[]>(
    isDemoMode() ? mockLineTemplates : [
    {
      id: 'reservation_confirmation',
      name: '予約確定通知',
      type: 'reservation_confirmation',
      subject: '予約確定のお知らせ',
      message: `{customer_name}様

ご予約いただきありがとうございます。
以下の内容で予約を確定いたしました。

■ 予約情報
予約番号: {reservation_id}
お客様名: {customer_name}
電話番号: {phone_number}
予約日時: {reservation_date}

■ 注文商品
{product_list}

■ 合計金額
{total_amount}円

ご質問がございましたら、お気軽にお電話ください。
{shop_name}
{shop_phone}`,
      variables: ['customer_name', 'reservation_id', 'phone_number', 'reservation_date', 'product_list', 'total_amount', 'shop_name', 'shop_phone'],
      isActive: true,
      lastModified: new Date()
    },
    {
      id: 'reservation_reminder',
      name: '予約リマインダー',
      type: 'reservation_reminder',
      subject: '予約のリマインド',
      message: `{customer_name}様

明日は予約の受け取り日です。

■ 予約情報
予約番号: {reservation_id}
受け取り予定日: {reservation_date}
受け取り時間: {pickup_time}

商品の準備ができましたので、お待ちしております。

{shop_name}
{shop_phone}`,
      variables: ['customer_name', 'reservation_id', 'reservation_date', 'pickup_time', 'shop_name', 'shop_phone'],
      isActive: true,
      lastModified: new Date()
    },
    {
      id: 'payment_confirmation',
      name: '支払い確認通知',
      type: 'payment_confirmation',
      subject: 'お支払い確認のお知らせ',
      message: `{customer_name}様

お支払いを確認いたしました。

■ 支払い情報
予約番号: {reservation_id}
支払い金額: {payment_amount}円
支払い方法: {payment_method}
支払い日時: {payment_date}

ありがとうございました。

{shop_name}`,
      variables: ['customer_name', 'reservation_id', 'payment_amount', 'payment_method', 'payment_date', 'shop_name'],
      isActive: true,
      lastModified: new Date()
    },
    {
      id: 'cancellation',
      name: 'キャンセル通知',
      type: 'cancellation',
      subject: '予約キャンセルのお知らせ',
      message: `{customer_name}様

以下の予約をキャンセルいたしました。

■ キャンセル情報
予約番号: {reservation_id}
キャンセル日時: {cancellation_date}
キャンセル理由: {cancellation_reason}

またのご利用をお待ちしております。

{shop_name}
{shop_phone}`,
      variables: ['customer_name', 'reservation_id', 'cancellation_date', 'cancellation_reason', 'shop_name', 'shop_phone'],
      isActive: false,
      lastModified: new Date()
    }
  ])

  const [selectedTemplate, setSelectedTemplate] = useState<LineTemplate | null>(templates[0])
  const [isEditing, setIsEditing] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const templateTypes = [
    { value: 'reservation_confirmation', label: '予約確定通知', icon: '✅' },
    { value: 'reservation_reminder', label: '予約リマインダー', icon: '⏰' },
    { value: 'payment_confirmation', label: '支払い確認通知', icon: '💰' },
    { value: 'cancellation', label: 'キャンセル通知', icon: '❌' }
  ]

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return

    setTemplates(templates.map(template =>
      template.id === selectedTemplate.id
        ? { ...selectedTemplate, lastModified: new Date() }
        : template
    ))
    setIsEditing(false)
    
    if (isDemoMode()) {
      alert('デモモードのため、実際の保存は行われません。テンプレートが保存されました！')
    }
  }

  const handleCreateNewTemplate = () => {
    const newTemplate: LineTemplate = {
      id: `template_${Date.now()}`,
      name: '新しいテンプレート',
      type: 'reservation_confirmation',
      subject: '',
      message: '',
      variables: [],
      isActive: false,
      lastModified: new Date()
    }
    setTemplates([...templates, newTemplate])
    setSelectedTemplate(newTemplate)
    setIsEditing(true)
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('このテンプレートを削除しますか？')) {
      setTemplates(templates.filter(t => t.id !== templateId))
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(templates[0] || null)
      }
    }
  }

  const handleToggleActive = (templateId: string) => {
    setTemplates(templates.map(template =>
      template.id === templateId
        ? { ...template, isActive: !template.isActive }
        : template
    ))
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
                    {templateTypes.find(t => t.value === template.type)?.icon}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-500">
                      {templateTypes.find(t => t.value === template.type)?.label}
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
                      template.isActive ? 'btn-success-modern' : 'btn-secondary-modern'
                    }`}
                  >
                    {template.isActive ? '✓' : '○'}
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
                最終更新: {template.lastModified.toLocaleDateString()}
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
                        value={selectedTemplate.type}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          type: e.target.value as LineTemplate['type']
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
                      checked={selectedTemplate.isActive}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        isActive: e.target.checked
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