/**
 * 統一エラーハンドリング - 改善指示書に基づく実装
 * 一貫性のあるエラー処理とユーザー体験の向上
 */

import { NextResponse } from 'next/server';
import { 
  PresetNotFoundError, 
  InvalidPresetIdError, 
  InvalidProductDataError,
  InvalidApiResponseError
} from '@/types/simplified';

/**
 * APIエラーの統一ハンドラー
 */
export const handleApiError = (error: unknown): NextResponse => {
  console.error('API Error:', error);

  // カスタムエラーの処理
  if (error instanceof PresetNotFoundError) {
    return NextResponse.json(
      { 
        error: 'プリセットが見つかりません', 
        code: 'PRESET_NOT_FOUND',
        message: 'The requested preset does not exist.'
      },
      { status: 404 }
    );
  }

  if (error instanceof InvalidPresetIdError) {
    return NextResponse.json(
      { 
        error: '無効なプリセットIDです', 
        code: 'INVALID_PRESET_ID',
        message: 'The provided preset ID is invalid.'
      },
      { status: 400 }
    );
  }

  if (error instanceof InvalidProductDataError) {
    return NextResponse.json(
      { 
        error: '商品データが無効です', 
        code: 'INVALID_PRODUCT_DATA',
        message: 'The product data format is invalid.'
      },
      { status: 400 }
    );
  }

  if (error instanceof InvalidApiResponseError) {
    return NextResponse.json(
      { 
        error: 'APIレスポンスが無効です', 
        code: 'INVALID_API_RESPONSE',
        message: 'The API response format is invalid.'
      },
      { status: 500 }
    );
  }

  // データベースエラーの処理
  if (isSupabaseError(error)) {
    return NextResponse.json(
      { 
        error: 'データベースエラーが発生しました', 
        code: 'DATABASE_ERROR',
        message: 'A database error occurred.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }

  // ネットワークエラーの処理
  if (isNetworkError(error)) {
    return NextResponse.json(
      { 
        error: 'ネットワークエラーが発生しました', 
        code: 'NETWORK_ERROR',
        message: 'A network error occurred.'
      },
      { status: 503 }
    );
  }

  // その他のエラー
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json(
    { 
      error: '内部サーバーエラーが発生しました', 
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred.',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    },
    { status: 500 }
  );
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
 * 成功レスポンスの標準化
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    [key: string]: unknown;
  };
}

/**
 * 成功レスポンスの生成
 */
export const createSuccessResponse = <T>(
  data: T, 
  meta?: Record<string, unknown>
): NextResponse => {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  } as ApiSuccessResponse<T>);
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