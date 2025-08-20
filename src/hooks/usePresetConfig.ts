/**
 * プリセット設定取得フック - 改善指示書に基づく実装
 * React Query を使用したデータ取得とキャッシュ管理
 */

import { useState, useEffect, useCallback } from 'react';
import type { FormConfigResponse } from '@/types';
import { 
  InvalidPresetIdError,
  isFormConfigResponse 
} from '@/types';

export interface UsePresetConfigOptions {
  enabled?: boolean;
  onError?: (error: string) => void;
  retryCount?: number;
  retryDelay?: number;
  staleTime?: number; // キャッシュの有効期間（ミリ秒）
}

export interface UsePresetConfigReturn {
  data: FormConfigResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isStale: boolean; // データが古いかどうか
  lastFetched: Date | null;
}

/**
 * プリセット設定を取得するカスタムフック
 */
export const usePresetConfig = (
  presetId: number,
  options: UsePresetConfigOptions = {}
): UsePresetConfigReturn => {
  const { 
    enabled = true, 
    onError, 
    retryCount = 3, 
    retryDelay = 1000,
    staleTime = 5 * 60 * 1000 // 5分間キャッシュ
  } = options;
  
  const [data, setData] = useState<FormConfigResponse | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // データが古いかどうかの判定
  const isStale = lastFetched ? (Date.now() - lastFetched.getTime()) > staleTime : true;

  const fetchConfig = useCallback(async (attempt = 0) => {
    if (!enabled || presetId < 1) {
      setIsLoading(false);
      return;
    }

    // プリセットIDの検証
    if (!Number.isInteger(presetId) || presetId < 1) {
      const errorMessage = '無効なプリセットIDです';
      setError(errorMessage);
      onError?.(errorMessage);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const startTime = Date.now();
      console.log(`[usePresetConfig] Fetching config for preset: ${presetId} (attempt ${attempt + 1})`);
      
      // 新しい統一APIエンドポイントを使用
      const response = await fetch(`/api/presets/${presetId}/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`[usePresetConfig] API response:`, {
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `API error: ${response.status} ${response.statusText}`;
        
        console.error(`[usePresetConfig] API error response:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          details: errorData
        });
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      console.log(`[usePresetConfig] API result:`, {
        success: result.success,
        hasData: !!result.data,
        productsCount: result.data?.products?.length || 0,
        formSettingsExists: !!result.data?.form_settings,
        presetExists: !!result.data?.preset
      });
      
      if (!result.success || !result.data) {
        throw new Error('フォーム設定の読み込みに失敗しました');
      }
      
      // データの型安全性チェック
      if (!isFormConfigResponse(result.data)) {
        throw new Error('Invalid API response format');
      }
      
      setData(result.data);
      setLastFetched(new Date());
      setRetryAttempt(0);
      
      console.log(`[usePresetConfig] Successfully loaded config for preset ${presetId}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました';
      console.error(`[usePresetConfig] Fetch error (attempt ${attempt + 1}):`, err);
      
      // リトライロジック
      if (attempt < retryCount - 1) {
        console.log(`[usePresetConfig] Retrying in ${retryDelay * (attempt + 1)}ms...`);
        setRetryAttempt(attempt + 1);
        
        // テスト環境では即座にリトライ
        const delay = process.env.NODE_ENV === 'test' ? 0 : retryDelay * (attempt + 1);
        setTimeout(() => {
          fetchConfig(attempt + 1);
        }, delay);
        
        return;
      }
      
      // 最終的なエラー処理
      setError(errorMessage);
      onError?.(errorMessage);
      
    } finally {
      if (attempt === retryCount - 1 || !error) {
        setIsLoading(false);
      }
    }
  }, [presetId, enabled, onError, retryCount, retryDelay, staleTime]);

  const refetch = useCallback(async () => {
    setRetryAttempt(0);
    await fetchConfig(0);
  }, [fetchConfig]);

  // 初回データ取得 or データが古い場合の再取得
  useEffect(() => {
    if (enabled && (isStale || !data)) {
      fetchConfig(0);
    }
  }, [fetchConfig, enabled, isStale, data]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isStale,
    lastFetched
  };
};