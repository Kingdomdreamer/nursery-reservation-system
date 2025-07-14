'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()

  const stats = [
    {
      icon: '📅',
      label: '今日の予約',
      value: '12',
      trend: '+3',
      trendLabel: '昨日比',
      trendType: 'positive',
      color: 'blue'
    },
    {
      icon: '💰',
      label: '今月の売上',
      value: '¥245,000',
      trend: '+15%',
      trendLabel: '先月比',
      trendType: 'positive',
      color: 'green'
    },
    {
      icon: '👥',
      label: '総顧客数',
      value: '1,247',
      trend: '+23',
      trendLabel: '今月',
      trendType: 'positive',
      color: 'purple'
    },
    {
      icon: '📋',
      label: 'フォーム数',
      value: '8',
      trend: '+2',
      trendLabel: '今月追加',
      trendType: 'positive',
      color: 'orange'
    }
  ]

  const quickActions = [
    {
      icon: '📝',
      title: '新規予約追加',
      description: 'お客様の予約を追加',
      action: () => router.push('/admin/reservations')
    },
    {
      icon: '📦',
      title: '商品追加',
      description: '新しい商品を登録',
      action: () => router.push('/admin/products/add')
    },
    {
      icon: '👤',
      title: '顧客管理',
      description: '顧客情報を管理',
      action: () => router.push('/admin/customers')
    },
    {
      icon: '📋',
      title: 'フォーム管理',
      description: '予約フォームを管理',
      action: () => router.push('/admin/forms')
    }
  ]

  const recentActivities = [
    {
      icon: '✅',
      iconColor: 'green',
      text: '田中太郎様の予約が確定されました',
      time: '5分前',
      amount: '¥1,340'
    },
    {
      icon: '📦',
      iconColor: 'blue',
      text: 'トマトの苗 15株が入荷しました',
      time: '1時間前',
      amount: null
    },
    {
      icon: '💰',
      iconColor: 'green',
      text: '佐藤花子様からお支払いを受領',
      time: '2時間前',
      amount: '¥390'
    },
    {
      icon: '📋',
      iconColor: 'blue',
      text: '新しい予約フォームが公開されました',
      time: '3時間前',
      amount: null
    },
    {
      icon: '🔔',
      iconColor: 'purple',
      text: '山田次郎様にリマインダーを送信',
      time: '4時間前',
      amount: null
    }
  ]

  const upcomingTasks = [
    {
      icon: '📞',
      task: '田中様への確認電話',
      time: '14:00',
      priority: 'high'
    },
    {
      icon: '📋',
      task: 'フォーム設定の確認',
      time: '15:30',
      priority: 'medium'
    },
    {
      icon: '📧',
      task: '週次レポートの送信',
      time: '17:00',
      priority: 'low'
    }
  ]

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
          <p className="text-gray-600">種苗店管理システム - 今日の概要</p>
        </div>
        <div className="text-sm text-gray-500">
          最終更新: {new Date().toLocaleString('ja-JP')}
        </div>
      </div>

      {/* 統計ウィジェット */}
      <div className="admin-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`admin-widget ${stat.color}`}>
            <div className="admin-widget-header">
              <div className="admin-widget-title">{stat.label}</div>
              <div className="admin-widget-icon">{stat.icon}</div>
            </div>
            <div className="admin-widget-value">{stat.value}</div>
            <div className={`admin-widget-trend ${stat.trendType}`}>
              <span>{stat.trend}</span>
              <span className="text-gray-500">({stat.trendLabel})</span>
            </div>
          </div>
        ))}
      </div>

      {/* メインコンテンツエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側 - クイックアクション */}
        <div className="lg:col-span-1">
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">クイックアクション</h3>
            </div>
            <div className="admin-card-content">
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="btn-modern btn-outline-modern w-full p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{action.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{action.title}</div>
                        <div className="text-sm text-gray-500">{action.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 今日のタスク */}
          <div className="admin-card mt-6">
            <div className="admin-card-header">
              <h3 className="admin-card-title">今日のタスク</h3>
            </div>
            <div className="admin-card-content">
              <div className="space-y-3">
                {upcomingTasks.map((task, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg">{task.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{task.task}</div>
                      <div className="text-xs text-gray-500">{task.time}</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'high' ? 'bg-red-400' :
                      task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右側 - 最近のアクティビティと統計 */}
        <div className="lg:col-span-2">
          {/* 最近のアクティビティ */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">最近のアクティビティ</h3>
              <button className="btn-modern btn-outline-modern btn-sm">
                すべて見る →
              </button>
            </div>
            <div className="admin-card-content">
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="admin-activity-item">
                    <div className={`admin-activity-icon bg-${activity.iconColor}-100 text-${activity.iconColor}-600`}>
                      {activity.icon}
                    </div>
                    <div className="admin-activity-content">
                      <div className="admin-activity-text">{activity.text}</div>
                      <div className="admin-activity-time">{activity.time}</div>
                    </div>
                    {activity.amount && (
                      <div className="font-medium text-green-600">{activity.amount}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 売上概要と進捗 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">今月の目標達成率</h3>
              </div>
              <div className="admin-card-content">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">売上目標</span>
                      <span className="text-sm text-gray-600">73%</span>
                    </div>
                    <div className="admin-progress">
                      <div className="admin-progress-bar green" style={{ width: '73%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">予約件数</span>
                      <span className="text-sm text-gray-600">85%</span>
                    </div>
                    <div className="admin-progress">
                      <div className="admin-progress-bar blue" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">顧客満足度</span>
                      <span className="text-sm text-gray-600">92%</span>
                    </div>
                    <div className="admin-progress">
                      <div className="admin-progress-bar orange" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">週間予約統計</h3>
              </div>
              <div className="admin-card-content">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">127</div>
                  <div className="text-sm text-gray-600 mb-4">今週の総予約数</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="font-bold text-green-600">98</div>
                      <div className="text-gray-600">確定済み</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="font-bold text-yellow-600">29</div>
                      <div className="text-gray-600">保留中</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}