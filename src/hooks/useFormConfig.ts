import { useState, useEffect, useCallback } from 'react';
import type { FormConfigResponse } from '@/types';
import { logger, loggedFetch } from '@/lib/utils/logger';

export interface UseFormConfigOptions {
  enabled?: boolean;
  onError?: (error: string) => void;
  retryCount?: number;
  retryDelay?: number;
}

export interface UseFormConfigReturn {
  config: FormConfigResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  debugInfo: any;
}

export const useFormConfig = (
  presetId: number,
  options: UseFormConfigOptions = {}
): UseFormConfigReturn => {
  const { 
    enabled = true, 
    onError, 
    retryCount = 3, 
    retryDelay = 1000 
  } = options;
  
  const [config, setConfig] = useState<FormConfigResponse | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const fetchConfig = useCallback(async (attempt = 0) => {
    if (!enabled || presetId < 1) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      console.log(`[useFormConfig] Fetching config for preset: ${presetId} (attempt ${attempt + 1})`);
      
      // API呼び出し
      const response = await fetch(`/api/form/${presetId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`[useFormConfig] API response:`, {
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[useFormConfig] API error response:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      console.log(`[useFormConfig] API result:`, {
        success: result.success,
        hasData: !!result.data,
        productsCount: result.data?.products?.length || 0,
        formSettingsExists: !!result.data?.form_settings,
        presetExists: !!result.data?.preset
      });
      
      if (!result.success || !result.data) {
        throw new Error('フォーム設定の読み込みに失敗しました');
      }
      
      // デバッグ情報の更新
      setDebugInfo({
        presetId,
        responseTime,
        attempt: attempt + 1,
        timestamp: new Date().toISOString(),
        apiResponse: {
          success: result.success,
          dataKeys: result.data ? Object.keys(result.data) : [],
          productsCount: result.data?.products?.length || 0
        }
      });
      
      setConfig(result.data);
      setRetryAttempt(0);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました';
      console.error(`[useFormConfig] Fetch error (attempt ${attempt + 1}):`, err);
      
      // リトライロジック
      if (attempt < retryCount - 1) {
        console.log(`[useFormConfig] Retrying in ${retryDelay}ms...`);
        setRetryAttempt(attempt + 1);
        
        setTimeout(() => {
          fetchConfig(attempt + 1);
        }, retryDelay * (attempt + 1)); // 指数バックオフ
        
        return;
      }
      
      // 最終的なエラー処理
      setError(errorMessage);
      setDebugInfo({
        presetId,
        error: errorMessage,
        attempt: attempt + 1,
        timestamp: new Date().toISOString(),
        finalAttempt: true
      });
      
      onError?.(errorMessage);
    } finally {
      if (attempt === retryCount - 1 || !error) {
        setLoading(false);
      }
    }
  }, [presetId, enabled, onError, retryCount, retryDelay]);

  const refetch = useCallback(async () => {
    setRetryAttempt(0);
    await fetchConfig(0);
  }, [fetchConfig]);

  useEffect(() => {
    if (enabled) {
      fetchConfig(0);
    }
  }, [fetchConfig, enabled]);

  return {
    config,
    loading,
    error,
    refetch,
    debugInfo
  };
};