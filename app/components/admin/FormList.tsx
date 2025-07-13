'use client'

import React, { useState, useEffect } from 'react'
import { FormService } from '../../lib/services/FormService'
import { FormConfiguration } from '../../../lib/supabase'

interface FormTemplate extends FormConfiguration {
  field_count: number
  response_count: number
}

export default function FormList() {
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    fetchForms()
  }, [])

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

  const filteredForms = forms.filter(form => {
    if (selectedStatus === 'all') return true
    if (selectedStatus === 'active') return form.is_active
    if (selectedStatus === 'inactive') return !form.is_active
    return true
  })

  const getStatusBadge = (form: FormTemplate) => {
    const status = FormService.getFormStatus(form as FormConfiguration)
    
    const statusConfig = {
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: '無効' },
      pending: { bg: 'bg-blue-100', text: 'text-blue-800', label: '開始前' },
      expired: { bg: 'bg-red-100', text: 'text-red-800', label: '期限切れ' },
      active: { bg: 'bg-green-100', text: 'text-green-800', label: '公開中' }
    }

    const config = statusConfig[status]
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getValidityInfo = (form: FormTemplate) => {
    return FormService.getValidityPeriodText(form.valid_from, form.valid_to)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">フォーム一覧</h2>
          <p className="text-gray-600">作成済みのフォームを管理できます</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">すべて</option>
            <option value="active">有効</option>
            <option value="inactive">無効</option>
          </select>
          <button 
            onClick={() => window.location.href = '/admin?page=form-builder'}
            className="btn-modern btn-primary-modern flex items-center gap-2"
          >
            <span className="text-lg">🛠️</span>
            新しいフォーム
          </button>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="admin-stats-grid">
        <div className="admin-widget green">
          <div className="admin-widget-header">
            <div className="admin-widget-title">有効なフォーム</div>
            <div className="admin-widget-icon">✅</div>
          </div>
          <div className="admin-widget-value">{forms.filter(f => f.is_active).length}</div>
        </div>

        <div className="admin-widget blue">
          <div className="admin-widget-header">
            <div className="admin-widget-title">総フォーム数</div>
            <div className="admin-widget-icon">📝</div>
          </div>
          <div className="admin-widget-value">{forms.length}</div>
        </div>

        <div className="admin-widget purple">
          <div className="admin-widget-header">
            <div className="admin-widget-title">総回答数</div>
            <div className="admin-widget-icon">📊</div>
          </div>
          <div className="admin-widget-value">{forms.reduce((sum, f) => sum + f.response_count, 0)}</div>
        </div>

        <div className="admin-widget orange">
          <div className="admin-widget-header">
            <div className="admin-widget-title">平均フィールド数</div>
            <div className="admin-widget-icon">📋</div>
          </div>
          <div className="admin-widget-value">
            {forms.length > 0 ? Math.round(forms.reduce((sum, f) => sum + f.field_count, 0) / forms.length) : 0}
          </div>
        </div>
      </div>

      {/* フォーム一覧 */}
      <div className="space-y-4">
        {filteredForms.map((form) => (
          <div key={form.id} className="admin-card">
            <div className="admin-card-content">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
                    {getStatusBadge(form)}
                  </div>
                  <p className="text-gray-600 mb-4">{form.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">フィールド数:</span>
                      <span className="font-medium ml-1">{form.field_count}個</span>
                    </div>
                    <div>
                      <span className="text-gray-500">回答数:</span>
                      <span className="font-medium ml-1 text-blue-600">{form.response_count}件</span>
                    </div>
                    <div>
                      <span className="text-gray-500">有効期間:</span>
                      <span className="font-medium ml-1">{getValidityInfo(form)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">更新日:</span>
                      <span className="font-medium ml-1">{new Date(form.updated_at).toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => window.location.href = `/admin?page=form-builder&id=${form.id}`}
                    className="btn-modern btn-outline-modern btn-sm"
                    title="フォームを編集"
                  >
                    ✏️ 編集
                  </button>
                  <button
                    onClick={() => window.open(`/form/${form.id}`, '_blank')}
                    className="btn-modern btn-secondary-modern btn-sm"
                    title="フォームをプレビュー"
                  >
                    👁️ プレビュー
                  </button>
                  <button
                    onClick={() => handleToggleStatus(form.id, form.is_active)}
                    className={`btn-modern btn-sm ${form.is_active ? 'btn-warning-modern' : 'btn-success-modern'}`}
                    title={form.is_active ? 'フォームを無効にする' : 'フォームを有効にする'}
                  >
                    {form.is_active ? '⏸️' : '▶️'}
                  </button>
                  <button
                    onClick={() => handleDeleteForm(form.id)}
                    className="btn-modern btn-danger-modern btn-sm"
                    title="フォームを削除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredForms.length === 0 && (
        <div className="admin-card">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              フォームが見つかりません
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedStatus !== 'all' 
                ? `${selectedStatus === 'active' ? '有効な' : '無効な'}フォームはありません。`
                : 'まだフォームが作成されていません。'}
              <br />
              新しいフォームを作成してください。
            </p>
            <button 
              onClick={() => window.location.href = '/admin?page=form-builder'}
              className="btn-modern btn-primary-modern"
            >
              🛠️ 新しいフォームを作成
            </button>
          </div>
        </div>
      )}
    </div>
  )
}