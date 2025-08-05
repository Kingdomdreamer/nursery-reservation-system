/**
 * グローバルエラー境界 - 改善指示書に基づく実装
 * アプリケーション全体のエラーハンドリング
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { detailedLogger } from '@/lib/utils/detailedLogger';

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

interface GlobalErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, errorId: string, onRetry: () => void) => ReactNode;
}

/**
 * エラー報告サービス（将来の拡張用）
 */
class ErrorReportingService {
  static report(error: Error, errorInfo: ErrorInfo, errorId: string) {
    // 本番環境では外部エラー報告サービスに送信
    // 例: Sentry, LogRocket, Bugsnag など
    if (process.env.NODE_ENV === 'production') {
      // await errorReportingClient.captureException(error, {
      //   tags: { errorId },
      //   extra: { errorInfo }
      // });
    }
    
    // 詳細ログにも記録
    detailedLogger.errorBoundary(error, errorInfo, 'GlobalErrorBoundary');
  }
}

/**
 * デフォルトのエラーフォールバックUI
 */
const DefaultErrorFallback: React.FC<{
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  onRetry: () => void;
}> = ({ error, errorInfo, errorId, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h1 className="text-lg font-medium text-gray-900">
            アプリケーションエラー
          </h1>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          申し訳ございません。予期しないエラーが発生しました。
        </p>
        <p className="text-xs text-gray-500">
          エラーID: {errorId}
        </p>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={onRetry}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          再試行
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          ページを再読み込み
        </button>
      </div>
      
      {/* デバッグ情報（開発環境のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            開発者向け詳細情報
          </summary>
          <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
            <div className="mb-2">
              <strong>エラーメッセージ:</strong>
              <pre className="mt-1 whitespace-pre-wrap">{error.message}</pre>
            </div>
            <div className="mb-2">
              <strong>スタックトレース:</strong>
              <pre className="mt-1 whitespace-pre-wrap overflow-auto max-h-32">
                {error.stack}
              </pre>
            </div>
            <div>
              <strong>コンポーネントスタック:</strong>
              <pre className="mt-1 whitespace-pre-wrap overflow-auto max-h-32">
                {errorInfo.componentStack}
              </pre>
            </div>
          </div>
        </details>
      )}
    </div>
  </div>
);

/**
 * グローバルエラー境界コンポーネント
 */
export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    // エラーIDの生成
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId!;
    
    console.error('GlobalErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId
    });

    // エラー報告サービスに送信
    ErrorReportingService.report(error, errorInfo, errorId);

    this.setState({ 
      error, 
      errorInfo 
    });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined 
    });
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo && this.state.errorId) {
      // カスタムフォールバックUIがある場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error, 
          this.state.errorInfo, 
          this.state.errorId,
          this.handleRetry
        );
      }

      // デフォルトのエラーUI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;