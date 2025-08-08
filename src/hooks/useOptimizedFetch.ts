/**
 * 最適化されたデータフェッチフック
 * Phase 5 - 作業14: パフォーマンス最適化
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { performanceMonitor } from '@/lib/utils/performanceMonitor';

interface FetchState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  fromCache?: boolean;
}

interface UseFetchOptions {
  enabled?: boolean;
  retry?: number;
  retryDelay?: number;
  cacheTime?: number;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  debounce?: number;
  throttle?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTime: number;
}

// グローバルキャッシュ
const cache = new Map<string, CacheEntry<any>>();

// リクエストの重複排除
const pendingRequests = new Map<string, Promise<any>>();

// デバウンス用のタイマー
const debounceTimers = new Map<string, NodeJS.Timeout>();

// スロットル用の最終実行時刻
const throttleTimestamps = new Map<string, number>();

/**
 * 最適化されたデータフェッチフック
 */
export function useOptimizedFetch<T = any>(
  url: string | null,
  options: UseFetchOptions = {}
): FetchState<T> & {
  refetch: () => Promise<void>;
  mutate: (data: T) => void;
  invalidate: () => void;
} {
  const {
    enabled = true,
    retry = 3,
    retryDelay = 1000,
    cacheTime = 5 * 60 * 1000, // 5分
    staleTime = 0,
    refetchOnWindowFocus = false,
    refetchOnReconnect = true,
    debounce = 0,
    throttle = 0
  } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    loading: false
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  // キャッシュキーの生成
  const cacheKey = useMemo(() => {
    return url ? `${url}${JSON.stringify(options)}` : null;
  }, [url, options]);

  // データフェッチ関数
  const fetchData = useCallback(async (ignoreCache = false): Promise<void> => {
    if (!url || !enabled) return;

    // キャッシュチェック
    if (!ignoreCache && cacheKey) {
      const cachedEntry = cache.get(cacheKey);
      if (cachedEntry && (Date.now() - cachedEntry.timestamp) < cachedEntry.staleTime) {
        setState({
          data: cachedEntry.data,
          error: null,
          loading: false,
          fromCache: true
        });
        return;
      }
    }

    // デバウンス処理
    if (debounce > 0 && cacheKey) {
      const existingTimer = debounceTimers.get(cacheKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      return new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          debounceTimers.delete(cacheKey);
          fetchData(ignoreCache).then(resolve);
        }, debounce);
        debounceTimers.set(cacheKey, timer);
      });
    }

    // スロットル処理
    if (throttle > 0 && cacheKey) {
      const lastExecution = throttleTimestamps.get(cacheKey) || 0;
      const timeSinceLastExecution = Date.now() - lastExecution;
      
      if (timeSinceLastExecution < throttle) {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            fetchData(ignoreCache).then(resolve);
          }, throttle - timeSinceLastExecution);
        });
      }
      
      throttleTimestamps.set(cacheKey, Date.now());
    }

    // 重複リクエストの排除
    if (cacheKey && pendingRequests.has(cacheKey)) {
      try {
        const result = await pendingRequests.get(cacheKey);
        if (mountedRef.current) {
          setState({
            data: result,
            error: null,
            loading: false,
            fromCache: false
          });
        }
        return;
      } catch (error) {
        // エラーは後で処理
      }
    }

    // 前のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    const executeRequest = async (): Promise<T> => {
      const apiRequestIndex = performanceMonitor.startApiRequest(url, 'GET');
      
      try {
        const response = await fetch(url, {
          signal: abortControllerRef.current?.signal,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
          performanceMonitor.endApiRequest(apiRequestIndex, response.status, errorMessage);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        const responseSize = response.headers.get('content-length');
        performanceMonitor.endApiRequest(
          apiRequestIndex, 
          response.status, 
          undefined, 
          responseSize ? parseInt(responseSize) : undefined
        );

        return data.data || data;
      } catch (error) {
        performanceMonitor.endApiRequest(
          apiRequestIndex, 
          undefined, 
          error instanceof Error ? error.message : 'Unknown error'
        );
        throw error;
      }
    };

    // リクエストを pending に追加
    const requestPromise = executeRequest();
    if (cacheKey) {
      pendingRequests.set(cacheKey, requestPromise);
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await requestPromise;
      
      if (mountedRef.current) {
        setState({
          data,
          error: null,
          loading: false,
          fromCache: false
        });

        // キャッシュに保存
        if (cacheKey) {
          cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            staleTime: staleTime || cacheTime
          });
        }
      }

      retryCountRef.current = 0;
    } catch (error) {
      if (!mountedRef.current) return;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // リトライ処理
      if (retryCountRef.current < retry && !errorMessage.includes('aborted')) {
        retryCountRef.current++;
        console.log(`[useOptimizedFetch] Retrying request (${retryCountRef.current}/${retry}):`, url);
        
        setTimeout(() => {
          fetchData(ignoreCache);
        }, retryDelay * Math.pow(2, retryCountRef.current - 1)); // 指数バックオフ
        
        return;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
    } finally {
      // pending から削除
      if (cacheKey) {
        pendingRequests.delete(cacheKey);
      }
    }
  }, [url, enabled, retry, retryDelay, cacheTime, staleTime, debounce, throttle, cacheKey]);

  // リフェッチ関数
  const refetch = useCallback(async () => {
    retryCountRef.current = 0;
    await fetchData(true);
  }, [fetchData]);

  // データの手動更新
  const mutate = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      error: null,
      fromCache: false
    }));

    // キャッシュも更新
    if (cacheKey) {
      cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        staleTime: staleTime || cacheTime
      });
    }
  }, [cacheKey, staleTime, cacheTime]);

  // キャッシュの無効化
  const invalidate = useCallback(() => {
    if (cacheKey) {
      cache.delete(cacheKey);
    }
  }, [cacheKey]);

  // 初回フェッチ
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ウィンドウフォーカス時のリフェッチ
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (document.hidden) return;
      refetch();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch, refetchOnWindowFocus]);

  // ネットワーク再接続時のリフェッチ
  useEffect(() => {
    if (!refetchOnReconnect) return;

    const handleOnline = () => refetch();
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refetch, refetchOnReconnect]);

  // クリーンアップ
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    refetch,
    mutate,
    invalidate
  };
}

/**
 * 複数のエンドポイントを並列フェッチ
 */
export function useParallelFetch<T extends Record<string, any>>(
  requests: Record<keyof T, { url: string; options?: UseFetchOptions }>
): Record<keyof T, FetchState<T[keyof T]>> & {
  refetchAll: () => Promise<void>;
  isAnyLoading: boolean;
  hasAnyError: boolean;
} {
  const results = {} as Record<keyof T, FetchState<T[keyof T]>>;
  const refetchFns: Array<() => Promise<void>> = [];

  Object.entries(requests).forEach(([key, config]) => {
    const { data, error, loading, refetch } = useOptimizedFetch(
      config.url,
      config.options
    );
    
    results[key as keyof T] = { data, error, loading };
    refetchFns.push(refetch);
  });

  const refetchAll = useCallback(async () => {
    await Promise.all(refetchFns.map(fn => fn()));
  }, [refetchFns]);

  const isAnyLoading = Object.values(results).some(result => result.loading);
  const hasAnyError = Object.values(results).some(result => result.error);

  return {
    ...results,
    refetchAll,
    isAnyLoading,
    hasAnyError
  };
}

/**
 * 無限スクロール用のフェッチフック
 */
export function useInfiniteScroll<T>(
  getUrl: (page: number, pageSize: number) => string,
  pageSize: number = 20,
  options: UseFetchOptions = {}
) {
  const [pages, setPages] = useState<T[][]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, error: fetchError, loading: fetchLoading, refetch } = useOptimizedFetch<{
    items: T[];
    total: number;
    hasMore: boolean;
  }>(hasMore ? getUrl(page, pageSize) : null, options);

  useEffect(() => {
    if (data) {
      setPages(prev => [...prev, data.items]);
      setHasMore(data.hasMore);
      setLoading(false);
    }
    if (fetchError) {
      setError(fetchError);
      setLoading(false);
    }
  }, [data, fetchError]);

  const loadMore = useCallback(() => {
    if (!hasMore || fetchLoading) return;
    setLoading(true);
    setPage(prev => prev + 1);
  }, [hasMore, fetchLoading]);

  const reset = useCallback(() => {
    setPages([]);
    setPage(0);
    setHasMore(true);
    setError(null);
  }, []);

  const allItems = useMemo(() => pages.flat(), [pages]);

  return {
    items: allItems,
    loading: fetchLoading || loading,
    error: error || fetchError,
    hasMore,
    loadMore,
    reset,
    refetch
  };
}

/**
 * キャッシュ管理ユーティリティ
 */
export const cacheManager = {
  // 全キャッシュのクリア
  clear: () => {
    cache.clear();
    console.log('[useOptimizedFetch] Cache cleared');
  },

  // パターンマッチでキャッシュをクリア
  clearByPattern: (pattern: string) => {
    const regex = new RegExp(pattern);
    for (const [key] of cache) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
    console.log(`[useOptimizedFetch] Cache cleared for pattern: ${pattern}`);
  },

  // 期限切れキャッシュのクリーンアップ
  cleanup: () => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of cache) {
      if (now - entry.timestamp > entry.staleTime) {
        cache.delete(key);
        cleaned++;
      }
    }
    
    console.log(`[useOptimizedFetch] Cleaned up ${cleaned} expired cache entries`);
  },

  // キャッシュ統計の取得
  getStats: () => {
    const now = Date.now();
    const entries = Array.from(cache.values());
    const expired = entries.filter(entry => now - entry.timestamp > entry.staleTime).length;
    
    return {
      total: cache.size,
      expired,
      active: cache.size - expired,
      size_mb: Math.round(JSON.stringify([...cache.values()]).length / 1024 / 1024 * 100) / 100
    };
  }
};