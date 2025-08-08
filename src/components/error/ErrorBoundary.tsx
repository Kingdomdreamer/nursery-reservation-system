'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorBoundaryDisplay } from '@/components/ui/ErrorDisplay';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary
 * 予期しないエラーをキャッチして適切に表示
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーログの記録
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 本番環境では外部エラーサービスに送信
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }

    // カスタムエラーハンドラーがあれば実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // 外部エラーサービス（Sentry等）への送信
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: window.navigator.userAgent,
      url: window.location.href
    };

    // TODO: 実際のエラーサービスのAPIに送信
    console.log('Error report:', errorReport);
  };

  private resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorBoundaryDisplay;
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * HOC版のErrorBoundary
 */
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * 非同期エラー用のフック
 */
export const useAsyncError = () => {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  return React.useCallback((error: Error) => {
    // React Error Boundaryに非同期エラーを伝播
    console.error('Async error:', error);
    forceUpdate();
    throw error;
  }, [forceUpdate]);
};

/**
 * 特定のページ用のエラーバウンダリ
 */
export const PageErrorBoundary: React.FC<{
  children: ReactNode;
  pageName?: string;
}> = ({ children, pageName }) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error(`Page error in ${pageName || 'unknown page'}:`, error, errorInfo);
  };

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

/**
 * フォーム用のエラーバウンダリ
 */
export const FormErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, onError }) => {
  const customFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        フォームエラーが発生しました
      </h3>
      <p className="text-red-600 mb-4">
        フォームの処理中にエラーが発生しました。ページを再読み込みして再度お試しください。
      </p>
      <div className="flex gap-2">
        <button
          onClick={resetError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          再試行
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          ページを再読み込み
        </button>
      </div>
    </div>
  );

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('Form error:', error, errorInfo);
    if (onError) {
      onError(error);
    }
  };

  return (
    <ErrorBoundary fallback={customFallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};