import React, { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui';
import { categorizeError, errorLogger, type AppError } from '@/lib/utils/errorHandler';

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: AppError; retry: () => void }>;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError = categorizeError(error);
    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const appError = categorizeError(error);
    
    // Log the error
    errorLogger.log(appError, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ErrorBoundary',
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
interface DefaultErrorFallbackProps {
  error: AppError;
  retry: () => void;
}

const DefaultErrorFallback = React.memo<DefaultErrorFallbackProps>(({ error, retry }) => {
  const getErrorTitle = (error: AppError): string => {
    switch (error.type) {
      case 'VALIDATION':
        return '入力エラー';
      case 'NETWORK':
        return 'ネットワークエラー';
      case 'DATABASE':
        return 'データベースエラー';
      case 'AUTHENTICATION':
        return '認証エラー';
      case 'PERMISSION':
        return '権限エラー';
      case 'NOT_FOUND':
        return '見つかりません';
      case 'LINE_API':
        return 'LINE連携エラー';
      default:
        return 'エラーが発生しました';
    }
  };

  const getErrorIcon = (error: AppError): string => {
    switch (error.type) {
      case 'VALIDATION':
        return '⚠️';
      case 'NETWORK':
        return '🌐';
      case 'DATABASE':
        return '💾';
      case 'AUTHENTICATION':
        return '🔐';
      case 'PERMISSION':
        return '🚫';
      case 'NOT_FOUND':
        return '🔍';
      case 'LINE_API':
        return '💬';
      default:
        return '❌';
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="text-4xl mb-4">{getErrorIcon(error)}</div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {getErrorTitle(error)}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {error.userMessage || error.message}
          </p>

          <div className="space-y-3">
            <Button
              onClick={retry}
              className="w-full"
              variant="primary"
            >
              再試行
            </Button>
            
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
              variant="outline"
            >
              ページを再読み込み
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                開発者情報
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono">
                <p><strong>Type:</strong> {error.type}</p>
                <p><strong>Name:</strong> {error.name}</p>
                <p><strong>Message:</strong> {error.message}</p>
                {error.code && <p><strong>Code:</strong> {error.code}</p>}
                {error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-xs">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
});

DefaultErrorFallback.displayName = 'DefaultErrorFallback';

// Hook for functional components error handling
export const useErrorHandler = () => {
  const [error, setError] = React.useState<AppError | null>(null);

  const handleError = React.useCallback((error: unknown) => {
    const appError = categorizeError(error);
    setError(appError);
    errorLogger.log(appError);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
};