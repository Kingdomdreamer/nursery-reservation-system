'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AdminLayout from '../components/admin/AdminLayout'
import AdminDashboardBootstrap from '../components/admin/AdminDashboardBootstrap'
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
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light position-relative">
      {/* Background Pattern */}
      <div 
        className="position-absolute w-100 h-100 opacity-25"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.1'%3E%3Ccircle cx='6' cy='6' r='6'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg border-0 fade-in">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <div className="display-4 mb-3">🌱</div>
                  <h2 className="h3 fw-bold text-primary mb-1">種苗店管理システム</h2>
                  <p className="text-muted">管理者ログイン</p>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      メールアドレス
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="username"
                      className="form-control form-control-lg"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      パスワード
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      className="form-control form-control-lg"
                      placeholder="パスワードを入力してください"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="d-grid mb-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary btn-lg"
                    >
                      {isLoading ? (
                        <>
                          <span className="loading-spinner me-2"></span>
                          ログイン中...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          ログイン
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="text-center">
                    <small className="text-muted">
                      管理者アカウントでログインしてください
                    </small>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="loading-spinner mb-3"></div>
          <p className="text-muted">認証情報を確認中...</p>
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
        return <AdminDashboardBootstrap />
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
        return <AdminDashboardBootstrap />
    }
  }

  return (
    <AdminLayout>
      {renderContent()}
    </AdminLayout>
  )
}