'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [envVars, setEnvVars] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    setEnvVars({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***' : undefined,
      NEXT_PUBLIC_LIFF_ID: process.env.NEXT_PUBLIC_LIFF_ID,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">環境変数デバッグ</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">クライアントサイド環境変数</h2>
          <div className="space-y-2">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-4">
                <span className="font-mono text-sm w-64">{key}:</span>
                <span className={`text-sm ${value ? 'text-green-600' : 'text-red-600'}`}>
                  {value ? (key.includes('KEY') || key.includes('SECRET') ? '***設定済み***' : value) : '未設定'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Supabase接続テスト</h2>
          <SupabaseConnectionTest />
        </div>
      </div>
    </div>
  );
}

function SupabaseConnectionTest() {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Dynamic import to avoid build-time errors
        const { supabase } = await import('@/lib/supabase');
        
        // Simple connection test
        const { error } = await supabase.from('product_presets').select('count', { count: 'exact', head: true });
        
        if (error) {
          throw error;
        }
        
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-4">
        <span className="font-mono text-sm w-32">接続状態:</span>
        <span className={`text-sm ${
          status === 'success' ? 'text-green-600' : 
          status === 'error' ? 'text-red-600' : 
          'text-yellow-600'
        }`}>
          {status === 'testing' && 'テスト中...'}
          {status === 'success' && '✅ 接続成功'}
          {status === 'error' && '❌ 接続失敗'}
        </span>
      </div>
      {status === 'error' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 font-mono">{error}</p>
        </div>
      )}
    </div>
  );
}