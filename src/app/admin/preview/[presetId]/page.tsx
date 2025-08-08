'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ReservationForm } from '@/components/forms/ReservationForm';
import type { ReservationFormData } from '@/lib/validations/reservationSchema';

interface PreviewPageProps {
  params: Promise<{
    presetId: string;
  }>;
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const router = useRouter();
  const [presetId, setPresetId] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<'form' | 'confirm' | 'complete'>('form');
  const [formData, setFormData] = useState<ReservationFormData | null>(null);

  useEffect(() => {
    params.then(({ presetId: paramPresetId }) => {
      setPresetId(parseInt(paramPresetId, 10));
    });
  }, [params]);

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

  const handleNext = (data: ReservationFormData) => {
    setFormData(data);
    setPreviewMode('confirm');
  };

  const handleBackToForm = () => {
    setPreviewMode('form');
  };

  const handlePreviewSubmit = () => {
    setPreviewMode('complete');
  };

  const handleBackToAdmin = () => {
    router.push('/admin/settings');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* プレビューヘッダー */}
      <div className="bg-yellow-500 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="font-semibold">プレビューモード</span>
            </div>
            <span className="text-sm opacity-90">
              プリセットID: {presetId} | 画面: {
                previewMode === 'form' ? '入力画面' : 
                previewMode === 'confirm' ? '確認画面' : 
                '完了画面'
              }
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 画面切り替えボタン */}
            <div className="flex bg-yellow-600 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('form')}
                className={`px-3 py-1 text-sm rounded ${
                  previewMode === 'form' 
                    ? 'bg-white text-yellow-600 shadow' 
                    : 'text-yellow-100 hover:text-white'
                }`}
              >
                入力
              </button>
              <button
                onClick={() => {
                  if (formData) {
                    setPreviewMode('confirm');
                  } else {
                    alert('まず入力画面でフォームデータを入力してください');
                  }
                }}
                className={`px-3 py-1 text-sm rounded ${
                  previewMode === 'confirm' 
                    ? 'bg-white text-yellow-600 shadow' 
                    : 'text-yellow-100 hover:text-white'
                }`}
              >
                確認
              </button>
              <button
                onClick={() => setPreviewMode('complete')}
                className={`px-3 py-1 text-sm rounded ${
                  previewMode === 'complete' 
                    ? 'bg-white text-yellow-600 shadow' 
                    : 'text-yellow-100 hover:text-white'
                }`}
              >
                完了
              </button>
            </div>
            
            <button
              onClick={handleBackToAdmin}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              管理画面に戻る
            </button>
          </div>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="py-4">
        {previewMode === 'form' && (
          <PreviewFormContainer 
            presetId={presetId} 
            onNext={handleNext}
          />
        )}
        
        {previewMode === 'confirm' && formData && (
          <PreviewConfirmContainer 
            presetId={presetId}
            formData={formData}
            onBack={handleBackToForm}
            onSubmit={handlePreviewSubmit}
          />
        )}
        
        {previewMode === 'complete' && (
          <PreviewCompleteContainer 
            presetId={presetId}
            onBack={handleBackToAdmin}
          />
        )}
      </div>
    </div>
  );
}

// プレビュー用フォームコンテナ
function PreviewFormContainer({ 
  presetId, 
  onNext 
}: { 
  presetId: number; 
  onNext: (data: ReservationFormData) => void; 
}) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="text-center mb-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            プレビュー: 入力画面
          </div>
        </div>
        <ReservationForm 
          presetId={presetId} 
          onNext={onNext}
          previewMode={true}
        />
      </div>
    </div>
  );
}

// プレビュー用確認画面コンテナ
function PreviewConfirmContainer({ 
  presetId, 
  formData,
  onBack,
  onSubmit
}: { 
  presetId: number;
  formData: ReservationFormData;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`/api/presets/${presetId}/config`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setConfig(result.data);
          }
        }
      } catch (error) {
        console.error('設定読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [presetId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const getTotalAmount = (): number => {
    return formData.products.reduce((sum, product) => sum + product.total_price, 0);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            プレビュー: 確認画面
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          予約内容確認
        </h1>

        <div className="space-y-6">
          {/* お客様情報 */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              お客様情報
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">お名前</span>
                <span className="font-medium">{formData.user_name}</span>
              </div>
              {formData.furigana && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ふりがな</span>
                  <span className="font-medium">{formData.furigana}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">電話番号</span>
                <span className="font-medium">{formData.phone_number}</span>
              </div>
            </div>
          </div>

          {/* ご注文商品 */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              ご注文商品
            </h2>
            <div className="space-y-3">
              {formData.products.map((product, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {product.product_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        数量: {product.quantity}個
                      </p>
                    </div>
                    {config?.form_settings?.show_price && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          ¥{product.unit_price.toLocaleString()} × {product.quantity}
                        </p>
                        <p className="font-medium text-gray-900">
                          ¥{product.total_price.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {config?.form_settings?.show_price && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">合計金額</span>
                  <span className="text-lg font-bold text-green-700">
                    ¥{getTotalAmount().toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 備考 */}
          {formData.note && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                備考・ご要望
              </h2>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {formData.note}
              </p>
            </div>
          )}

          {/* プレビュー用ボタン */}
          <div className="flex space-x-3">
            <button
              onClick={onBack}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 font-medium"
            >
              戻る
            </button>
            <button
              onClick={onSubmit}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 font-medium"
            >
              予約を確定する（プレビュー）
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// プレビュー用完了画面コンテナ
function PreviewCompleteContainer({ 
  presetId,
  onBack
}: { 
  presetId: number;
  onBack: () => void;
}) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            プレビュー: 完了画面
          </div>
        </div>

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

        {/* 予約詳細（プレビュー用） */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">予約完了のお知らせ</h2>
          <div className="text-sm text-gray-700 space-y-1">
            <p>• 予約確認の詳細はLINEメッセージで送信されます</p>
            <p>• 引き取り日の前日にリマインダーをお送りします</p>
            <p>• 予約内容の変更はお電話でお願いします</p>
            <p className="text-xs text-gray-500 mt-2">
              プリセットID: {presetId}（プレビュー）
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">お問い合わせ</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p>📞 電話: 03-1234-5678</p>
            <p>📧 メール: info@vejiraisu.com</p>
            <p>🕐 営業時間: 10:00-18:00</p>
          </div>
        </div>

        {/* プレビュー用ボタン */}
        <button
          onClick={onBack}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
        >
          管理画面に戻る
        </button>

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
  );
}