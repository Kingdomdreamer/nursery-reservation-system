'use client'

import { useState, useEffect } from 'react'
import { DashboardService, DashboardStats, RecentActivity } from '../../lib/services/DashboardService'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalReservations: 0,
    todayReservations: 0,
    pendingReservations: 0,
    totalRevenue: 0,
    popularProducts: []
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
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
    }

    fetchDashboardData()
  }, [])

  const StatCard = ({ title, value, subtitle, color = 'blue' }: {
    title: string
    value: string | number
    subtitle?: string
    color?: string
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">ダッシュボード</h2>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="総予約数"
              value={stats.totalReservations}
              subtitle="累計"
              color="blue"
            />
            <StatCard
              title="本日の予約"
              value={stats.todayReservations}
              subtitle="今日の新規予約"
              color="green"
            />
            <StatCard
              title="保留中"
              value={stats.pendingReservations}
              subtitle="確認待ち予約"
              color="yellow"
            />
            <StatCard
              title="総売上"
              value={`¥${stats.totalRevenue.toLocaleString()}`}
              subtitle="今月の売上"
              color="purple"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 人気商品ランキング */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">人気商品ランキング</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-8"></div>
                </div>
              ))}
            </div>
          ) : stats.popularProducts.length > 0 ? (
            <div className="space-y-3">
              {stats.popularProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' :
                      'bg-gray-300'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{product.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{product.count}件</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">商品データがありません</p>
          )}
        </div>

        {/* 最近の活動 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">最近の活動</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4 mt-1"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 bg-${activity.color}-500 rounded-full mt-2`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {DashboardService.formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">最近の活動はありません</p>
          )}
        </div>
      </div>

      {/* クイックアクション */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">クイックアクション</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-modern btn-outline-modern p-6 text-center">
            <div>
              <div className="text-3xl mb-3">📝</div>
              <p className="text-sm font-semibold">新規予約追加</p>
            </div>
          </button>
          <button className="btn-modern btn-success-modern p-6 text-center">
            <div>
              <div className="text-3xl mb-3">📦</div>
              <p className="text-sm font-semibold">商品追加</p>
            </div>
          </button>
          <button className="btn-modern btn-warning-modern p-6 text-center">
            <div>
              <div className="text-3xl mb-3">📊</div>
              <p className="text-sm font-semibold">レポート生成</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}