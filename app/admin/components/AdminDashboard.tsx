'use client'

import { useState, useEffect } from 'react'

interface DashboardStats {
  totalReservations: number
  todayReservations: number
  pendingReservations: number
  totalRevenue: number
  popularProducts: Array<{
    name: string
    count: number
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalReservations: 0,
    todayReservations: 0,
    pendingReservations: 0,
    totalRevenue: 0,
    popularProducts: []
  })

  useEffect(() => {
    // 実際の実装ではAPIから統計データを取得
    setStats({
      totalReservations: 127,
      todayReservations: 8,
      pendingReservations: 3,
      totalRevenue: 1247500,
      popularProducts: [
        { name: '有機肥料A', count: 45 },
        { name: '除草剤B', count: 32 },
        { name: 'トマト苗', count: 28 },
        { name: '化成肥料C', count: 21 },
        { name: 'きゅうり苗', count: 18 }
      ]
    })
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 人気商品ランキング */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">人気商品ランキング</h3>
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
        </div>

        {/* 最近の活動 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">最近の活動</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">新しい予約が入りました</p>
                <p className="text-xs text-gray-500">5分前</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">予約が確定されました</p>
                <p className="text-xs text-gray-500">15分前</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">商品在庫が少なくなっています</p>
                <p className="text-xs text-gray-500">1時間前</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">予約がキャンセルされました</p>
                <p className="text-xs text-gray-500">2時間前</p>
              </div>
            </div>
          </div>
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