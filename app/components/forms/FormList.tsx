'use client'

import React, { useState, useEffect } from 'react'
import { FormService } from '@/services/FormService'
import { ProductService } from '@/services/ProductService'
import { FormTemplate, FormField, Product, ProductCategory, FormConfiguration, PricingDisplaySettings } from '@/types/forms'

const PREDEFINED_FIELDS: FormField[] = [
  {
    id: 'customer_name',
    type: 'text',
    label: 'お客様名',
    required: true,
    placeholder: '山田太郎'
  },
  {
    id: 'customer_furigana',
    type: 'text',
    label: 'フリガナ',
    required: false,
    placeholder: 'ヤマダタロウ'
  },
  {
    id: 'customer_phone',
    type: 'tel',
    label: '電話番号',
    required: true,
    placeholder: '090-1234-5678'
  },
  {
    id: 'customer_email',
    type: 'email',
    label: 'メールアドレス',
    required: false,
    placeholder: 'example@example.com'
  },
  {
    id: 'customer_postal_code',
    type: 'text',
    label: '郵便番号',
    required: false,
    placeholder: '123-4567'
  },
  {
    id: 'customer_address',
    type: 'textarea',
    label: '住所',
    required: false,
    placeholder: '東京都渋谷区...'
  },
  {
    id: 'customer_birth_date',
    type: 'date',
    label: '生年月日',
    required: false
  },
  {
    id: 'customer_gender',
    type: 'radio',
    label: '性別',
    required: false,
    options: ['男性', '女性', 'その他']
  },
  {
    id: 'reservation_date',
    type: 'date',
    label: '受取希望日',
    required: true
  },
  {
    id: 'special_requests',
    type: 'textarea',
    label: 'ご要望・備考',
    required: false,
    placeholder: 'ご要望があればお書きください'
  }
]

const FIELD_TYPES = [
  { value: 'text', label: 'テキスト' },
  { value: 'email', label: 'メールアドレス' },
  { value: 'tel', label: '電話番号' },
  { value: 'number', label: '数値' },
  { value: 'textarea', label: '複数行テキスト' },
  { value: 'select', label: '選択（プルダウン）' },
  { value: 'radio', label: '選択（ラジオボタン）' },
  { value: 'checkbox', label: '複数選択' },
  { value: 'date', label: '日付' }
]

interface FormListProps {
  onCreateForm: () => void
  onEditForm: (id: string) => void
}

interface PricingDisplayModalProps {
  isOpen: boolean
  form: FormTemplate | null
  onClose: () => void
  onSave: (formId: string, settings: PricingDisplaySettings) => void
}

function PricingDisplayModal({ isOpen, form, onClose, onSave }: PricingDisplayModalProps) {
  const [settings, setSettings] = useState<PricingDisplaySettings>({
    show_item_prices: true,
    show_subtotal: true,
    show_total_amount: true,
    show_item_quantity: true,
    pricing_display_mode: 'full'
  })

  useEffect(() => {
    if (form?.pricing_display) {
      setSettings(form.pricing_display)
    }
  }, [form])

  const handleSave = () => {
    if (form) {
      onSave(form.id, settings)
      onClose()
    }
  }

  if (!isOpen || !form) return null

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">価格表示設定 - {form.name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-4">
              <label className="form-label fw-medium">表示モード</label>
              <select
                value={settings.pricing_display_mode}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  pricing_display_mode: e.target.value as PricingDisplaySettings['pricing_display_mode']
                }))}
                className="form-select"
              >
                <option value="full">詳細表示</option>
                <option value="summary">合計のみ</option>
                <option value="hidden">非表示</option>
                <option value="custom">カスタム</option>
              </select>
              <div className="form-text">
                {FormService.getPricingDisplayModeDescription(settings.pricing_display_mode)}
              </div>
            </div>

            {(settings.pricing_display_mode === 'custom' || settings.pricing_display_mode === 'full') && (
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="show_item_prices"
                      checked={settings.show_item_prices}
                      onChange={(e) => setSettings(prev => ({ ...prev, show_item_prices: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="show_item_prices">
                      商品価格を表示
                    </label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="show_item_quantity"
                      checked={settings.show_item_quantity}
                      onChange={(e) => setSettings(prev => ({ ...prev, show_item_quantity: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="show_item_quantity">
                      数量を表示
                    </label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="show_subtotal"
                      checked={settings.show_subtotal}
                      onChange={(e) => setSettings(prev => ({ ...prev, show_subtotal: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="show_subtotal">
                      小計を表示
                    </label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="show_total_amount"
                      checked={settings.show_total_amount}
                      onChange={(e) => setSettings(prev => ({ ...prev, show_total_amount: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="show_total_amount">
                      合計金額を表示
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              キャンセル
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              設定を保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FormList({ onCreateForm, onEditForm }: FormListProps) {
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [pricingModalForm, setPricingModalForm] = useState<FormTemplate | null>(null)

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

  const handleUpdatePricingSettings = async (formId: string, settings: PricingDisplaySettings) => {
    try {
      await FormService.updatePricingDisplaySettings(formId, settings)
      
      setForms(forms.map(form => 
        form.id === formId 
          ? { ...form, pricing_display: settings }
          : form
      ))
      alert('価格表示設定が更新されました。')
    } catch (error) {
      console.error('価格表示設定の更新に失敗しました:', error)
      alert('価格表示設定の更新に失敗しました。')
    }
  }

  const filteredForms = forms.filter(form => {
    if (selectedStatus === 'all') return true
    if (selectedStatus === 'active') return form.is_active
    if (selectedStatus === 'inactive') return !form.is_active
    return true
  })

  const getStatusBadge = (form: FormTemplate) => {
    const status = FormService.getFormStatus(form)
    
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
                className="form-select form-select-sm px-5"
              >
                <option value="all">すべて</option>
                <option value="active">有効</option>
                <option value="inactive">無効</option>
              </select>
              <button 
                onClick={onCreateForm}
                className="btn btn-primary btn-sm px-2"
                style={{ padding: '0.375rem 0.75rem', minWidth: '150px' }}
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
                  <i className="bi bi-currency-yen"></i>
                </div>
                <div className="dashboard-widget-value">
                  {(() => {
                    const stats = FormService.getPricingDisplayStatistics(forms)
                    return stats.showingPrices
                  })()}
                </div>
                <div className="dashboard-widget-label">価格表示中</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 価格表示設定統計 */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">価格表示設定の統計</h6>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {(() => {
                  const stats = FormService.getPricingDisplayStatistics(forms)
                  return Object.entries(stats.byMode).map(([mode, count]) => (
                    <div key={mode} className="col-lg-3 col-md-6">
                      <div className="text-center p-3 bg-light rounded">
                        <div className="h5 mb-1">{count}</div>
                        <div className="small text-muted">{FormService.getPricingDisplayModeLabel(mode as any)}</div>
                      </div>
                    </div>
                  ))
                })()}
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
                        <div className="col-lg-3 col-md-6">
                          <span className="text-muted">価格表示:</span>
                          <span className="fw-medium ms-1">
                            {form.pricing_display 
                              ? FormService.getPricingDisplayModeLabel(form.pricing_display.pricing_display_mode)
                              : '設定なし'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-1 ms-3">
                      <button
                        onClick={() => onEditForm(form.id)}
                        className="btn btn-outline-primary btn-sm"
                        title="フォームを編集"
                      >
                        <i className="bi bi-pencil me-1"></i>編集
                      </button>
                      <button
                        onClick={() => setPricingModalForm(form)}
                        className="btn btn-outline-info btn-sm"
                        title="価格表示設定"
                      >
                        <i className="bi bi-currency-yen me-1"></i>価格設定
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

      {/* 価格表示設定モーダル */}
      <PricingDisplayModal
        isOpen={!!pricingModalForm}
        form={pricingModalForm}
        onClose={() => setPricingModalForm(null)}
        onSave={handleUpdatePricingSettings}
      />
    </div>
  )
}