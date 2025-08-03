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
}

export const ReservationForm = React.memo<ReservationFormProps>(({ presetId, onNext }) => {
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
  
  // LIFF information
  const { profile } = useLiff();
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle form submission
  const onSubmit = methods.handleSubmit(async (data: ReservationFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Convert pickup_dates object to single pickup_date
      const pickupDate = Object.keys(data.pickup_dates)[0];
      
      // Calculate total amount
      const totalAmount = data.products.reduce((sum, product) => sum + (product as ProductSelectionData).total_price, 0);
      
      // Prepare reservation data
      const reservationData = {
        user_name: data.user_name,
        phone: data.phone_number,
        pickup_date: pickupDate,
        products: data.products.map(product => ({
          name: (product as ProductSelectionData).product_name,
          quantity: (product as ProductSelectionData).quantity,
          price: (product as ProductSelectionData).unit_price,
        })),
        line_user_id: profile?.userId || null,
        total_amount: totalAmount,
        note: data.note || null,
      };
      
      // Submit reservation
      const response = await fetch(`/api/form/${presetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '予約の送信に失敗しました');
      }
      
      const result = await response.json();
      
      // Success - proceed to next step
      onNext(data);
      
    } catch (error) {
      console.error('Reservation submission error:', error);
      setSubmitError(error instanceof Error ? error.message : '予約の送信に失敗しました');
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
        <LoadingSpinner size="lg" label="フォームを読み込み中..." />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ErrorMessage
          title="エラーが発生しました"
          message={error || 'フォーム設定の読み込みに失敗しました'}
          action={{
            label: "再読み込み",
            onClick: () => window.location.reload()
          }}
        />
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