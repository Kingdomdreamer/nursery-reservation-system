'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Reservation } from '@/types/database';

interface CancelPageProps {
  params: Promise<{
    reservationId: string;
  }>;
}

export default function CancelPage({ params }: CancelPageProps) {
  const router = useRouter();
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [step, setStep] = useState<'auth' | 'manage' | 'success'>('auth');
  
  // Authentication state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cancelToken, setCancelToken] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Reservation data
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Management actions state
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ reservationId: paramReservationId }) => {
      setReservationId(paramReservationId);
      
      // Check for cancel token in URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        setCancelToken(token);
        // Auto-authenticate with token
        authenticateWithToken(paramReservationId, token);
      }
    });
  }, [params]);

  const authenticateWithToken = async (reservationId: string, token: string) => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const response = await fetch(`/api/reservations/${reservationId}?token=${token}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '認証に失敗しました');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setReservation(result.data);
        setStep('manage');
      } else {
        throw new Error('予約情報の取得に失敗しました');
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '認証エラーが発生しました');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reservationId || !phoneNumber.trim()) {
      setAuthError('電話番号を入力してください');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const response = await fetch(`/api/reservations/${reservationId}?phone=${encodeURIComponent(phoneNumber)}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '認証に失敗しました');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setReservation(result.data);
        setStep('manage');
      } else {
        throw new Error('予約情報の取得に失敗しました');
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '認証エラーが発生しました');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservationId || !reservation) return;

    if (!confirm('予約をキャンセルしてもよろしいですか？この操作は取り消せません。')) {
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      const authParam = cancelToken 
        ? `token=${encodeURIComponent(cancelToken)}`
        : `phone=${encodeURIComponent(phoneNumber)}`;

      const response = await fetch(`/api/reservations/${reservationId}?${authParam}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'キャンセル処理に失敗しました');
      }

      const result = await response.json();
      if (result.success) {
        setStep('success');
      } else {
        throw new Error('キャンセル処理に失敗しました');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'キャンセル処理でエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `¥${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, 'yyyy年M月d日(E) HH:mm', { locale: ja });
    } catch {
      return dateString;
    }
  };

  if (reservationId === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // Authentication Step
  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">予約確認</h1>
            <p className="text-gray-600">
              予約内容の確認・変更には認証が必要です
            </p>
          </div>

          <form onSubmit={handlePhoneAuth} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                予約時の電話番号
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="090-1234-5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                予約時に入力された電話番号を入力してください
              </p>
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{authError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating || !phoneNumber.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isAuthenticating ? '認証中...' : '予約を確認する'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              予約IDが分からない場合はお電話でお問い合わせください<br />
              📞 03-1234-5678
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success Step
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            キャンセル完了
          </h1>
          
          <p className="text-gray-600 mb-6">
            予約をキャンセルいたしました。<br />
            またのご利用をお待ちしております。
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">キャンセル完了のお知らせ</h2>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• キャンセル確認のメールを送信いたします</p>
              <p>• 返金が必要な場合は別途ご連絡いたします</p>
              <p>• ご質問等ございましたらお電話ください</p>
            </div>
          </div>

          <button
            onClick={() => window.close()}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
          >
            このページを閉じる
          </button>
        </div>
      </div>
    );
  }

  // Management Step
  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">予約情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            予約詳細・キャンセル
          </h1>

          {/* Reservation Status */}
          <div className="mb-6">
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              reservation.status === 'confirmed' 
                ? 'bg-green-100 text-green-800' 
                : reservation.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {reservation.status === 'confirmed' && '予約確定'}
              {reservation.status === 'cancelled' && 'キャンセル済み'}
              {reservation.status === 'completed' && '完了'}
            </div>
          </div>

          <div className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                お客様情報
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">お名前</span>
                  <span className="font-medium">{reservation.user_name}</span>
                </div>
                
                {reservation.furigana && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ふりがな</span>
                    <span className="font-medium">{reservation.furigana}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">電話番号</span>
                  <span className="font-medium">{reservation.phone_number}</span>
                </div>

                {reservation.address1 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">住所</span>
                    <span className="font-medium">{reservation.address1}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Products */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                ご注文商品
              </h2>
              <div className="space-y-3">
                {reservation.selected_products.map((product, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {product.product_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          数量: {product.quantity}個
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {formatCurrency(product.unit_price)} × {product.quantity}
                        </p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(product.total_price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">合計金額</span>
                  <span className="text-lg font-bold text-blue-700">
                    {formatCurrency(reservation.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pickup Date */}
            {reservation.pickup_date && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  引き取り予定日
                </h2>
                <p className="text-lg font-medium text-gray-900">
                  {formatDate(reservation.pickup_date)}
                </p>
              </div>
            )}

            {/* Comment */}
            {reservation.comment && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  備考・ご要望
                </h2>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {reservation.comment}
                </p>
              </div>
            )}

            {/* Reservation Info */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                予約情報
              </h2>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">予約日時</span>
                  <span className="font-medium">{formatDate(reservation.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">予約ID</span>
                  <span className="font-mono text-xs">{reservation.id}</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {actionError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{actionError}</p>
              </div>
            )}

            {/* Action Buttons */}
            {reservation.status === 'confirmed' && (
              <div className="space-y-3">
                <button
                  onClick={handleCancelReservation}
                  disabled={isProcessing}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isProcessing ? 'キャンセル処理中...' : '予約をキャンセルする'}
                </button>
                
                <p className="text-xs text-gray-500 text-center">
                  キャンセル後の変更・復旧はできません。<br />
                  内容変更のご相談はお電話ください（📞 03-1234-5678）
                </p>
              </div>
            )}

            {reservation.status !== 'confirmed' && (
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-gray-600">
                  {reservation.status === 'cancelled' && 'この予約は既にキャンセルされています'}
                  {reservation.status === 'completed' && 'この予約は完了しています'}
                </p>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">お問い合わせ</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>📞 電話: 03-1234-5678</p>
              <p>📧 メール: info@vejiraisu.com</p>
              <p>🕐 営業時間: 10:00-18:00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}