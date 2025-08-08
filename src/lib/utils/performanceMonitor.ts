/**
 * パフォーマンス監視ユーティリティ
 * Phase 5 - 作業14: パフォーマンス最適化
 */

import React from 'react';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface ComponentRenderMetric {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRender: number;
}

interface ApiRequestMetric {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  error?: string;
  size?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private componentMetrics: Map<string, ComponentRenderMetric> = new Map();
  private apiMetrics: ApiRequestMetric[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     process.env.ENABLE_PERFORMANCE_MONITORING === 'true';
  }

  /**
   * パフォーマンス測定の開始
   */
  startMeasure(name: string, metadata?: Record<string, any>): string {
    if (!this.isEnabled) return name;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.metrics.set(name, metric);
    return name;
  }

  /**
   * パフォーマンス測定の終了
   */
  endMeasure(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`[Performance] Metric not found: ${name}`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    console.log(`[Performance] ${name}: ${metric.duration.toFixed(2)}ms`, metric.metadata);
    return metric.duration;
  }

  /**
   * 関数実行時間の測定
   */
  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.isEnabled) return await fn();

    const measureName = this.startMeasure(name, metadata);
    try {
      const result = await fn();
      this.endMeasure(measureName);
      return result;
    } catch (error) {
      this.endMeasure(measureName);
      throw error;
    }
  }

  /**
   * 同期関数実行時間の測定
   */
  measureSync<T>(
    name: string, 
    fn: () => T, 
    metadata?: Record<string, any>
  ): T {
    if (!this.isEnabled) return fn();

    const measureName = this.startMeasure(name, metadata);
    try {
      const result = fn();
      this.endMeasure(measureName);
      return result;
    } catch (error) {
      this.endMeasure(measureName);
      throw error;
    }
  }

  /**
   * React コンポーネントのレンダリング測定
   */
  measureComponentRender(componentName: string, renderTime: number) {
    if (!this.isEnabled) return;

    const existing = this.componentMetrics.get(componentName);
    if (existing) {
      existing.renderCount++;
      existing.totalRenderTime += renderTime;
      existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
      existing.lastRender = Date.now();
    } else {
      this.componentMetrics.set(componentName, {
        componentName,
        renderCount: 1,
        totalRenderTime: renderTime,
        averageRenderTime: renderTime,
        lastRender: Date.now()
      });
    }
  }

  /**
   * API リクエストの測定開始
   */
  startApiRequest(url: string, method: string): number {
    if (!this.isEnabled) return -1;

    const metric: ApiRequestMetric = {
      url,
      method: method.toUpperCase(),
      startTime: performance.now()
    };

    this.apiMetrics.push(metric);
    return this.apiMetrics.length - 1; // インデックスを返す
  }

  /**
   * API リクエストの測定終了
   */
  endApiRequest(
    index: number, 
    status?: number, 
    error?: string, 
    responseSize?: number
  ) {
    if (!this.isEnabled || index < 0 || index >= this.apiMetrics.length) return;

    const metric = this.apiMetrics[index];
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.status = status;
    metric.error = error;
    metric.size = responseSize;

    const logLevel = error || (status && status >= 400) ? 'error' : 'log';
    console[logLevel](
      `[Performance] API ${metric.method} ${metric.url}: ${metric.duration.toFixed(2)}ms`,
      { status, size: responseSize, error }
    );
  }

  /**
   * Web Vitals の測定
   */
  measureWebVitals() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Core Web Vitals の測定
    if ('web-vitals' in window) {
      import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
        onCLS((metric) => {
          console.log('[WebVitals] CLS:', metric);
        });

        onFCP((metric) => {
          console.log('[WebVitals] FCP:', metric);
        });

        onINP((metric) => {
          console.log('[WebVitals] INP:', metric);
        });

        onLCP((metric) => {
          console.log('[WebVitals] LCP:', metric);
        });

        onTTFB((metric) => {
          console.log('[WebVitals] TTFB:', metric);
        });
      }).catch(() => {
        // web-vitals が利用できない場合は自前で測定
        this.measureBasicWebVitals();
      });
    } else {
      this.measureBasicWebVitals();
    }
  }

  /**
   * 基本的な Web Vitals の測定
   */
  private measureBasicWebVitals() {
    if (typeof window === 'undefined') return;

    // ページロード時間
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      console.log(`[Performance] Page Load Time: ${loadTime.toFixed(2)}ms`);
    });

    // DOM 読み込み時間
    document.addEventListener('DOMContentLoaded', () => {
      const domTime = performance.now();
      console.log(`[Performance] DOM Content Loaded: ${domTime.toFixed(2)}ms`);
    });

    // リソース使用状況の監視
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      console.log('[Performance] Memory Usage:', {
        used: `${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      });
    }
  }

  /**
   * パフォーマンス統計の取得
   */
  getStats() {
    if (!this.isEnabled) return null;

    const now = Date.now();
    const recentApiMetrics = this.apiMetrics.filter(
      metric => metric.endTime && (now - metric.endTime) < 5 * 60 * 1000 // 5分以内
    );

    // API統計の計算
    const apiStats = {
      total_requests: recentApiMetrics.length,
      average_response_time: recentApiMetrics.length > 0 
        ? recentApiMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / recentApiMetrics.length
        : 0,
      error_rate: recentApiMetrics.length > 0
        ? recentApiMetrics.filter(m => m.error || (m.status && m.status >= 400)).length / recentApiMetrics.length
        : 0,
      slowest_endpoints: recentApiMetrics
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 5)
        .map(m => ({ url: m.url, method: m.method, duration: m.duration }))
    };

    // コンポーネント統計の計算
    const componentStats = Array.from(this.componentMetrics.values())
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, 10)
      .map(c => ({
        name: c.componentName,
        render_count: c.renderCount,
        average_render_time: Number(c.averageRenderTime.toFixed(2))
      }));

    return {
      api_performance: apiStats,
      component_performance: componentStats,
      cache_stats: this.getCacheStats(),
      timestamp: now
    };
  }

  /**
   * キャッシュ統計の取得
   */
  private getCacheStats() {
    // ブラウザのストレージ使用量を取得
    let localStorageSize = 0;
    let sessionStorageSize = 0;

    try {
      if (typeof window !== 'undefined') {
        localStorageSize = new Blob(Object.values(localStorage)).size;
        sessionStorageSize = new Blob(Object.values(sessionStorage)).size;
      }
    } catch (error) {
      // ストレージアクセスできない場合
    }

    return {
      localStorage_size_kb: Math.round(localStorageSize / 1024),
      sessionStorage_size_kb: Math.round(sessionStorageSize / 1024)
    };
  }

  /**
   * メモリリークの検出
   */
  detectMemoryLeaks() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    const checkMemory = () => {
      if ('memory' in performance) {
        const memoryInfo = (performance as any).memory;
        const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
        const totalMB = memoryInfo.totalJSHeapSize / 1024 / 1024;
        
        // メモリ使用量が異常に高い場合に警告
        if (usedMB > 100) { // 100MB以上
          console.warn(`[Performance] High memory usage detected: ${usedMB.toFixed(2)}MB`);
        }

        // メモリ使用率が90%を超えた場合に警告
        if (usedMB / totalMB > 0.9) {
          console.warn(`[Performance] Memory usage critical: ${(usedMB / totalMB * 100).toFixed(1)}%`);
        }
      }

      // 大量のイベントリスナーをチェック
      const eventTargets = document.querySelectorAll('*');
      let totalListeners = 0;
      eventTargets.forEach(element => {
        // getEventListeners は Chrome DevTools でのみ利用可能
        if ('getEventListeners' in window) {
          const listeners = (window as any).getEventListeners(element);
          totalListeners += Object.keys(listeners).length;
        }
      });

      if (totalListeners > 1000) {
        console.warn(`[Performance] High number of event listeners: ${totalListeners}`);
      }
    };

    // 初回チェック
    setTimeout(checkMemory, 5000);
    
    // 定期的なチェック
    setInterval(checkMemory, 30000); // 30秒ごと
  }

  /**
   * パフォーマンス データのエクスポート
   */
  exportData() {
    if (!this.isEnabled) return null;

    return {
      metrics: Array.from(this.metrics.entries()),
      componentMetrics: Array.from(this.componentMetrics.entries()),
      apiMetrics: this.apiMetrics.slice(-100), // 最新100件
      timestamp: Date.now()
    };
  }

  /**
   * デバッグ情報の出力
   */
  debugLog() {
    if (!this.isEnabled) return;

    console.group('[Performance Monitor Debug]');
    console.log('Active Metrics:', this.metrics.size);
    console.log('Component Metrics:', this.componentMetrics.size);
    console.log('API Metrics:', this.apiMetrics.length);
    console.log('Stats:', this.getStats());
    console.groupEnd();
  }

  /**
   * パフォーマンス監視の有効/無効切り替え
   */
  toggle(enabled?: boolean) {
    this.isEnabled = enabled !== undefined ? enabled : !this.isEnabled;
    console.log(`[Performance] Monitoring ${this.isEnabled ? 'enabled' : 'disabled'}`);
  }
}

// シングルトンインスタンス
export const performanceMonitor = new PerformanceMonitor();

// React コンポーネント用の HOC
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  return function PerformanceTrackedComponent(props: P) {
    const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name;
    
    React.useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        performanceMonitor.measureComponentRender(displayName, endTime - startTime);
      };
    });

    return React.createElement(WrappedComponent, props);
  };
}

// カスタムフック
export function usePerformanceTracking(name: string) {
  const [startTime] = React.useState(() => performance.now());
  
  React.useEffect(() => {
    return () => {
      const endTime = performance.now();
      performanceMonitor.measureComponentRender(name, endTime - startTime);
    };
  }, [name, startTime]);
}

// Fetch API のパフォーマンス測定ラッパー
export async function fetchWithPerformanceTracking(
  url: string, 
  options?: RequestInit
): Promise<Response> {
  const method = options?.method || 'GET';
  const index = performanceMonitor.startApiRequest(url, method);
  
  try {
    const response = await fetch(url, options);
    const contentLength = response.headers.get('content-length');
    const size = contentLength ? parseInt(contentLength) : undefined;
    
    performanceMonitor.endApiRequest(index, response.status, undefined, size);
    return response;
  } catch (error) {
    performanceMonitor.endApiRequest(index, undefined, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}