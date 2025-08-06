'use client';

import { useState, useEffect } from 'react';

const ADMIN_PASSWORD = 'admin123';
const AUTH_KEY = 'nursery-admin-auth';
const AUTH_EXPIRY_HOURS = 24; // 24時間認証を維持

interface AuthData {
  isAuthenticated: boolean;
  timestamp: number;
}

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ローカルストレージから認証状態を確認
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const stored = localStorage.getItem(AUTH_KEY);
        if (stored) {
          const authData: AuthData = JSON.parse(stored);
          const now = Date.now();
          const expiryTime = authData.timestamp + (AUTH_EXPIRY_HOURS * 60 * 60 * 1000);
          
          if (authData.isAuthenticated && now < expiryTime) {
            setIsAuthenticated(true);
          } else {
            // 期限切れの場合は削除
            localStorage.removeItem(AUTH_KEY);
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('認証状態の確認エラー:', error);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // ログイン処理
  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      const authData: AuthData = {
        isAuthenticated: true,
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        setIsAuthenticated(true);
        return true;
      } catch (error) {
        console.error('認証データの保存エラー:', error);
        return false;
      }
    }
    return false;
  };

  // ログアウト処理
  const logout = () => {
    try {
      localStorage.removeItem(AUTH_KEY);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // 認証状態の延長
  const refreshAuth = () => {
    if (isAuthenticated) {
      const authData: AuthData = {
        isAuthenticated: true,
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      } catch (error) {
        console.error('認証延長エラー:', error);
      }
    }
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth
  };
};