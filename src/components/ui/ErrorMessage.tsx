/**
 * エラーメッセージコンポーネント - 改善指示書に基づく実装
 * 統一されたエラー表示とアクション
 */

import React from 'react';
// import { Button } from './button'; // 簡素化のためコメントアウト

export interface ErrorMessageProps {
  error: Error | string;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  showDetails?: boolean;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  title = 'エラーが発生しました',
  actionLabel = '再試行',
  onAction,
  showDetails = false,
  className = ''
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-red-400" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {title}
          </h3>
          <p className="text-sm text-red-700 mt-1">
            {errorMessage}
          </p>
          
          {onAction && (
            <div className="mt-3">
              <button
                onClick={onAction}
                className="px-3 py-1 text-sm font-medium text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
              >
                {actionLabel}
              </button>
            </div>
          )}
          
          {/* デバッグ情報（開発環境のみ） */}
          {showDetails && errorStack && process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                エラー詳細を表示
              </summary>
              <pre className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded overflow-auto max-h-32 whitespace-pre-wrap">
                {errorStack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

// 互換性のための追加エクスポート
export const FullScreenError: React.FC<ErrorMessageProps> = (props) => (
  <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50 p-4">
    <div className="max-w-md w-full">
      <ErrorMessage {...props} />
    </div>
  </div>
);

export const errorVariants = {
  inline: 'p-2 rounded text-sm',
  card: 'p-4 rounded-lg',
  banner: 'p-3 rounded-md'
};

export type FullScreenErrorProps = ErrorMessageProps;

export default ErrorMessage;