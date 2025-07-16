'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { FormService } from '../../lib/services/FormService'

interface ActivityItem {
  icon: string
  iconColor: string
  text: string
  time: string
  amount: string | null
}

interface AdminDashboardProps {
  onPageChange?: (page: string) => void
}

export default function AdminDashboardBootstrap({ onPageChange }: AdminDashboardProps) {
  const [showFormCheckModal, setShowFormCheckModal] = useState(false)
  const [formCheckResult, setFormCheckResult] = useState<any>(null)
  const [checkingForms, setCheckingForms] = useState(false)
  
  const [stats, setStats] = useState([
    {
      icon: 'bi-calendar-check',
      label: '今日の予約',
      value: '0',
      trend: '+0',
      trendLabel: '昨日比',
      trendType: 'positive',
      color: 'primary'
    },
    {
      icon: 'bi-people',
      label: '総顧客数',
      value: '0',
      trend: '+0',
      trendLabel: '今月',
      trendType: 'positive',
      color: 'info'
    },
    {
      icon: 'bi-file-earmark-text',
      label: 'フォーム数',
      value: '0',
      trend: '+0',
      trendLabel: '今月追加',
      trendType: 'positive',
      color: 'success'
    },
    {
      icon: 'bi-currency-yen',
      label: '今月売上',
      value: '¥0',
      trend: '+0%',
      trendLabel: '先月比',
      trendType: 'positive',
      color: 'warning'
    }
  ])

  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([])

  const fetchDashboardData = useCallback(async () => {
    try {
      // 今日の予約数
      const today = new Date().toISOString().split('T')[0]
      const { data: todayReservations, error: reservationError } = await supabase
        .from('reservations')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)

      // 総顧客数
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('*')

      // フォーム数
      const { data: forms, error: formError } = await supabase
        .from('forms')
        .select('*')

      // 最近のアクティビティ
      const { data: activities, error: activityError } = await supabase
        .from('reservations')
        .select(`
          id,
          reservation_number,
          status,
          total_amount,
          created_at,
          updated_at,
          customers(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      // エラーハンドリング
      if (reservationError) console.error('予約データ取得エラー:', reservationError)
      if (customerError) console.error('顧客データ取得エラー:', customerError)
      if (formError) console.error('フォームデータ取得エラー:', formError)
      if (activityError) console.error('アクティビティデータ取得エラー:', activityError)

      // 統計データを更新
      const todayCount = todayReservations?.length || 0
      const customerCount = customers?.length || 0
      const formCount = forms?.length || 0

      setStats(prevStats => prevStats.map((stat, index) => {
        switch (index) {
          case 0: // 今日の予約
            return { ...stat, value: todayCount.toString() }
          case 1: // 総顧客数
            return { ...stat, value: customerCount.toString() }
          case 2: // フォーム数
            return { ...stat, value: formCount.toString() }
          default:
            return stat
        }
      }))

      // アクティビティデータの変換
      const formattedActivities = activities?.map((activity: any) => ({
        icon: getStatusIcon(activity.status),
        iconColor: getStatusColor(activity.status),
        text: `${activity.customers?.name || '匿名'} - ${activity.reservation_number}`,
        time: getTimeAgo(new Date(activity.created_at)),
        amount: activity.total_amount ? `¥${activity.total_amount.toLocaleString()}` : null
      })) || []

      setRecentActivities(formattedActivities)

    } catch (error) {
      console.error('ダッシュボードデータの取得に失敗しました:', error)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const getTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'たった今'
    if (diffMins < 60) return `${diffMins}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    if (diffDays < 7) return `${diffDays}日前`
    return date.toLocaleDateString('ja-JP')
  }

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'bi-check-circle'
      case 'pending': return 'bi-clock'
      case 'completed': return 'bi-check-circle-fill'
      case 'cancelled': return 'bi-x-circle'
      default: return 'bi-info-circle'
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'text-primary'
      case 'pending': return 'text-warning'
      case 'completed': return 'text-success'
      case 'cancelled': return 'text-danger'
      default: return 'text-info'
    }
  }

  const checkFormSettings = async () => {
    setCheckingForms(true)
    try {
      // フォーム数の簡単なチェック
      const { data: forms, error } = await supabase
        .from('forms')
        .select('*')
      
      if (error) throw error
      
      const result = {
        totalForms: forms?.length || 0,
        activeForms: forms?.filter(f => f.is_active)?.length || 0,
        issues: forms?.length === 0 ? ['フォームが作成されていません'] : [],
        recommendations: forms?.length === 0 ? ['最初のフォームを作成してください'] : ['フォーム設定は正常です']
      }
      
      setFormCheckResult(result)
      setShowFormCheckModal(true)
    } catch (error) {
      console.error('フォーム設定チェックに失敗しました:', error)
    } finally {
      setCheckingForms(false)
    }
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 fw-bold text-dark mb-1">ダッシュボード</h1>
              <p className="text-muted mb-0">システムの概要と最新の活動状況</p>
            </div>
            <button className="btn btn-primary" onClick={fetchDashboardData}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              更新
            </button>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <div className="row g-4 mb-4">
        {stats.map((stat, index) => (
          <div key={index} className="col-xl-3 col-md-6">
            <div className="dashboard-widget">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className={`dashboard-widget-icon bg-${stat.color}-subtle text-${stat.color}`}>
                    <i className={stat.icon}></i>
                  </div>
                  <div className="dashboard-widget-value">{stat.value}</div>
                  <div className="dashboard-widget-label">{stat.label}</div>
                </div>
                <div className="text-end">
                  <span className={`badge bg-${stat.trendType === 'positive' ? 'success' : 'danger'}-subtle text-${stat.trendType === 'positive' ? 'success' : 'danger'}`}>
                    <i className={`bi bi-arrow-${stat.trendType === 'positive' ? 'up' : 'down'} me-1`}></i>
                    {stat.trend}
                  </span>
                  <div className="text-muted small">{stat.trendLabel}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* 最近のアクティビティ */}
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-activity me-2"></i>
                最近のアクティビティ
              </h5>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => onPageChange?.('reservation-list')}
              >
                <i className="bi bi-eye me-1"></i>
                すべて見る
              </button>
            </div>
            <div className="card-body">
              {recentActivities.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="d-flex align-items-start">
                      <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${activity.iconColor}`}
                           style={{ width: '40px', height: '40px', backgroundColor: 'var(--bs-light)' }}>
                        <i className={activity.icon}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <p className="mb-1 fw-medium">{activity.text}</p>
                            <small className="text-muted">{activity.time}</small>
                          </div>
                          {activity.amount && (
                            <span className="badge bg-success-subtle text-success">
                              {activity.amount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-clock-history text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted mt-2">まだアクティビティがありません</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-lightning me-2"></i>
                クイックアクション
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-3">
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => onPageChange?.('reservation-list')}
                >
                  <i className="bi bi-calendar-check me-2"></i>
                  予約管理
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => onPageChange?.('product-list')}
                >
                  <i className="bi bi-box-seam me-2"></i>
                  商品管理
                </button>
                <button 
                  className="btn btn-outline-info"
                  onClick={() => onPageChange?.('form-list')}
                >
                  <i className="bi bi-file-earmark-text me-2"></i>
                  フォーム管理
                </button>
                <button 
                  className="btn btn-outline-success"
                  onClick={checkFormSettings}
                  disabled={checkingForms}
                >
                  {checkingForms ? (
                    <>
                      <span className="loading-spinner me-2"></span>
                      チェック中...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-gear me-2"></i>
                      フォーム設定確認
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* フォーム設定チェックモーダル */}
      {showFormCheckModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-gear me-2"></i>
                  フォーム設定診断結果
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowFormCheckModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {formCheckResult && (
                  <div>
                    <div className="alert alert-info">
                      <h6>診断概要</h6>
                      <p className="mb-0">総フォーム数: {formCheckResult.totalForms}</p>
                      <p className="mb-0">有効フォーム数: {formCheckResult.activeForms}</p>
                    </div>
                    
                    {formCheckResult.issues?.length > 0 && (
                      <div className="alert alert-warning">
                        <h6>検出された問題</h6>
                        <ul className="mb-0">
                          {formCheckResult.issues.map((issue: string, index: number) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {formCheckResult.recommendations?.length > 0 && (
                      <div className="alert alert-success">
                        <h6>推奨事項</h6>
                        <ul className="mb-0">
                          {formCheckResult.recommendations.map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowFormCheckModal(false)}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}