/**
 * 統一エラーハンドリング - Phase 5品質向上実装
 * 包括的なエラー処理とログ機能の統合
 */

import { NextResponse } from 'next/server';
import { 
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  ConfigurationError,
  ReservationError,
  PresetError,
  ProductError,
  LineMessagingError,
  isAppError,
  isOperationalError
} from './customErrors';
import type { 
  ApiSuccessResponse, 
  PaginatedApiResponse,
  PaginationInfo 
} from '@/types/api';

/**
 * APIエラーの統一ハンドラー（強化版）
 */
export const handleApiError = (error: unknown, context?: string): NextResponse => {
  // エラーログの記録
  logError(error, context);

  // AppErrorの処理
  if (isAppError(error)) {
    return createErrorResponse(error);
  }

  // Supabaseエラーの処理
  if (isSupabaseError(error)) {
    const dbError = new DatabaseError('データベースエラーが発生しました', error as Error);
    return createErrorResponse(dbError);
  }

  // ネットワークエラーの処理
  if (isNetworkError(error)) {
    const networkError = new ExternalServiceError('ネットワークエラーが発生しました', 'network');
    return createErrorResponse(networkError);
  }

  // 予期しないエラーの処理
  const unexpectedError = new DatabaseError('データベースエラーが発生しました', error as Error);
  
  return createErrorResponse(unexpectedError);
};

/**
 * AppErrorからNextResponseを生成
 */
const createErrorResponse = (error: AppError): NextResponse => {
  const response: ApiErrorResponse = {
    error: error.message,
    code: error.code,
    message: getEnglishMessage(error.code),
    timestamp: error.timestamp
  };

  // 開発環境ではスタックトレースを含める
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.details = error.stack;
  }

  // 特定のエラータイプに応じた追加フィールド
  if (error instanceof ValidationError && error.field) {
    (response as ApiErrorResponse & { field: string }).field = error.field;
  }

  if (error instanceof RateLimitError && error.retryAfter) {
    (response as ApiErrorResponse & { retryAfter: number }).retryAfter = error.retryAfter;
  }

  return NextResponse.json(response, { status: error.statusCode });
};

/**
 * エラーログの記録
 */
const logError = (error: unknown, context?: string): void => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context: context || 'unknown',
    error: error instanceof Error ? {
      name: error.constructor.name,
      message: error.message,
      stack: error.stack
    } : error,
    environment: process.env.NODE_ENV,
    userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : undefined
  };

  // 運用上の重要エラーは特別にログ
  if (!isOperationalError(error)) {
    console.error('🚨 CRITICAL ERROR:', errorInfo);
    // 本番環境では外部ログサービス（Sentry等）に送信
    if (process.env.NODE_ENV === 'production') {
      // await logToExternalService(errorInfo);
    }
  } else {
    console.warn('⚠️ OPERATIONAL ERROR:', errorInfo);
  }
};

/**
 * エラーコードから英語メッセージを取得
 */
const getEnglishMessage = (code: string): string => {
  const messages: Record<string, string> = {
    VALIDATION_ERROR: 'Validation failed.',
    AUTHENTICATION_REQUIRED: 'Authentication is required.',
    AUTHORIZATION_FAILED: 'Access denied.',
    RESOURCE_NOT_FOUND: 'Resource not found.',
    RESOURCE_CONFLICT: 'Resource conflict.',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded.',
    DATABASE_ERROR: 'Database error occurred.',
    EXTERNAL_SERVICE_ERROR: 'External service error.',
    CONFIGURATION_ERROR: 'Configuration error.',
    RESERVATION_ERROR: 'Reservation error.',
    PRESET_ERROR: 'Preset error.',
    PRODUCT_ERROR: 'Product error.',
    LINE_MESSAGING_ERROR: 'LINE messaging error.',
    UNEXPECTED_ERROR: 'Unexpected error occurred.'
  };

  return messages[code] || 'Unknown error.';
};

/**
 * Supabaseエラーの判定
 */
const isSupabaseError = (error: unknown): error is { message: string; code?: string } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
};

/**
 * ネットワークエラーの判定
 */
const isNetworkError = (error: unknown): error is Error => {
  return (
    error instanceof Error &&
    (error.message.includes('fetch') ||
     error.message.includes('network') ||
     error.message.includes('timeout'))
  );
};

/**
 * エラーレスポンスの標準化
 */
export interface ApiErrorResponse {
  error: string;
  code: string;
  message: string;
  details?: string;
  timestamp?: string;
}

/**
 * 成功レスポンスの標準化（ローカル定義を削除）
 */

/**
 * 成功レスポンスの生成（統一API型対応）
 */
export const createSuccessResponse = <T>(
  data: T, 
  meta?: Record<string, unknown>
): NextResponse => {
  const timestamp = new Date().toISOString();
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    timestamp,
    meta: meta ? { ...meta, timestamp } : { timestamp }
  };
  
  return NextResponse.json(response);
};

/**
 * ページネーション付き成功レスポンスの生成
 */
export const createPaginatedResponse = <T>(
  data: T[],
  pagination: PaginationInfo,
  meta?: Record<string, unknown>
): NextResponse => {
  const response: PaginatedApiResponse<T> = {
    success: true,
    data,
    pagination,
    timestamp: new Date().toISOString(),
    meta: {
      total: pagination.totalItems,
      ...meta
    }
  };
  
  return NextResponse.json(response);
};

/**
 * バリデーションエラーの生成
 */
export const createValidationError = (
  message: string, 
  field?: string
): NextResponse => {
  return NextResponse.json(
    {
      error: message,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed.',
      field
    } as ApiErrorResponse,
    { status: 400 }
  );
};

/**
 * 認証エラーの生成
 */
export const createAuthError = (message: string = '認証が必要です'): NextResponse => {
  return NextResponse.json(
    {
      error: message,
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication is required.'
    } as ApiErrorResponse,
    { status: 401 }
  );
};

/**
 * 認可エラーの生成
 */
export const createAuthorizationError = (message: string = 'アクセス権限がありません'): NextResponse => {
  return NextResponse.json(
    {
      error: message,
      code: 'AUTHORIZATION_FAILED',
      message: 'Access denied.'
    } as ApiErrorResponse,
    { status: 403 }
  );
};