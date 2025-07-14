'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import { useToast } from './ToastContext'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { showError, showSuccess } = useToast()

  // 管理者権限をチェック（メールアドレスまたはメタデータで判定）
  const isAdmin = user?.email === 'admin@katagiri-shop.com' || 
                  user?.user_metadata?.role === 'admin' ||
                  user?.app_metadata?.role === 'admin'

  useEffect(() => {
    // 初期セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 認証状態の変更をリッスン
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        showError('ログインに失敗しました', error.message)
        return false
      }

      if (data.user) {
        // 管理者権限チェック
        const userIsAdmin = data.user.email === 'admin@katagiri-shop.com' ||
                           data.user.user_metadata?.role === 'admin' ||
                           data.user.app_metadata?.role === 'admin'
        
        if (!userIsAdmin) {
          await supabase.auth.signOut()
          showError('アクセス権限がありません', '管理者アカウントでログインしてください')
          return false
        }

        showSuccess('ログインしました', '管理画面へようこそ')
        return true
      }

      return false
    } catch (error: any) {
      showError('ログインエラー', error.message || '予期しないエラーが発生しました')
      return false
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        showError('ログアウトに失敗しました', error.message)
      } else {
        showSuccess('ログアウトしました', '')
      }
    } catch (error: any) {
      showError('ログアウトエラー', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signOut,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}