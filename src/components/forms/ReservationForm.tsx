'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { FormProvider } from 'react-hook-form';
import { Button, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { UserInfoSection, ProductSelectionSection, PickupDateSection } from '@/components/features';
import { useFormConfig, useReservationForm } from '@/hooks';
import { useLiff } from '@/components/line/LiffProvider';
import type { ReservationFormData, ProductSelectionData } from '@/lib/validations/reservationSchema';

interface ReservationFormProps {
  presetId: number;
  onNext: (data: ReservationFormData) => void;
  previewMode?: boolean;
}

export const ReservationForm = React.memo<ReservationFormProps>(({ presetId, onNext, previewMode = false }) => {
  // Load form configuration
  const { config, loading: configLoading, error: configError } = useFormConfig(presetId);
  
  // Initialize form
  const { methods, selectedProducts } = useReservationForm({
    formSettings: config?.form_settings,
    defaultValues: {
      products: [],
      pickup_dates: {},
    },
  });
  
  // LIFF information (プレビューモード時はモック)
  const { profile } = useLiff();
  const effectiveProfile = previewMode ? {
    userId: 'preview-user',
    displayName: 'プレビューユーザー',
    pictureUrl: undefined,
    statusMessage: undefined,
  } : profile;
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle form submission
  const onSubmit = methods.handleSubmit(async (data: ReservationFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Just proceed to confirmation - don't submit yet
      onNext(data);
      
    } catch (error) {
      console.error('Form validation error:', error);
      setSubmitError(error instanceof Error ? error.message : '入力データの検証に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  });
  
  const loading = configLoading;
  const error = configError || submitError;

  // State to track client-side hydration
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoize config data to prevent unnecessary re-renders
  const { form_settings, products, pickup_windows } = useMemo(() => {
    if (!isClient || !config) {
      return { form_settings: null, products: [], pickup_windows: [] };
    }
    
    const result = {
      form_settings: config.form_settings || null,
      products: config.products || [],
      pickup_windows: config.pickup_windows || [],
    };
    
    return result;
  }, [config, isClient]);
  
  // Memoize form title
  const formTitle = useMemo(() => {
    return config?.preset.preset_name ? `${config.preset.preset_name}予約フォーム` : '予約フォーム';
  }, [config?.preset.preset_name]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" message="フォームを読み込み中..." />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              フォームが見つかりません
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              プリセット{presetId}は存在しないか、設定が不完全です。
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                再読み込み
              </button>
              
              <a
                href="/admin/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm text-center"
              >
                管理画面を開く
              </a>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <p>管理者の方:</p>
              <p>1. プリセットの存在確認</p>
              <p>2. 商品とフォーム設定の確認</p>
              <p>3. ピックアップウィンドウの設定確認</p>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 text-left">
                <p className="font-medium">エラー詳細:</p>
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {formTitle}
          </h1>

          <FormProvider {...methods}>
            <form onSubmit={onSubmit} className="space-y-8">
              {/* User Information Section */}
              {form_settings && (
                <UserInfoSection 
                  formSettings={form_settings}
                />
              )}

              {/* Product Selection Section */}
              {form_settings && (
                <ProductSelectionSection
                  products={products}
                  pickupWindows={pickup_windows}
                  formSettings={form_settings}
                />
              )}

              {/* Pickup Date Section */}
              <PickupDateSection
                pickupWindows={pickup_windows}
                selectedProducts={selectedProducts}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? '処理中...' : '次へ進む'}
              </Button>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
});

ReservationForm.displayName = 'ReservationForm';