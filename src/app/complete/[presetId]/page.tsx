'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { LiffGuard, useLiff } from '@/components/line/LiffProvider';

interface CompletePageProps {
  params: Promise<{
    presetId: string;
  }>;
}

export default function CompletePage({ params }: CompletePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { liff, profile } = useLiff();
  const [presetId, setPresetId] = useState<number | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [messageSent, setMessageSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  
  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setPresetId(parseInt(resolvedParams.presetId, 10));
      setReservationId(searchParams.get('reservationId'));
    };
    
    initializeParams();
  }, [params, searchParams]);
  
  const closeLiff = () => {
    if (liff) {
      try {
        liff.closeWindow();
      } catch (error) {
        console.error('Failed to close LIFF window:', error);
        // Fallback: redirect to LINE if closeWindow fails
        window.location.href = 'https://line.me/';
      }
    }
  };

  // 予約完了メッセージ送信
  useEffect(() => {
    const sendCompletionMessage = async () => {
      if (!liff || !reservationId || messageSent) return;

      try {
        // 予約詳細を取得
        const response = await fetch(`/api/reservations/${reservationId}`);
        if (!response.ok) throw new Error('予約情報の取得に失敗しました');
        
        const { data: reservation } = await response.json();

        // LIFFメッセージ送信
        const message = `【予約完了】

${profile?.displayName || 'お客様'}、ご予約ありがとうございます！

■ご予約内容
${reservation.product.map((product: string) => `・${product}`).join('\n')}

■合計金額
¥${reservation.total_amount.toLocaleString()}

引き取り日時等の詳細は、改めてご連絡いたします。`;

        await liff.sendMessages([{
          type: 'text',
          text: message
        }]);

        setMessageSent(true);

      } catch (err) {
        console.error('メッセージ送信エラー:', err);
        setError('メッセージの送信に失敗しました');
      }
    };

    sendCompletionMessage();
  }, [liff, reservationId, messageSent, profile]);

  useEffect(() => {
    if (presetId === null) return;
    
    // Start countdown to close the LIFF app
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          closeLiff();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [presetId, closeLiff]);

  if (presetId === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const handleBackToLine = () => {
    closeLiff();
  };

  const handleViewReservation = () => {
    if (reservationId) {
      router.push(`/reservation/${reservationId}`);
    }
  };

  return (
    <LiffGuard>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-10 h-10 text-green-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              予約完了！
            </h1>
            <p className="text-gray-600">
              ご予約ありがとうございます
            </p>
          </div>

          {/* Reservation Details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">予約完了のお知らせ</h2>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• 予約確認の詳細はLINEメッセージで送信されます</p>
              <p>• 引き取り日の前日にリマインダーをお送りします</p>
              <p>• 予約内容の変更はお電話でお願いします</p>
              {reservationId && (
                <p className="text-xs text-gray-500 mt-2">
                  予約ID: {reservationId.slice(0, 8)}...
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">お問い合わせ</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>📞 電話: 03-1234-5678</p>
              <p>📧 メール: info@vejiraisu.com</p>
              <p>🕐 営業時間: 10:00-18:00</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {reservationId && (
              <button
                onClick={handleViewReservation}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                予約内容を確認する
              </button>
            )}
            
            <button
              onClick={handleBackToLine}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              LINEに戻る
            </button>
          </div>

          {/* Auto Close Notice */}
          <div className="mt-6 text-xs text-gray-500">
            <p>このページは {countdown} 秒後に自動的に閉じます</p>
          </div>

          {/* Thank You Message */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-2xl mb-2">🥬🍎🌾</div>
            <p className="text-sm text-gray-600">
              新鮮な商品をお楽しみに！<br />
              引き取り日にお待ちしております。
            </p>
          </div>
        </div>
      </div>
    </LiffGuard>
  );
}