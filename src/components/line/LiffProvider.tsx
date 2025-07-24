'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Liff } from '@line/liff';
import type { LiffProfile } from '@/types';

interface LiffContextType {
  liff: Liff | null;
  isLoggedIn: boolean;
  profile: LiffProfile | null;
  isReady: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const LiffContext = createContext<LiffContextType>({
  liff: null,
  isLoggedIn: false,
  profile: null,
  isReady: false,
  error: null,
  login: async () => {},
  logout: async () => {},
});

export const useLiff = () => {
  const context = useContext(LiffContext);
  if (!context) {
    throw new Error('useLiff must be used within a LiffProvider');
  }
  return context;
};

interface LiffProviderProps {
  children: React.ReactNode;
}

export const LiffProvider: React.FC<LiffProviderProps> = ({ children }) => {
  const [liff, setLiff] = useState<Liff | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          throw new Error('LIFF ID is not configured');
        }

        // Dynamic import to avoid SSR issues
        const { default: liff } = await import('@line/liff');
        
        await liff.init({ liffId });
        setLiff(liff);

        // Check if user is already logged in
        if (liff.isLoggedIn()) {
          setIsLoggedIn(true);
          
          // Get user profile
          try {
            const userProfile = await liff.getProfile();
            const liffProfile: LiffProfile = {
              userId: userProfile.userId,
              displayName: userProfile.displayName,
              pictureUrl: userProfile.pictureUrl,
              statusMessage: userProfile.statusMessage,
            };
            setProfile(liffProfile);
          } catch (profileError) {
            console.error('Error getting profile:', profileError);
            setError('Failed to get user profile');
          }
        }

        setIsReady(true);
      } catch (initError) {
        console.error('LIFF initialization failed:', initError);
        setError('Failed to initialize LINE app');
        setIsReady(true);
      }
    };

    initializeLiff();
  }, []);

  const login = async () => {
    if (!liff) {
      setError('LIFF is not initialized');
      return;
    }

    try {
      if (!liff.isLoggedIn()) {
        liff.login();
      }
    } catch (loginError) {
      console.error('Login failed:', loginError);
      setError('Login failed');
    }
  };

  const logout = async () => {
    if (!liff) {
      setError('LIFF is not initialized');
      return;
    }

    try {
      if (liff.isLoggedIn()) {
        liff.logout();
        setIsLoggedIn(false);
        setProfile(null);
      }
    } catch (logoutError) {
      console.error('Logout failed:', logoutError);
      setError('Logout failed');
    }
  };

  const value: LiffContextType = {
    liff,
    isLoggedIn,
    profile,
    isReady,
    error,
    login,
    logout,
  };

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
};

// Hook for checking LIFF environment
export const useLiffEnvironment = () => {
  const { liff } = useLiff();
  
  const isInClient = liff?.isInClient() ?? false;
  const isInBrowser = !isInClient;
  const os = liff?.getOS();
  const language = liff?.getLanguage();
  const version = liff?.getVersion();
  
  return {
    isInClient,
    isInBrowser,
    os,
    language,
    version,
  };
};

// Component for handling LIFF loading state
export const LiffGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isReady, error, isLoggedIn, login } = useLiff();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">LINEアプリを初期化中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-green-600 text-4xl mb-4">📱</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">LINEログインが必要です</h2>
          <p className="text-gray-600 mb-4">
            予約システムを利用するには、LINEアカウントでログインしてください。
          </p>
          <button
            onClick={login}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 font-medium"
          >
            LINEでログイン
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};