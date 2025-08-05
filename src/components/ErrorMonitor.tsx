/**
 * エラー監視コンポーネント - 設計書に従った実装
 */

import React, { useEffect } from 'react';
import { detailedLogger } from '@/lib/utils/detailedLogger';

export const ErrorMonitor: React.FC = () => {
  useEffect(() => {
    // グローバルエラーハンドラー
    const handleError = (event: ErrorEvent) => {
      detailedLogger.error('Global error caught:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    };

    // Promise rejection ハンドラー
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      detailedLogger.error('Unhandled promise rejection:', {
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    };

    // コンソールエラーの監視
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // React error #418 など特定のエラーを検出
      const errorMessage = args.join(' ');
      if (errorMessage.includes('Minified React error #418')) {
        detailedLogger.error('React Error #418 detected (objects as JSX children)', {
          args,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          stack: new Error().stack
        });
      }
      
      originalConsoleError.apply(console, args);
    };

    // パフォーマンス監視
    const observePerformance = () => {
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'navigation') {
                const navEntry = entry as PerformanceNavigationTiming;
                detailedLogger.performance('page-load', navEntry.loadEventEnd - navEntry.fetchStart, {
                  domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                  firstContentfulPaint: navEntry.loadEventEnd - navEntry.fetchStart,
                  type: 'navigation'
                });
              }
              
              if (entry.entryType === 'resource' && entry.duration > 1000) {
                detailedLogger.warn('Slow resource loading', {
                  name: entry.name,
                  duration: entry.duration,
                  type: entry.entryType
                });
              }
            }
          });
          
          observer.observe({ entryTypes: ['navigation', 'resource'] });
        } catch (error) {
          detailedLogger.debug('Performance observer not supported', { error });
        }
      }
    };

    // リソースエラーの監視
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      detailedLogger.error('Resource loading error:', {
        tagName: target.tagName,
        src: (target as any).src || (target as any).href,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleResourceError, true); // capture phase for resource errors
    
    observePerformance();

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleResourceError, true);
      console.error = originalConsoleError;
    };
  }, []);

  // デバッグ情報表示（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '3px',
        fontSize: '12px',
        zIndex: 10000,
        fontFamily: 'monospace'
      }}>
        Error Monitor Active
      </div>
    );
  }

  return null;
};

export default ErrorMonitor;