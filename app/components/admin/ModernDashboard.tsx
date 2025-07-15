'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { DashboardService, DashboardStats, RecentActivity } from '../../lib/services/DashboardService'

export default function ModernDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalReservations: 0,
    todayReservations: 0,
    pendingReservations: 0,
    totalRevenue: 0,
    popularProducts: []
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const [dashboardStats, activities] = await Promise.all([
        DashboardService.getDashboardStats(),
        DashboardService.getRecentActivities()
      ])
      setStats(dashboardStats)
      setRecentActivities(activities)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="text-muted mt-2">ダッシュボードを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Welcome Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">おかえりなさい 👋</h2>
              <p className="text-muted mb-0">今日の予約状況とシステムの概要をご確認ください</p>
            </div>
            <button className="btn btn-primary" onClick={fetchDashboardData}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              更新
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="dashboard-widget">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="dashboard-widget-icon bg-primary-subtle text-primary">
                  <i className="bi bi-calendar-check"></i>
                </div>
                <div className="dashboard-widget-value">{stats.totalReservations}</div>
                <div className="dashboard-widget-label">総予約数</div>
              </div>
              <div className="text-end">
                <span className="badge bg-success-subtle text-success">
                  <i className="bi bi-arrow-up me-1"></i>
                  +12%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="dashboard-widget">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="dashboard-widget-icon bg-info-subtle text-info">
                  <i className="bi bi-clock-history"></i>
                </div>
                <div className="dashboard-widget-value">{stats.todayReservations}</div>
                <div className="dashboard-widget-label">今日の予約</div>
              </div>
              <div className="text-end">
                <span className="badge bg-info-subtle text-info">
                  <i className="bi bi-calendar-today me-1"></i>
                  今日
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="dashboard-widget">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="dashboard-widget-icon bg-warning-subtle text-warning">
                  <i className="bi bi-hourglass-split"></i>
                </div>
                <div className="dashboard-widget-value">{stats.pendingReservations}</div>
                <div className="dashboard-widget-label">保留中予約</div>
              </div>
              <div className="text-end">
                <span className="badge bg-warning-subtle text-warning">
                  要確認
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="dashboard-widget">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="dashboard-widget-icon bg-success-subtle text-success">
                  <i className="bi bi-currency-yen"></i>
                </div>
                <div className="dashboard-widget-value">¥{stats.totalRevenue.toLocaleString()}</div>
                <div className="dashboard-widget-label">今月の売上</div>
              </div>
              <div className="text-end">
                <span className="badge bg-success-subtle text-success">
                  <i className="bi bi-arrow-up me-1"></i>
                  +8%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Popular Products */}
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                人気商品ランキング
              </h5>
              <button className="btn btn-sm btn-outline-primary">
                <i className="bi bi-eye me-1"></i>
                詳細
              </button>
            </div>
            <div className="card-body">
              {stats.popularProducts.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-borderless">
                    <thead>
                      <tr>
                        <th>順位</th>
                        <th>商品名</th>
                        <th>注文数</th>
                        <th>進捗</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.popularProducts.slice(0, 5).map((product, index) => (
                        <tr key={index}>
                          <td>
                            <span className={`badge ${index === 0 ? 'bg-warning' : index === 1 ? 'bg-secondary' : index === 2 ? 'bg-info' : 'bg-light text-dark'}`}>
                              #{index + 1}
                            </span>
                          </td>
                          <td>
                            <div className="fw-medium">{product.name}</div>
                          </td>
                          <td>
                            <span className="text-primary fw-medium">{product.count}回</span>
                          </td>
                          <td>
                            <div className="progress" style={{ height: '6px' }}>
                              <div 
                                className="progress-bar bg-primary" 
                                style={{ width: `${Math.min((product.count / Math.max(...stats.popularProducts.map(p => p.count))) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-box text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted mt-2">まだ人気商品のデータがありません</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-activity me-2"></i>
                最近のアクティビティ
              </h5>
              <button className="btn btn-sm btn-outline-primary">
                <i className="bi bi-list me-1"></i>
                全て
              </button>
            </div>
            <div className="card-body">
              {recentActivities.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {recentActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="d-flex align-items-start">
                      <div className={`rounded-circle d-flex align-items-center justify-content-center me-3`} 
                           style={{ width: '32px', height: '32px', backgroundColor: `var(--bs-${activity.color}-subtle)`, color: `var(--bs-${activity.color})` }}>
                        <i className={`bi ${getActivityIcon(activity.type)} fs-6`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-1 text-sm">{activity.message}</p>
                        <small className="text-muted">{formatTime(activity.timestamp)}</small>
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
      </div>

      {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-lightning me-2"></i>
                クイックアクション
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-lg-3 col-md-6">
                  <button className="btn btn-outline-primary w-100 h-100 py-3">
                    <i className="bi bi-plus-circle d-block mb-2" style={{ fontSize: '2rem' }}></i>
                    <div className="fw-medium">新規予約</div>
                    <small className="text-muted">手動で予約を追加</small>
                  </button>
                </div>
                <div className="col-lg-3 col-md-6">
                  <button className="btn btn-outline-secondary w-100 h-100 py-3">
                    <i className="bi bi-box-arrow-in-down d-block mb-2" style={{ fontSize: '2rem' }}></i>
                    <div className="fw-medium">商品インポート</div>
                    <small className="text-muted">CSVから商品を追加</small>
                  </button>
                </div>
                <div className="col-lg-3 col-md-6">
                  <button className="btn btn-outline-info w-100 h-100 py-3">
                    <i className="bi bi-file-earmark-text d-block mb-2" style={{ fontSize: '2rem' }}></i>
                    <div className="fw-medium">レポート生成</div>
                    <small className="text-muted">売上・予約レポート</small>
                  </button>
                </div>
                <div className="col-lg-3 col-md-6">
                  <button className="btn btn-outline-success w-100 h-100 py-3">
                    <i className="bi bi-gear d-block mb-2" style={{ fontSize: '2rem' }}></i>
                    <div className="fw-medium">システム設定</div>
                    <small className="text-muted">各種設定の変更</small>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getActivityIcon(type: string): string {
  switch (type) {
    case 'reservation_created':
      return 'bi-plus-circle'
    case 'reservation_confirmed':
      return 'bi-check-circle'
    case 'low_stock':
      return 'bi-exclamation-triangle'
    case 'reservation_cancelled':
      return 'bi-x-circle'
    default:
      return 'bi-info-circle'
  }
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
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