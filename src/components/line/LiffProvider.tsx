'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Liff } from '@line/liff';
import type { LiffProfile } from '@/types';
import { safeRender } from '@/lib/utils/errorUtils';

interface LiffContextType {
  liff: Liff | null;
  profile: LiffProfile | null;
  isReady: boolean;
  error: string | null;
  isInLineApp: boolean;
}

const LiffContext = createContext<LiffContextType>({
  liff: null,
  profile: null,
  isReady: false,
  error: null,
  isInLineApp: false,
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
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInLineApp, setIsInLineApp] = useState(false);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        console.log('LIFF ID:', liffId);
        console.log('Base URL:', process.env.NEXT_PUBLIC_BASE_URL);
        
        if (!liffId) {
          throw new Error('LIFF ID is not configured');
        }

        // Dynamic import to avoid SSR issues
        const { default: liff } = await import('@line/liff');
        console.log('LIFF SDK loaded successfully');
        
        await liff.init({ 
          liffId,
          withLoginOnExternalBrowser: false // ログイン不要、LINEアプリ内のみ
        });
        console.log('LIFF initialized successfully');
        setLiff(liff);
        
        // LINEアプリ内かどうかをチェック
        setIsInLineApp(liff.isInClient());

        // プロフィール情報を取得（ログイン不要）
        try {
          const userProfile = await liff.getProfile();
          const liffProfile: LiffProfile = {
            userId: userProfile.userId,
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl,
            statusMessage: userProfile.statusMessage,
          };
          setProfile(liffProfile);
          console.log('Profile loaded:', liffProfile.displayName);
        } catch (profileError) {
          console.warn('Profile not available (may be accessed outside LINE app):', profileError);
          // LINEアプリ外からのアクセスの場合、デモユーザープロフィールを設定
          if (!liff.isInClient()) {
            setProfile({
              userId: 'demo-user',
              displayName: 'デモユーザー',
              pictureUrl: undefined,
              statusMessage: undefined,
            });
          }
        }

        setIsReady(true);
      } catch (initError) {
        console.error('LIFF initialization failed:', initError);
        
        // Detailed error messages
        let errorMessage = 'Failed to initialize LINE app';
        if (initError instanceof Error) {
          if (initError.message.includes('LIFF ID is not configured')) {
            errorMessage = 'LIFF設定が見つかりません';
          } else if (initError.message.includes('Invalid LIFF ID')) {
            errorMessage = '無効なLIFF IDです';
          } else if (initError.message.includes('LIFF endpoint')) {
            errorMessage = 'エンドポイントURLの設定を確認してください';
          } else {
            errorMessage = `LINEアプリの初期化に失敗: ${initError.message}`;
          }
        }
        
        setError(errorMessage);
        setIsReady(true);
      }
    };

    initializeLiff();
  }, []);

  const value: LiffContextType = {
    liff,
    profile,
    isReady,
    error,
    isInLineApp,
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
  const { isReady, error, isInLineApp } = useLiff();

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
          <p className="text-gray-600 mb-4">{safeRender(error, 'エラーが発生しました')}</p>
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

  // LINEアプリ外からのアクセスの場合は注意表示
  if (!isInLineApp) {
    console.warn('LINEアプリ外からのアクセスです');
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 注意バナー */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>注意:</strong> このサイトはLINEアプリ内での利用を想定しています。
                正常な動作のためにはLINE公式アカウントからアクセスしてください。
              </p>
            </div>
          </div>
        </div>
        
        {/* 通常のコンテンツ */}
        <div className="pt-4">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};