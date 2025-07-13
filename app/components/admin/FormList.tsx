'use client'

import React, { useState } from 'react'

interface FormTemplate {
  id: string
  name: string
  description: string
  category: string
  fieldCount: number
  createdAt: string
  updatedAt: string
  status: 'active' | 'draft' | 'archived'
  responses: number
}

export default function FormList() {
  const [forms] = useState<FormTemplate[]>([
    {
      id: 'form-001',
      name: '基本予約フォーム',
      description: '種苗店の標準的な予約フォーム',
      category: '予約',
      fieldCount: 8,
      createdAt: '2024-07-01',
      updatedAt: '2024-07-10',
      status: 'active',
      responses: 156
    },
    {
      id: 'form-002',
      name: 'イベント参加申込フォーム',
      description: '園芸教室やワークショップの参加申込用',
      category: 'イベント',
      fieldCount: 12,
      createdAt: '2024-06-15',
      updatedAt: '2024-07-05',
      status: 'active',
      responses: 89
    },
    {
      id: 'form-003',
      name: '顧客アンケート',
      description: 'サービス満足度調査フォーム',
      category: 'アンケート',
      fieldCount: 15,
      createdAt: '2024-06-01',
      updatedAt: '2024-06-20',
      status: 'draft',
      responses: 0
    },
    {
      id: 'form-004',
      name: '配送依頼フォーム',
      description: '商品配送の申込フォーム',
      category: '配送',
      fieldCount: 10,
      createdAt: '2024-05-20',
      updatedAt: '2024-05-25',
      status: 'archived',
      responses: 34
    }
  ])

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const categories = ['all', '予約', 'イベント', 'アンケート', '配送']
  const statuses = ['all', 'active', 'draft', 'archived']

  const filteredForms = forms.filter(form => {
    const matchesCategory = selectedCategory === 'all' || form.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || form.status === selectedStatus
    return matchesCategory && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      'active': 'bg-green-100 text-green-800',
      'draft': 'bg-yellow-100 text-yellow-800',
      'archived': 'bg-gray-100 text-gray-800'
    }
    
    const labels = {
      'active': '公開中',
      'draft': '下書き',
      'archived': 'アーカイブ'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      '予約': '📅',
      'イベント': '🎉',
      'アンケート': '📊',
      '配送': '🚚'
    }
    return icons[category as keyof typeof icons] || '📝'
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">フォーム一覧</h2>
            <p className="text-sm text-gray-600 mt-1">作成済みのフォームを管理できます</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            🛠️ 新しいフォームを作成
          </button>
        </div>

        {/* フィルター */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべて</option>
              {categories.slice(1).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ステータス
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべて</option>
              <option value="active">公開中</option>
              <option value="draft">下書き</option>
              <option value="archived">アーカイブ</option>
            </select>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{forms.filter(f => f.status === 'active').length}</div>
            <div className="text-sm text-blue-800">公開中</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{forms.filter(f => f.status === 'draft').length}</div>
            <div className="text-sm text-yellow-800">下書き</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{forms.reduce((sum, f) => sum + f.responses, 0)}</div>
            <div className="text-sm text-green-800">総回答数</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{forms.length}</div>
            <div className="text-sm text-purple-800">総フォーム数</div>
          </div>
        </div>
      </div>

      {/* フォーム一覧 */}
      <div className="admin-grid">
        {filteredForms.map((form) => (
          <div key={form.id} className="admin-stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getCategoryIcon(form.category)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{form.name}</h3>
                  <p className="text-sm text-gray-600">{form.description}</p>
                </div>
              </div>
              {getStatusBadge(form.status)}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">カテゴリ</span>
                <span className="font-medium">{form.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">フィールド数</span>
                <span className="font-medium">{form.fieldCount}個</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">回答数</span>
                <span className="font-medium text-blue-600">{form.responses}件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">最終更新</span>
                <span className="font-medium">{form.updatedAt}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                ✏️ 編集
              </button>
              <button className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                👁️ プレビュー
              </button>
              <button className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">
                📊
              </button>
              <button className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">
                ⋮
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredForms.length === 0 && (
        <div className="admin-card">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              フォームが見つかりません
            </h3>
            <p className="text-gray-600 mb-6">
              選択した条件に一致するフォームがありません。<br />
              フィルターを変更するか、新しいフォームを作成してください。
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              🛠️ 新しいフォームを作成
            </button>
          </div>
        </div>
      )}
    </div>
  )
}