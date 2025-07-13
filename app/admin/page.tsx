'use client'

import { useState } from 'react'
import AdminLayout from '../components/admin/AdminLayout'
import AdminDashboard from '../components/admin/AdminDashboard'
import FormBuilder from '../components/admin/FormBuilder'
import FormList from '../components/admin/FormList'

// 簡単な認証コンポーネント
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'admin123') {
      onLogin()
    } else {
      setError('パスワードが間違っています')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="text-3xl font-bold text-gray-900">
            管理画面
          </h2>
          <p className="mt-2 text-gray-600">種苗店予約システム</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="パスワードを入力してください"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>
          )}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
            >
              🔓 ログイン
            </button>
          </div>
          <div className="text-center text-sm text-gray-500">
            <p>デモ用パスワード: <span className="font-mono bg-gray-100 px-2 py-1 rounded">admin123</span></p>
          </div>
        </form>
      </div>
    </div>
  )
}

// 予約一覧コンポーネント
function ReservationList() {
  const reservations = [
    { id: 'R001', name: '田中太郎', phone: '090-1234-5678', product: 'トマトの苗', quantity: 3, date: '2024-07-15', amount: 600, status: '確定' },
    { id: 'R002', name: '佐藤花子', phone: '080-9876-5432', product: 'きゅうりの苗', quantity: 2, date: '2024-07-16', amount: 360, status: '保留' },
    { id: 'R003', name: '山田次郎', phone: '070-5555-1234', product: 'なすの苗', quantity: 4, date: '2024-07-17', amount: 880, status: '確定' },
    { id: 'R004', name: '鈴木美香', phone: '090-7777-8888', product: 'ピーマンの苗', quantity: 1, date: '2024-07-18', amount: 190, status: 'キャンセル' },
  ]

  const getStatusBadge = (status: string) => {
    const styles = {
      '確定': 'bg-green-100 text-green-800',
      '保留': 'bg-yellow-100 text-yellow-800',
      'キャンセル': 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2 className="admin-card-title">予約一覧</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            📊 エクスポート
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
            ➕ 新規予約
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">予約ID</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">顧客情報</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">商品</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">引き取り日</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">金額</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">ステータス</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-blue-600">{reservation.id}</td>
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium">{reservation.name}</div>
                    <div className="text-sm text-gray-500">{reservation.phone}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium">{reservation.product}</div>
                    <div className="text-sm text-gray-500">数量: {reservation.quantity}</div>
                  </div>
                </td>
                <td className="py-3 px-4">{reservation.date}</td>
                <td className="py-3 px-4 font-medium">¥{reservation.amount.toLocaleString()}</td>
                <td className="py-3 px-4">{getStatusBadge(reservation.status)}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">編集</button>
                    <button className="text-red-600 hover:text-red-800 text-sm">削除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 商品管理コンポーネント
function ProductManagement() {
  const products = [
    { id: 1, name: 'トマトの苗', price: 200, stock: 50, category: '苗', icon: '🍅' },
    { id: 2, name: 'きゅうりの苗', price: 180, stock: 30, category: '苗', icon: '🥒' },
    { id: 3, name: 'なすの苗', price: 220, stock: 25, category: '苗', icon: '🍆' },
    { id: 4, name: 'ピーマンの苗', price: 190, stock: 40, category: '苗', icon: '🫑' },
    { id: 5, name: 'レタスの種', price: 150, stock: 100, category: '種', icon: '🥬' },
    { id: 6, name: 'にんじんの種', price: 120, stock: 80, category: '種', icon: '🥕' },
  ]

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2 className="admin-card-title">商品管理</h2>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          ➕ 新しい商品を追加
        </button>
      </div>
      
      <div className="admin-grid">
        {products.map((product) => (
          <div key={product.id} className="admin-stat-card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{product.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {product.category}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">✏️</button>
                <button className="p-1 text-red-600 hover:bg-red-50 rounded">🗑️</button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">価格</span>
                <span className="font-medium">¥{product.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">在庫</span>
                <span className={`font-medium ${product.stock < 30 ? 'text-red-600' : 'text-green-600'}`}>
                  {product.stock}個
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')

  if (!isLoggedIn) {
    return <LoginForm onLogin={() => setIsLoggedIn(true)} />
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard />
      case 'reservation-list':
        return <ReservationList />
      case 'product-list':
        return <ProductManagement />
      case 'form-builder':
        return <FormBuilder />
      case 'form-list':
        return <FormList />
      case 'form-settings':
        return (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">フォーム設定</h2>
            </div>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                フォーム設定
              </h3>
              <p className="text-gray-600">
                フォーム全体の設定を管理します。<br />
                通知設定、デザイン設定、セキュリティ設定など。
              </p>
            </div>
          </div>
        )
      default:
        return <AdminDashboard />
    }
  }

  return (
    <AdminLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderContent()}
    </AdminLayout>
  )
}