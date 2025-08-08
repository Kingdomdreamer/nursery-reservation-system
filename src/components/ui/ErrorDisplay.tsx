'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * エラー表示の統一コンポーネント
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: string;
  timestamp?: string;
  field?: string;
  retryAfter?: number;
}

interface ErrorDisplayProps {
  error: ErrorInfo | string;
  variant?: 'error' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  variant = 'error',
  size = 'medium',
  showDetails = false,
  showRetry = false,
  onRetry,
  onDismiss,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // エラー情報の正規化
  const errorInfo: ErrorInfo = typeof error === 'string' 
    ? { message: error }
    : error;

  // スタイルの設定
  const variantStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconStyles = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  const sizeStyles = {
    small: 'p-2 text-sm',
    medium: 'p-4 text-base',
    large: 'p-6 text-lg'
  };

  // リトライ処理
  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  // エラーメッセージの表示用処理
  const displayMessage = getDisplayMessage(errorInfo);

  return (
    <div className={`
      border rounded-lg shadow-sm
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `}>
      <div className="flex items-start gap-3">
        {/* エラーアイコン */}
        <div className={`mt-0.5 ${iconStyles[variant]}`}>
          <AlertTriangle size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />
        </div>

        {/* エラー内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">
                {errorInfo.code && (
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded mr-2">
                    {errorInfo.code}
                  </span>
                )}
                {displayMessage}
              </h3>

              {/* フィールドエラーの表示 */}
              {errorInfo.field && (
                <p className="text-sm opacity-75 mb-2">
                  対象フィールド: {errorInfo.field}
                </p>
              )}

              {/* リトライ時間の表示 */}
              {errorInfo.retryAfter && (
                <p className="text-sm opacity-75 mb-2">
                  {errorInfo.retryAfter}秒後に再試行してください
                </p>
              )}

              {/* 詳細情報の表示 */}
              {(showDetails && errorInfo.details) && (
                <div className="mt-2">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-sm hover:underline"
                  >
                    詳細を{isExpanded ? '非表示' : '表示'}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  {isExpanded && (
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                      {errorInfo.details}
                    </pre>
                  )}
                </div>
              )}

              {/* タイムスタンプ */}
              {errorInfo.timestamp && (
                <p className="text-xs opacity-50 mt-2">
                  {new Date(errorInfo.timestamp).toLocaleString('ja-JP')}
                </p>
              )}
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-2 ml-2">
              {showRetry && onRetry && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className={`
                    flex items-center gap-1 px-3 py-1 rounded text-sm
                    border border-current hover:bg-current hover:text-white
                    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <RefreshCw 
                    size={14} 
                    className={isRetrying ? 'animate-spin' : ''} 
                  />
                  {isRetrying ? '再試行中...' : '再試行'}
                </button>
              )}

              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="p-1 hover:bg-current hover:text-white rounded transition-colors"
                  aria-label="エラーを閉じる"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * エラーメッセージの表示用処理
 */
const getDisplayMessage = (errorInfo: ErrorInfo): string => {
  const { message, code } = errorInfo;

  // よくあるエラーコードに対する日本語メッセージ
  const friendlyMessages: Record<string, string> = {
    VALIDATION_ERROR: '入力内容に問題があります',
    AUTHENTICATION_REQUIRED: 'ログインが必要です',
    AUTHORIZATION_FAILED: 'アクセス権限がありません',
    RESOURCE_NOT_FOUND: 'リソースが見つかりません',
    RESOURCE_CONFLICT: 'データが競合しています',
    RATE_LIMIT_EXCEEDED: 'アクセス制限に達しました',
    DATABASE_ERROR: 'データベースエラーが発生しました',
    EXTERNAL_SERVICE_ERROR: '外部サービスエラーが発生しました',
    NETWORK_ERROR: 'ネットワークエラーが発生しました',
    RESERVATION_ERROR: '予約処理でエラーが発生しました',
    PRESET_ERROR: 'フォーム設定エラーが発生しました',
    PRODUCT_ERROR: '商品データエラーが発生しました',
    LINE_MESSAGING_ERROR: 'LINE通知エラーが発生しました'
  };

  // コードに対応するメッセージがある場合はそれを使用
  if (code && friendlyMessages[code]) {
    return friendlyMessages[code];
  }

  // そうでなければ元のメッセージを使用
  return message;
};

/**
 * エラー境界でのエラー表示用コンポーネント
 */
export const ErrorBoundaryDisplay: React.FC<{
  error: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <ErrorDisplay
          error={{
            message: 'アプリケーションでエラーが発生しました',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            timestamp: new Date().toISOString()
          }}
          variant="error"
          size="large"
          showDetails={true}
          showRetry={true}
          onRetry={resetError}
        />
        
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * フォーム用のエラー表示コンポーネント
 */
export const FormError: React.FC<{
  error: string | null;
  field?: string;
}> = ({ error, field }) => {
  if (!error) return null;

  return (
    <ErrorDisplay
      error={{ message: error, field }}
      variant="error"
      size="small"
      className="mt-2"
    />
  );
};

/**
 * API エラー用の表示コンポーネント
 */
export const ApiError: React.FC<{
  error: any;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ error, onRetry, onDismiss }) => {
  // API エラーオブジェクトから情報を抽出
  const errorInfo: ErrorInfo = {
    message: error?.message || error?.error || 'エラーが発生しました',
    code: error?.code,
    details: error?.details,
    timestamp: error?.timestamp,
    field: error?.field,
    retryAfter: error?.retryAfter
  };

  return (
    <ErrorDisplay
      error={errorInfo}
      variant="error"
      showDetails={!!errorInfo.details}
      showRetry={!!onRetry}
      onRetry={onRetry}
      onDismiss={onDismiss}
    />
  );
};