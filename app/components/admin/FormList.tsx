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
      inactive: { bg: 'bg-secondary-subtle', text: 'text-secondary', label: '無効' },
      pending: { bg: 'bg-info-subtle', text: 'text-info', label: '開始前' },
      expired: { bg: 'bg-danger-subtle', text: 'text-danger', label: '期限切れ' },
      active: { bg: 'bg-success-subtle', text: 'text-success', label: '公開中' }
    }

    const config = statusConfig[status]
    
    return (
      <span className={`badge ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getValidityInfo = (form: FormTemplate) => {
    return FormService.getValidityPeriodText(form.valid_from, form.valid_to)
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '256px' }}>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h2 fw-bold text-dark">フォーム一覧</h2>
              <p className="text-muted">作成済みのフォームを管理できます</p>
            </div>
            <div className="d-flex gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select"
              >
                <option value="all">すべて</option>
                <option value="active">有効</option>
                <option value="inactive">無効</option>
              </select>
              <button 
                onClick={() => window.location.href = '/admin?page=form-builder'}
                className="btn btn-primary"
              >
                <i className="bi bi-plus-lg me-2"></i>
                新しいフォーム
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="row g-4 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="dashboard-widget">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="dashboard-widget-icon bg-success-subtle text-success">
                  <i className="bi bi-check-circle"></i>
                </div>
                <div className="dashboard-widget-value">{forms.filter(f => f.is_active).length}</div>
                <div className="dashboard-widget-label">有効なフォーム</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="dashboard-widget">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="dashboard-widget-icon bg-primary-subtle text-primary">
                  <i className="bi bi-file-earmark-text"></i>
                </div>
                <div className="dashboard-widget-value">{forms.length}</div>
                <div className="dashboard-widget-label">総フォーム数</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="dashboard-widget">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="dashboard-widget-icon bg-info-subtle text-info">
                  <i className="bi bi-bar-chart"></i>
                </div>
                <div className="dashboard-widget-value">{forms.reduce((sum, f) => sum + f.response_count, 0)}</div>
                <div className="dashboard-widget-label">総回答数</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="dashboard-widget">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="dashboard-widget-icon bg-warning-subtle text-warning">
                  <i className="bi bi-list-ol"></i>
                </div>
                <div className="dashboard-widget-value">
                  {forms.length > 0 ? Math.round(forms.reduce((sum, f) => sum + f.field_count, 0) / forms.length) : 0}
                </div>
                <div className="dashboard-widget-label">平均フィールド数</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* フォーム一覧 */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">フォーム一覧 ({filteredForms.length}件)</h5>
            </div>
            <div className="card-body p-0">
              {filteredForms.map((form) => (
                <div key={form.id} className="border-bottom p-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-3 mb-2">
                        <h5 className="mb-0 fw-medium">{form.name}</h5>
                        {getStatusBadge(form)}
                      </div>
                      <p className="text-muted mb-3">{form.description}</p>
                      
                      <div className="row g-3 small">
                        <div className="col-lg-3 col-md-6">
                          <span className="text-muted">フィールド数:</span>
                          <span className="fw-medium ms-1">{form.field_count}個</span>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <span className="text-muted">回答数:</span>
                          <span className="fw-medium ms-1 text-primary">{form.response_count}件</span>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <span className="text-muted">有効期間:</span>
                          <span className="fw-medium ms-1">{getValidityInfo(form)}</span>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <span className="text-muted">更新日:</span>
                          <span className="fw-medium ms-1">{new Date(form.updated_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-1 ms-3">
                      <button
                        onClick={() => window.location.href = `/admin?page=form-builder&id=${form.id}`}
                        className="btn btn-outline-primary btn-sm"
                        title="フォームを編集"
                      >
                        <i className="bi bi-pencil me-1"></i>編集
                      </button>
                      <button
                        onClick={() => window.open(`/form/${form.id}`, '_blank')}
                        className="btn btn-outline-secondary btn-sm"
                        title="フォームをプレビュー"
                      >
                        <i className="bi bi-eye me-1"></i>プレビュー
                      </button>
                      <button
                        onClick={() => handleToggleStatus(form.id, form.is_active)}
                        className={`btn btn-sm ${form.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        title={form.is_active ? 'フォームを無効にする' : 'フォームを有効にする'}
                      >
                        <i className={`bi ${form.is_active ? 'bi-pause' : 'bi-play'}`}></i>
                      </button>
                      <button
                        onClick={() => handleDeleteForm(form.id)}
                        className="btn btn-outline-danger btn-sm"
                        title="フォームを削除"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredForms.length === 0 && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-file-earmark-text text-muted" style={{ fontSize: '4rem' }}></i>
                <h5 className="fw-medium text-dark mt-3 mb-2">
                  フォームが見つかりません
                </h5>
                <p className="text-muted mb-4">
                  {selectedStatus !== 'all' 
                    ? `${selectedStatus === 'active' ? '有効な' : '無効な'}フォームはありません。`
                    : 'まだフォームが作成されていません。'}
                  <br />
                  新しいフォームを作成してください。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}