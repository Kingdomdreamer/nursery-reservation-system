'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import AdminLayout from '../../components/admin/AdminLayout'

interface SystemSettings {
  general: {
    site_name: string
    site_description: string
    contact_email: string
    contact_phone: string
  }
  notifications: {
    email_enabled: boolean
    line_enabled: boolean
    sms_enabled: boolean
    reminder_hours: number
  }
  business: {
    business_hours_start: string
    business_hours_end: string
    business_days: string[]
    holiday_mode: boolean
  }
  advanced: {
    auto_confirm_orders: boolean
    require_phone_verification: boolean
    max_reservation_days: number
    default_pickup_duration: number
  }
}

export default function SettingsPage() {
  const { showSuccess, showError } = useToast()
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      site_name: 'ベジライス予約システム',
      site_description: 'LINE ミニアプリ対応の種苗店予約システム',
      contact_email: 'contact@vegirice.com',
      contact_phone: '03-1234-5678'
    },
    notifications: {
      email_enabled: true,
      line_enabled: true,
      sms_enabled: false,
      reminder_hours: 24
    },
    business: {
      business_hours_start: '09:00',
      business_hours_end: '18:00',
      business_days: ['月', '火', '水', '木', '金', '土'],
      holiday_mode: false
    },
    advanced: {
      auto_confirm_orders: false,
      require_phone_verification: true,
      max_reservation_days: 30,
      default_pickup_duration: 60
    }
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // 設定をデータベースから読み込み（実装予定）
      console.log('設定を読み込み中...')
    } catch (error) {
      console.error('設定の読み込みに失敗:', error)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      // 設定をデータベースに保存（実装予定）
      console.log('設定を保存中...', settings)
      showSuccess('設定が保存されました')
    } catch (error) {
      console.error('設定の保存に失敗:', error)
      showError('設定の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneralChange = (field: keyof SystemSettings['general'], value: string) => {
    setSettings(prev => ({
      ...prev,
      general: {
        ...prev.general,
        [field]: value
      }
    }))
  }

  const handleNotificationsChange = (field: keyof SystemSettings['notifications'], value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value
      }
    }))
  }

  const handleBusinessChange = (field: keyof SystemSettings['business'], value: string | boolean | string[]) => {
    setSettings(prev => ({
      ...prev,
      business: {
        ...prev.business,
        [field]: value
      }
    }))
  }

  const handleAdvancedChange = (field: keyof SystemSettings['advanced'], value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        [field]: value
      }
    }))
  }

  const toggleBusinessDay = (day: string) => {
    const newDays = settings.business.business_days.includes(day)
      ? settings.business.business_days.filter(d => d !== day)
      : [...settings.business.business_days, day]
    
    handleBusinessChange('business_days', newDays)
  }

  const tabs = [
    { id: 'general', label: '基本設定', icon: 'bi-gear' },
    { id: 'notifications', label: '通知設定', icon: 'bi-bell' },
    { id: 'business', label: '営業設定', icon: 'bi-clock' },
    { id: 'advanced', label: '高度な設定', icon: 'bi-tools' }
  ]

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="h2 fw-bold text-dark">システム設定</h1>
              <button 
                onClick={saveSettings}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    保存中...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    設定を保存
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-3 col-md-4 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">設定カテゴリ</h5>
              </div>
              <div className="list-group list-group-flush">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`list-group-item list-group-item-action d-flex align-items-center ${
                      activeTab === tab.id ? 'active' : ''
                    }`}
                  >
                    <i className={`${tab.icon} me-3`}></i>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-9 col-md-8">
            <div className="card">
              <div className="card-body">
                {activeTab === 'general' && (
                  <div>
                    <h5 className="card-title mb-4">基本設定</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-medium">サイト名</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.general.site_name}
                          onChange={(e) => handleGeneralChange('site_name', e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">連絡先メール</label>
                        <input
                          type="email"
                          className="form-control"
                          value={settings.general.contact_email}
                          onChange={(e) => handleGeneralChange('contact_email', e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">連絡先電話番号</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={settings.general.contact_phone}
                          onChange={(e) => handleGeneralChange('contact_phone', e.target.value)}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-medium">サイト説明</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={settings.general.site_description}
                          onChange={(e) => handleGeneralChange('site_description', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div>
                    <h5 className="card-title mb-4">通知設定</h5>
                    <div className="row g-3">
                      <div className="col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="email_enabled"
                            checked={settings.notifications.email_enabled}
                            onChange={(e) => handleNotificationsChange('email_enabled', e.target.checked)}
                          />
                          <label className="form-check-label fw-medium" htmlFor="email_enabled">
                            メール通知を有効にする
                          </label>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="line_enabled"
                            checked={settings.notifications.line_enabled}
                            onChange={(e) => handleNotificationsChange('line_enabled', e.target.checked)}
                          />
                          <label className="form-check-label fw-medium" htmlFor="line_enabled">
                            LINE通知を有効にする
                          </label>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="sms_enabled"
                            checked={settings.notifications.sms_enabled}
                            onChange={(e) => handleNotificationsChange('sms_enabled', e.target.checked)}
                          />
                          <label className="form-check-label fw-medium" htmlFor="sms_enabled">
                            SMS通知を有効にする
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">リマインダー送信時間（時間前）</label>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          max="72"
                          value={settings.notifications.reminder_hours}
                          onChange={(e) => handleNotificationsChange('reminder_hours', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'business' && (
                  <div>
                    <h5 className="card-title mb-4">営業設定</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-medium">営業開始時間</label>
                        <input
                          type="time"
                          className="form-control"
                          value={settings.business.business_hours_start}
                          onChange={(e) => handleBusinessChange('business_hours_start', e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">営業終了時間</label>
                        <input
                          type="time"
                          className="form-control"
                          value={settings.business.business_hours_end}
                          onChange={(e) => handleBusinessChange('business_hours_end', e.target.value)}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-medium">営業日</label>
                        <div className="d-flex gap-2 mt-2">
                          {['月', '火', '水', '木', '金', '土', '日'].map(day => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleBusinessDay(day)}
                              className={`btn ${
                                settings.business.business_days.includes(day) 
                                  ? 'btn-primary' 
                                  : 'btn-outline-secondary'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="holiday_mode"
                            checked={settings.business.holiday_mode}
                            onChange={(e) => handleBusinessChange('holiday_mode', e.target.checked)}
                          />
                          <label className="form-check-label fw-medium" htmlFor="holiday_mode">
                            休業モード（すべての予約を一時停止）
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'advanced' && (
                  <div>
                    <h5 className="card-title mb-4">高度な設定</h5>
                    <div className="row g-3">
                      <div className="col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="auto_confirm_orders"
                            checked={settings.advanced.auto_confirm_orders}
                            onChange={(e) => handleAdvancedChange('auto_confirm_orders', e.target.checked)}
                          />
                          <label className="form-check-label fw-medium" htmlFor="auto_confirm_orders">
                            注文を自動確定する
                          </label>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="require_phone_verification"
                            checked={settings.advanced.require_phone_verification}
                            onChange={(e) => handleAdvancedChange('require_phone_verification', e.target.checked)}
                          />
                          <label className="form-check-label fw-medium" htmlFor="require_phone_verification">
                            電話番号の確認を必須にする
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">最大予約可能日数</label>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          max="365"
                          value={settings.advanced.max_reservation_days}
                          onChange={(e) => handleAdvancedChange('max_reservation_days', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">デフォルト受取時間（分）</label>
                        <input
                          type="number"
                          className="form-control"
                          min="15"
                          max="480"
                          step="15"
                          value={settings.advanced.default_pickup_duration}
                          onChange={(e) => handleAdvancedChange('default_pickup_duration', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}