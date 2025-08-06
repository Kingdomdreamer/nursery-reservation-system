'use client';

import { ReactNode, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminAuthWrapperProps {
  children: ReactNode | (({ onLogout }: { onLogout: () => void }) => ReactNode);
}

export default function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const { isAuthenticated, isLoading, login, logout } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleLogin = () => {
    const success = login(password);
    if (success) {
      setAuthError('');
      setPassword('');
    } else {
      setAuthError('パスワードが間違っています');
    }
  };

  const handleLogout = () => {
    logout();
    setPassword('');
    setAuthError('');
  };

  // 読み込み中の表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合はログイン画面を表示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              管理者ログイン
            </h1>
            <p className="text-gray-600 text-sm">
              管理画面にアクセスするにはパスワードが必要です
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="パスワードを入力してください"
                autoFocus
              />
            </div>
            
            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-red-800 text-sm">{authError}</div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleLogin}
              disabled={!password.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ログイン
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              ログイン状態は24時間維持されます
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 認証済みの場合は子コンポーネントにログアウト関数を渡して表示
  return (
    <>
      {typeof children === 'function' ? children({ onLogout: handleLogout }) : children}
    </>
  );
}