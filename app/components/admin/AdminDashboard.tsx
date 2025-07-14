'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { Calendar, DollarSign, Users, FileText, Edit, Package, User, Phone, Mail, CheckCircle, Loader, Info } from 'lucide-react'

interface ActivityItem {
  icon: any
  iconColor: string
  text: string
  time: string
  amount: string | null
}

export default function AdminDashboard() {
  const router = useRouter()
  
  const [stats, setStats] = useState([
    {
      icon: 'calendar',
      label: '今日の予約',
      value: '0',
      trend: '+0',
      trendLabel: '昨日比',
      trendType: 'positive',
      color: 'blue'
    },
    {
      icon: 'users',
      label: '総顧客数',
      value: '0',
      trend: '+0',
      trendLabel: '今月',
      trendType: 'positive',
      color: 'purple'
    },
    {
      icon: 'document',
      label: 'フォーム数',
      value: '0',
      trend: '+0',
      trendLabel: '今月追加',
      trendType: 'positive',
      color: 'orange'
    }
  ])
  
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // 今日の予約数
      const today = new Date().toISOString().split('T')[0]
      const { data: todayReservations, error: reservationError } = await supabase
        .from('reservations')
        .select('id')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        
      // 総顧客数
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id')
        
      // フォーム数
      const { data: forms, error: formError } = await supabase
        .from('forms')
        .select('id')
        .eq('is_active', true)
        

      // 最近のアクティビティ
      const { data: activities, error: activityError } = await supabase
        .from('reservations')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          customers!inner(name)
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

      setStats([
        {
          icon: 'calendar',
          label: '今日の予約',
          value: todayCount.toString(),
          trend: '+0',
          trendLabel: '昨日比',
          trendType: 'positive',
          color: 'blue'
        },
        {
          icon: 'users',
          label: '総顧客数',
          value: customerCount.toString(),
          trend: '+0',
          trendLabel: '今月',
          trendType: 'positive',
          color: 'purple'
        },
        {
          icon: 'document',
          label: 'フォーム数',
          value: formCount.toString(),
          trend: '+0',
          trendLabel: '今月追加',
          trendType: 'positive',
          color: 'orange'
        }
      ])

      // 最近のアクティビティを更新
      if (activities) {
        const formattedActivities: ActivityItem[] = activities.map((activity: any) => {
          const timeAgo = getTimeAgo(new Date(activity.created_at))
          return {
            icon: CheckCircle,
            iconColor: 'green',
            text: `${activity.customers?.name || '不明な顧客'}様の予約が${activity.status === 'confirmed' ? '確定' : '受付'}されました`,
            time: timeAgo,
            amount: activity.total_amount ? `¥${activity.total_amount.toLocaleString()}` : null
          }
        })
        setRecentActivities(formattedActivities)
      }

    } catch (error) {
      console.error('ダッシュボードデータの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffMinutes < 60) {
      return `${diffMinutes}分前`
    } else if (diffHours < 24) {
      return `${diffHours}時間前`
    } else {
      return `${Math.floor(diffHours / 24)}日前`
    }
  }

  const quickActions = [
    {
      icon: 'edit',
      title: '新規予約追加',
      description: 'お客様の予約を追加',
      action: () => router.push('/admin/reservations')
    },
    {
      icon: 'packageIcon',
      title: '商品追加',
      description: '新しい商品を登録',
      action: () => router.push('/admin/products/add')
    },
    {
      icon: 'user',
      title: '顧客管理',
      description: '顧客情報を管理',
      action: () => router.push('/admin/customers')
    },
    {
      icon: 'document',
      title: 'フォーム管理',
      description: '予約フォームを管理',
      action: () => router.push('/admin/forms')
    }
  ]

  const upcomingTasks = [
    {
      icon: 'phone',
      task: '田中様への確認電話',
      time: '14:00',
      priority: 'high'
    },
    {
      icon: 'document',
      task: 'フォーム設定の確認',
      time: '15:30',
      priority: 'medium'
    },
    {
      icon: 'mail',
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
      {loading ? (
        <div className="admin-stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="admin-widget blue animate-pulse">
              <div className="admin-widget-header">
                <div className="admin-widget-title">読み込み中...</div>
                <div className="admin-widget-icon">
                  <Loader size={20} className="animate-spin" />
                </div>
              </div>
              <div className="admin-widget-value">---</div>
              <div className="admin-widget-trend positive">
                <span>---</span>
                <span className="text-gray-500">(---)</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className={`admin-widget ${stat.color}`}>
              <div className="admin-widget-header">
                <div className="admin-widget-title">{stat.label}</div>
                <div className="admin-widget-icon">
                  {stat.icon === 'calendar' && <Calendar size={20} />}
                  {stat.icon === 'users' && <Users size={20} />}
                  {stat.icon === 'document' && <FileText size={20} />}
                </div>
              </div>
              <div className="admin-widget-value">{stat.value}</div>
              <div className={`admin-widget-trend ${stat.trendType}`}>
                <span>{stat.trend}</span>
                <span className="text-gray-500">({stat.trendLabel})</span>
              </div>
            </div>
          ))}
        </div>
      )}

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
                      <div className="flex-shrink-0">
                        {action.icon === 'edit' && <Edit size={24} />}
                        {action.icon === 'packageIcon' && <Package size={24} />}
                        {action.icon === 'user' && <User size={24} />}
                        {action.icon === 'document' && <FileText size={24} />}
                      </div>
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
                    <div className="flex-shrink-0">
                      {task.icon === 'phone' && <Phone size={20} />}
                      {task.icon === 'document' && <FileText size={20} />}
                      {task.icon === 'mail' && <Mail size={20} />}
                    </div>
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
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="admin-activity-item animate-pulse">
                      <div className="admin-activity-icon bg-gray-200">
                        <Loader size={16} className="animate-spin" />
                      </div>
                      <div className="admin-activity-content">
                        <div className="admin-activity-text bg-gray-200 h-4 rounded"></div>
                        <div className="admin-activity-time bg-gray-200 h-3 rounded mt-1"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                    <div key={index} className="admin-activity-item">
                      <div className={`admin-activity-icon bg-${activity.iconColor}-100 text-${activity.iconColor}-600`}>
                        <activity.icon size={16} />
                      </div>
                      <div className="admin-activity-content">
                        <div className="admin-activity-text">{activity.text}</div>
                        <div className="admin-activity-time">{activity.time}</div>
                      </div>
                      {activity.amount && (
                        <div className="font-medium text-green-600">{activity.amount}</div>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      <Info size={32} className="mx-auto mb-2 text-gray-400" />
                      <p>最近のアクティビティはありません</p>
                    </div>
                  )}
                </div>
              )}
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