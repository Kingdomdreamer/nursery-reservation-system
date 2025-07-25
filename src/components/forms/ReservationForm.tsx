'use client';

import React, { useMemo } from 'react';
import { FormProvider } from 'react-hook-form';
import { Button, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { UserInfoSection, ProductSelectionSection, PickupDateSection } from '@/components/features';
import { useFormConfig, useReservationForm, useReservationSubmit } from '@/hooks';
import type { ReservationFormData } from '@/lib';

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
  
  // Handle form submission
  const { submitReservation, loading: isSubmitting, error: submitError } = useReservationSubmit({
    onSuccess: (reservation) => {
      // Convert reservation to ReservationFormData for the onNext callback
      const formData: ReservationFormData = {
        user_name: reservation.user_name,
        phone_number: reservation.phone_number,
        products: [],
        pickup_dates: reservation.pickup_date ? { [reservation.pickup_date]: '' } : {},
        note: reservation.note || '',
      };
      onNext(formData);
    },
  });

  const onSubmit = methods.handleSubmit(async (data: ReservationFormData) => {
    await submitReservation(data, presetId);
  });
  
  const loading = configLoading;
  const error = configError || submitError;

  // Memoize config data to prevent unnecessary re-renders
  const { form_settings, products, pickup_windows } = useMemo(() => {
    if (!config) return { form_settings: null, products: [], pickup_windows: [] };
    return {
      form_settings: config.form_settings,
      products: config.products,
      pickup_windows: config.pickup_windows,
    };
  }, [config]);
  
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