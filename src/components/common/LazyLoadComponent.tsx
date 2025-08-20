/**
 * 遅延読み込みコンポーネントラッパー
 * Phase 5 - 作業14: パフォーマンス最適化
 */

'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { performanceMonitor } from '@/lib/utils/performanceMonitor';

interface LazyLoadProps {
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  retryCount?: number;
}

// 遅延読み込み可能なコンポーネントの型
type LazyComponent<T = Record<string, unknown>> = React.LazyExoticComponent<ComponentType<T>>;

/**
 * 遅延読み込みコンポーネントのファクトリー
 */
export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  componentName?: string
): LazyComponent<T> {
  return lazy(async () => {
    const measureName = performanceMonitor.startMeasure(
      'component_lazy_load',
      { component: componentName || 'unknown' }
    );

    try {
      const module = await importFn();
      performanceMonitor.endMeasure(measureName);
      return module;
    } catch (error) {
      performanceMonitor.endMeasure(measureName);
      console.error(`[LazyLoad] Failed to load component ${componentName}:`, error);
      throw error;
    }
  });
}

/**
 * 遅延読み込みラッパーコンポーネント
 */
export const LazyLoadComponent: React.FC<LazyLoadProps & {
  component: LazyComponent;
  componentProps?: Record<string, unknown>;
}> = ({
  component: Component,
  componentProps = {},
  fallback = <LazyLoadingSkeleton />,
  onLoad,
  onError,
  retryCount = 3
}) => {
  const [retry, setRetry] = React.useState(0);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  const handleError = React.useCallback((error: Error) => {
    console.error('[LazyLoadComponent] Error:', error);
    setError(error);
    
    if (onError) {
      onError(error);
    }
  }, [onError]);

  const handleRetry = React.useCallback(() => {
    if (retry < retryCount) {
      setError(null);
      setRetry(prev => prev + 1);
    }
  }, [retry, retryCount]);

  if (error) {
    return (
      <LazyLoadError 
        error={error} 
        onRetry={retry < retryCount ? handleRetry : undefined}
        retryCount={retry}
        maxRetries={retryCount}
      />
    );
  }

  return (
    <Suspense fallback={fallback}>
      <Component {...componentProps} />
    </Suspense>
  );
};

/**
 * 読み込み中のスケルトン
 */
export const LazyLoadingSkeleton: React.FC<{
  className?: string;
  height?: number;
  lines?: number;
}> = ({ 
  className = '', 
  height = 200,
  lines = 3
}) => {
  return (
    <div className={`animate-pulse space-y-4 p-4 ${className}`}>
      <div 
        className="bg-gray-200 rounded"
        style={{ height: `${height}px` }}
      />
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-200 rounded"
            style={{ 
              width: `${Math.random() * 40 + 60}%` 
            }}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * エラー表示コンポーネント
 */
const LazyLoadError: React.FC<{
  error: Error;
  onRetry?: () => void;
  retryCount: number;
  maxRetries: number;
}> = ({ error, onRetry, retryCount, maxRetries }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[200px] bg-red-50 border border-red-200 rounded-lg">
      <div className="text-red-600 text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">
          コンポーネントの読み込みに失敗しました
        </h3>
        <p className="text-sm text-red-500">
          {error.message}
        </p>
        {retryCount > 0 && (
          <p className="text-xs text-red-400 mt-2">
            再試行回数: {retryCount}/{maxRetries}
          </p>
        )}
      </div>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          再試行
        </button>
      )}
    </div>
  );
};

/**
 * 高階コンポーネント：既存コンポーネントを遅延読み込み化
 */
export function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  options: LazyLoadProps = {}
) {
  const LazyWrappedComponent = lazy(async () => {
    // 動的インポートをシミュレート
    await new Promise(resolve => setTimeout(resolve, 0));
    return { default: Component };
  });

  return React.forwardRef<HTMLElement, T>((props, ref) => {
    // Cast LazyWrappedComponent to match expected type
    const typedComponent = LazyWrappedComponent as LazyComponent<Record<string, unknown>>;
    return (
      <LazyLoadComponent
        component={typedComponent}
        componentProps={{ ...props, ref }}
        {...options}
      />
    );
  });
}

// 事前定義されたよく使用される遅延読み込みコンポーネント

/**
 * 管理画面用の遅延読み込みコンポーネント
 */
export const LazyAdminDashboard = createLazyComponent(
  () => import('@/app/admin/page'),
  'AdminDashboard'
);

export const LazyProductManagement = createLazyComponent(
  () => import('@/app/admin/products/page'),
  'ProductManagement'
);

export const LazyReservationManagement = createLazyComponent(
  () => import('@/app/admin/reservations/page'),
  'ReservationManagement'
);

/**
 * フォーム用の遅延読み込みコンポーネント
 * 簡略化された実装
 */
export const LazyReservationForm = lazy(() => import('@/components/forms/ReservationForm').then(m => ({ default: m.ReservationForm })));
export const LazyProductSelection = lazy(() => import('@/components/forms/ProductSelection').then(m => ({ default: m.ProductSelection })));
export const LazyPickupDateCalendar = lazy(() => import('@/components/forms/PickupDateCalendar').then(m => ({ default: m.PickupDateCalendar })));

/**
 * プリロード機能
 */
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>();

  /**
   * コンポーネントのプリロード
   */
  static async preload(
    importFn: () => Promise<unknown>,
    componentName: string
  ): Promise<void> {
    if (this.preloadedComponents.has(componentName)) {
      return;
    }

    const measureName = performanceMonitor.startMeasure(
      'component_preload',
      { component: componentName }
    );

    try {
      await importFn();
      this.preloadedComponents.add(componentName);
      console.log(`[ComponentPreloader] Successfully preloaded: ${componentName}`);
    } catch (error) {
      console.error(`[ComponentPreloader] Failed to preload ${componentName}:`, error);
    } finally {
      performanceMonitor.endMeasure(measureName);
    }
  }

  /**
   * 重要なコンポーネントの一括プリロード
   */
  static async preloadCritical(): Promise<void> {
    const criticalComponents = [
      {
        name: 'ReservationForm',
        importFn: () => import('@/components/forms/ReservationForm')
      },
      {
        name: 'ProductSelection',
        importFn: () => import('@/components/forms/ProductSelection')
      },
      {
        name: 'ErrorDisplay',
        importFn: () => import('@/components/ui/ErrorDisplay')
      }
    ];

    await Promise.all(
      criticalComponents.map(({ name, importFn }) => 
        this.preload(importFn, name)
      )
    );

    console.log('[ComponentPreloader] Critical components preloaded');
  }

  /**
   * 管理画面コンポーネントのプリロード
   */
  static async preloadAdmin(): Promise<void> {
    const adminComponents = [
      {
        name: 'AdminDashboard',
        importFn: () => import('@/app/admin/page')
      },
      {
        name: 'ProductManagement',
        importFn: () => import('@/app/admin/products/page')
      },
      {
        name: 'ReservationManagement',
        importFn: () => import('@/app/admin/reservations/page')
      }
    ];

    await Promise.all(
      adminComponents.map(({ name, importFn }) => 
        this.preload(importFn, name)
      )
    );

    console.log('[ComponentPreloader] Admin components preloaded');
  }

  /**
   * プリロード状況の確認
   */
  static getPreloadedComponents(): string[] {
    return Array.from(this.preloadedComponents);
  }

  /**
   * プリロードキャッシュのクリア
   */
  static clearPreloadCache(): void {
    this.preloadedComponents.clear();
    console.log('[ComponentPreloader] Preload cache cleared');
  }
}

/**
 * Route-based プリローダー
 */
export const useRoutePreloader = () => {
  const preloadForRoute = React.useCallback(async (route: string) => {
    const routePreloadMap: Record<string, () => Promise<void>> = {
      '/admin': ComponentPreloader.preloadAdmin,
      '/form': ComponentPreloader.preloadCritical,
      '/cancel': () => ComponentPreloader.preload(
        () => import('@/app/cancel/[reservationId]/page'),
        'CancelReservation'
      )
    };

    const preloadFn = routePreloadMap[route];
    if (preloadFn) {
      await preloadFn();
    }
  }, []);

  return { preloadForRoute };
};

/**
 * Intersection Observer による自動プリロード
 */
export const useIntersectionPreload = (
  targetRef: React.RefObject<HTMLElement>,
  preloadFn: () => Promise<void>
) => {
  React.useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          preloadFn();
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // 100px手前でプリロード
        threshold: 0.1
      }
    );

    observer.observe(target);
    
    return () => observer.disconnect();
  }, [targetRef, preloadFn]);
};