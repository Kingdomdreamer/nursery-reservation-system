'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { LiffGuard, useLiff } from '@/components/line/LiffProvider';
import type { ReservationFormData } from '@/lib/validations/reservationSchema';
import type { FormConfigResponse } from '@/types';
import { getCategoryName } from '@/lib/utils';
import { safeRender } from '@/lib/utils/errorUtils';

interface ConfirmPageProps {
  params: Promise<{
    presetId: string;
  }>;
}

export default function ConfirmPage({ params }: ConfirmPageProps) {
  const router = useRouter();
  const { profile } = useLiff();
  const [presetId, setPresetId] = useState<number | null>(null);
  
  useEffect(() => {
    params.then(({ presetId: paramPresetId }) => {
      setPresetId(parseInt(paramPresetId, 10));
    });
  }, [params]);

  const [formData, setFormData] = useState<ReservationFormData | null>(null);
  const [config, setConfig] = useState<FormConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  useEffect(() => {
    if (presetId === null) return;
    const loadData = async () => {
      try {
        // Load form data from sessionStorage
        const storedData = sessionStorage.getItem('reservationFormData');
        if (!storedData) {
          router.push(`/form/${presetId}`);
          return;
        }

        const parsedData = JSON.parse(storedData) as ReservationFormData;
        setFormData(parsedData);

        // Load configuration via API
        const response = await fetch(`/api/presets/${presetId}/config`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'フォーム設定の読み込みに失敗しました');
        }
        
        const result = await response.json();
        if (!result.success || !result.data) {
          throw new Error('フォーム設定の読み込みに失敗しました');
        }
        
        const formConfig = result.data;
        setConfig(formConfig);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [presetId, router]);

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

  const handleSubmit = async () => {
    if (!formData || !profile || !agreedToTerms) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preset_id: presetId,
          user_name: formData.user_name,
          furigana: formData.furigana,
          gender: formData.gender,
          birthday: formData.birthday,
          phone_number: formData.phone_number,
          zip_code: formData.zip_code,
          address1: formData.address1,
          address2: formData.address2,
          comment: formData.note,
          selected_products: formData.products.map(product => ({
            product_id: product.product_id,
            product_name: product.product_name,
            variation_name: product.variation_name,
            quantity: product.quantity,
            unit_price: product.unit_price,
            total_price: product.total_price,
            tax_type: product.tax_type,
          })),
          pickup_date: Object.keys(formData.pickup_dates)[0],
          total_amount: formData.products.reduce((sum, product) => sum + product.total_price, 0),
          line_user_id: profile.userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '予約の作成に失敗しました');
      }

      // Clear stored form data
      sessionStorage.removeItem('reservationFormData');

      // Redirect to completion page
      router.push(`/complete/${presetId}?reservationId=${result.data.reservation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予約の作成に失敗しました');
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatDateDisplay = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, 'M月d日(E)', { locale: ja });
    } catch {
      return dateString;
    }
  };


  const getTotalAmount = (): number => {
    if (!formData) return 0;
    return formData.products.reduce((sum, product) => sum + product.total_price, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">確認画面を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !formData || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{safeRender(error, 'エラーが発生しました')}</p>
          <button
            onClick={() => router.push(`/form/${presetId}`)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            フォームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <LiffGuard>
      <div className="min-h-screen bg-gray-50 py-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              予約内容確認
            </h1>

            <div className="space-y-6">
              {/* Customer Information */}
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

              {/* Selected Products */}
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
                        {config.form_settings.show_price && (
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
                
                {config.form_settings.show_price && (
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

              {/* Pickup Dates */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  引き取り日
                </h2>
                <div className="space-y-2">
                  {Object.entries(formData.pickup_dates).map(([category, date]) => (
                    <div key={category} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {getCategoryName(category)}
                      </span>
                      <span className="font-medium">
                        {formatDateDisplay(date)} 10:00〜18:00
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
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

              {/* Terms and Privacy Policy */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  利用規約・プライバシーポリシー
                </h2>
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                  <p className="mb-2">【利用規約】</p>
                  <p className="mb-2">1. お客様は予約時にご入力いただいた情報に責任を持つものとします。</p>
                  <p className="mb-2">2. 予約のキャンセルは引き取り日の前日までにご連絡ください。</p>
                  <p className="mb-2">3. 商品の引き取りは指定の日時・場所でお願いします。</p>
                  <p className="mb-2">【プライバシーポリシー】</p>
                  <p className="mb-2">お客様の個人情報は予約管理・商品提供の目的でのみ使用し、適切に管理いたします。</p>
                </div>
                
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span>利用規約・プライバシーポリシーに同意します</span>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{safeRender(error, 'エラーが発生しました')}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={submitting}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  戻る
                </button>
                
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !agreedToTerms}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? '予約中...' : '同意して予約を確定する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LiffGuard>
  );
}