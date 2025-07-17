import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../../../lib/supabase'
import { AccessibleAlert } from '../ui/AccessibilityHelpers'

/**
 * マルチユーザー認証・ロールベースアクセス制御システム
 * 中優先度タスク：複数管理者のロール分け機能
 */

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'viewer'

export interface Permission {
  id: string
  name: string
  description: string
  category: string
}

export interface Role {
  id: string
  name: string
  display_name: string
  description: string
  permissions: Permission[]
  level: number
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  roles: Role[]
  permissions: Permission[]
  is_active: boolean
  last_login: string
  created_at: string
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasRole: (role: UserRole) => boolean
  canAccess: (resource: string, action: string) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

/**
 * 認証プロバイダーコンポーネント
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初回認証状態チェック
    checkAuthState()
    
    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const checkAuthState = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        await loadUserProfile(authUser.id)
      }
    } catch (error) {
      console.error('認証状態の確認に失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user_roles (
            role:roles (
              *,
              role_permissions (
                permission:permissions (*)
              )
            )
          )
        `)
        .eq('id', userId)
        .single()

      if (error) {
        throw error
      }

      if (profile) {
        const roles = profile.user_roles?.map((ur: any) => ({
          ...ur.role,
          permissions: ur.role.role_permissions?.map((rp: any) => rp.permission) || []
        })) || []

        const permissions = roles.flatMap((role: Role) => role.permissions)
        const primaryRole = roles.find(r => r.level === Math.max(...roles.map(r => r.level)))?.name || 'viewer'

        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: primaryRole as UserRole,
          roles,
          permissions,
          is_active: profile.is_active,
          last_login: profile.last_login,
          created_at: profile.created_at
        })

        // 最終ログイン時刻を更新
        await supabase
          .from('user_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId)
      }
    } catch (error) {
      console.error('ユーザープロフィールの読み込みに失敗:', error)
    }
  }

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }
    } catch (error) {
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      setUser(null)
    } catch (error) {
      throw error
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    return user.permissions.some(p => p.name === permission)
  }

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false
    return user.roles.some(r => r.name === role)
  }

  const canAccess = (resource: string, action: string): boolean => {
    if (!user) return false
    
    // スーパー管理者は全てのアクセス権限を持つ
    if (user.role === 'super_admin') return true
    
    // 特定のリソースとアクションに対する権限をチェック
    const permissionName = `${resource}:${action}`
    return hasPermission(permissionName)
  }

  const refreshUser = async (): Promise<void> => {
    if (user) {
      await loadUserProfile(user.id)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    canAccess,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 認証コンテキストを使用するためのカスタムフック
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * 権限チェック用のコンポーネント
 */
interface ProtectedComponentProps {
  permission?: string
  role?: UserRole
  resource?: string
  action?: string
  fallback?: ReactNode
  children: ReactNode
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  permission,
  role,
  resource,
  action,
  fallback = null,
  children
}) => {
  const { user, hasPermission, hasRole, canAccess } = useAuth()

  if (!user) {
    return <>{fallback}</>
  }

  // 権限チェック
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  // ロールチェック
  if (role && !hasRole(role)) {
    return <>{fallback}</>
  }

  // リソースアクセスチェック
  if (resource && action && !canAccess(resource, action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * ログインフォームコンポーネント
 */
export const LoginForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await login(email, password)
      onSuccess?.()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="needs-validation" noValidate>
      <div className="mb-3">
        <label htmlFor="email" className="form-label">
          メールアドレス <span className="text-danger">*</span>
        </label>
        <input
          type="email"
          id="email"
          className="form-control"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          aria-describedby="email-help"
        />
        <div id="email-help" className="form-text">
          登録されたメールアドレスを入力してください
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="password" className="form-label">
          パスワード <span className="text-danger">*</span>
        </label>
        <input
          type="password"
          id="password"
          className="form-control"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          aria-describedby="password-help"
        />
        <div id="password-help" className="form-text">
          パスワードを入力してください
        </div>
      </div>

      {error && (
        <AccessibleAlert type="error" className="mb-3">
          {error}
        </AccessibleAlert>
      )}

      <div className="d-grid">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !email || !password}
          aria-describedby="login-help"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              ログイン中...
            </>
          ) : (
            'ログイン'
          )}
        </button>
      </div>
      
      <div id="login-help" className="form-text text-center mt-3">
        アカウントをお持ちでない場合は、管理者にお問い合わせください
      </div>
    </form>
  )
}

/**
 * ユーザー管理コンポーネント
 */
export const UserManagement: React.FC = () => {
  const { user, canAccess } = useAuth()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (canAccess('users', 'read')) {
      loadUsers()
    }
  }, [canAccess])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user_roles (
            role:roles (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setUsers(data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ユーザー一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!canAccess('users', 'read')) {
    return (
      <AccessibleAlert type="error">
        ユーザー管理画面へのアクセス権限がありません
      </AccessibleAlert>
    )
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">読み込み中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">ユーザー管理</h5>
      </div>
      <div className="card-body">
        {error && (
          <AccessibleAlert type="error" className="mb-3">
            {error}
          </AccessibleAlert>
        )}

        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th scope="col">名前</th>
                <th scope="col">メールアドレス</th>
                <th scope="col">ロール</th>
                <th scope="col">状態</th>
                <th scope="col">最終ログイン</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge bg-${user.role === 'super_admin' ? 'danger' : 'primary'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge bg-${user.is_active ? 'success' : 'secondary'}`}>
                      {user.is_active ? 'アクティブ' : '無効'}
                    </span>
                  </td>
                  <td>
                    {user.last_login ? 
                      new Date(user.last_login).toLocaleDateString('ja-JP') : 
                      '未ログイン'
                    }
                  </td>
                  <td>
                    <ProtectedComponent resource="users" action="update">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-2"
                        aria-label={`${user.name}を編集`}
                      >
                        編集
                      </button>
                    </ProtectedComponent>
                    <ProtectedComponent resource="users" action="delete">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        aria-label={`${user.name}を削除`}
                      >
                        削除
                      </button>
                    </ProtectedComponent>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default {
  AuthProvider,
  useAuth,
  ProtectedComponent,
  LoginForm,
  UserManagement
}