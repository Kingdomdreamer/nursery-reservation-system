'use client'

import React from 'react'

export default function AdminDashboard() {
  const stats = [
    {
      icon: '📅',
      label: '今日の予約',
      value: '12',
      change: '+3 (昨日比)',
      changeType: 'positive'
    },
    {
      icon: '💰',
      label: '今月の売上',
      value: '¥245,000',
      change: '+15% (先月比)',
      changeType: 'positive'
    },
    {
      icon: '👥',
      label: '総顧客数',
      value: '1,247',
      change: '+23 (今月)',
      changeType: 'positive'
    },
    {
      icon: '📦',
      label: '在庫商品数',
      value: '156',
      change: '-5 (在庫切れ)',
      changeType: 'negative'
    }
  ]

  const recentReservations = [
    {
      id: 'R001',
      customerName: '田中太郎',
      phone: '090-1234-5678',
      products: ['トマトの苗×3', 'きゅうりの苗×2'],
      pickupDate: '2024-07-15',
      amount: 1340,
      status: 'confirmed'
    },
    {
      id: 'R002',
      customerName: '佐藤花子',
      phone: '080-9876-5432',
      products: ['レタスの種×1', 'にんじんの種×2'],
      pickupDate: '2024-07-16',
      amount: 390,
      status: 'pending'
    },
    {
      id: 'R003',
      customerName: '山田次郎',
      phone: '070-5555-1234',
      products: ['なすの苗×4', 'ピーマンの苗×1'],
      pickupDate: '2024-07-17',
      amount: 1070,
      status: 'confirmed'
    }
  ]

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    
    const labels = {
      confirmed: '確定',
      pending: '保留中',
      cancelled: 'キャンセル'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="dashboard">
      {/* 統計カード */}
      <div className="admin-grid">
        {stats.map((stat, index) => (
          <div key={index} className="admin-stat-card">
            <div className="stat-header">
              <span className="stat-icon">{stat.icon}</span>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <div className={`stat-change ${stat.changeType}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* 最近の予約 */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">最近の予約</h3>
          <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            すべて見る →
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">予約ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">顧客名</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">商品</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">引き取り日</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">金額</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {recentReservations.map((reservation) => (
                <tr key={reservation.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-blue-600">{reservation.id}</td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{reservation.customerName}</div>
                      <div className="text-sm text-gray-500">{reservation.phone}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      {reservation.products.map((product, index) => (
                        <div key={index}>{product}</div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">{reservation.pickupDate}</td>
                  <td className="py-3 px-4 font-medium">¥{reservation.amount.toLocaleString()}</td>
                  <td className="py-3 px-4">{getStatusBadge(reservation.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* グラフエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">売上推移</h3>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📈</div>
              <div>売上グラフ</div>
              <div className="text-sm">（Chart.jsで実装予定）</div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">人気商品ランキング</h3>
          </div>
          <div className="space-y-3">
            {[
              { name: 'トマトの苗', sales: 45, icon: '🍅' },
              { name: 'きゅうりの苗', sales: 38, icon: '🥒' },
              { name: 'なすの苗', sales: 32, icon: '🍆' },
              { name: 'ピーマンの苗', sales: 28, icon: '🫑' },
              { name: 'レタスの種', sales: 25, icon: '🥬' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">今月の販売数</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-blue-600">{item.sales}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}