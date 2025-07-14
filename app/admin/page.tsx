'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AdminLayout from '../components/admin/AdminLayout'
import AdminDashboard from '../components/admin/AdminDashboard'
import FormBuilder from '../components/admin/FormBuilder'
import FormList from '../components/admin/FormList'
import ProductList from '../components/admin/ProductList'
import ProductAdd from '../components/admin/ProductAdd'
import ReservationListAdmin from '../components/admin/ReservationListAdmin'
import LineTemplateEditor from '../components/admin/LineTemplateEditor'
import CategoryManagement from '../components/admin/CategoryManagement'
import CustomerManagement from '../components/admin/CustomerManagement'

// 本格的な認証コンポーネント
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await signIn(email, password)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-green-50 to-amber-50 px-4"
      style={{
        backgroundImage: 'url(/images/login-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/70 to-amber-900/70 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-sm mx-auto space-y-6 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/20 animate-slideUp">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🌱</div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-700 to-amber-700 bg-clip-text text-transparent">
            片桐商店 ベジライス
          </h2>
          <p className="mt-2 text-gray-600 text-sm sm:text-base">管理システム</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/90 text-base"
              placeholder="admin@katagiri-shop.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/90 text-base"
              placeholder="パスワードを入力してください"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-amber-600 hover:from-green-700 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ログイン中...
                </>
              ) : (
                <>
                  🔓 ログイン
                </>
              )}
            </button>
          </div>
          <div className="text-center text-sm text-gray-500">
            <p>管理者アカウントでログインしてください</p>
          </div>
        </form>
      </div>
    </div>
  )
}


export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証情報を確認中...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <LoginForm />
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard onPageChange={setCurrentPage} />
      case 'reservation-list':
        return <ReservationListAdmin />
      case 'reservation-calendar':
        return (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">予約カレンダー</h2>
            </div>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🗓️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                予約カレンダー
              </h3>
              <p className="text-gray-600">
                カレンダー形式で予約を管理します。
              </p>
            </div>
          </div>
        )
      case 'reservation-search':
        return (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">予約検索</h2>
            </div>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                予約検索
              </h3>
              <p className="text-gray-600">
                詳細条件で予約を検索します。
              </p>
            </div>
          </div>
        )
      case 'product-list':
        return <ProductList />
      case 'product-add':
        return <ProductAdd />
      case 'product-categories':
        return <CategoryManagement />
      case 'customer-list':
        return <CustomerManagement />
      case 'customer-search':
        return (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">顧客検索</h2>
            </div>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                顧客検索
              </h3>
              <p className="text-gray-600">
                詳細条件で顧客を検索します。
              </p>
            </div>
          </div>
        )
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
      case 'business-settings':
        return (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">店舗設定</h2>
            </div>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                店舗設定
              </h3>
              <p className="text-gray-600">
                店舗情報、営業時間、連絡先などの基本設定を管理します。
              </p>
            </div>
          </div>
        )
      case 'notification-settings':
        return <LineTemplateEditor />
      case 'user-management':
        return (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">ユーザー管理</h2>
            </div>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👨‍💼</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ユーザー管理
              </h3>
              <p className="text-gray-600">
                管理者ユーザーの追加・編集・権限設定を行います。
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