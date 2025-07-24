'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLiff } from '@/components/line/LiffProvider';
import { DatabaseService } from '@/lib/services/DatabaseService';
import { createConditionalSchema, type ReservationFormData } from '@/lib/validations/reservationSchema';
import type { FormConfigResponse, FormSettings, Product } from '@/types';
import { ProductSelection } from './ProductSelection';
import { PickupDateCalendar } from './PickupDateCalendar';

interface ReservationFormProps {
  presetId: number;
  onNext: (data: ReservationFormData) => void;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({ presetId, onNext }) => {
  const { profile } = useLiff();
  const [config, setConfig] = useState<FormConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load form configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const formConfig = await DatabaseService.getFormConfig(presetId);
        if (!formConfig) {
          throw new Error('フォーム設定の読み込みに失敗しました');
        }
        setConfig(formConfig);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [presetId]);

  // Create form validation schema based on settings
  const validationSchema = config 
    ? createConditionalSchema(config.form_settings)
    : createConditionalSchema({
        require_address: false,
        enable_furigana: false,
        enable_gender: false,
        enable_birthday: false,
      });

  const methods = useForm<ReservationFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      user_name: profile?.displayName || '',
      products: [],
      pickup_dates: {},
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmit = async (data: ReservationFormData) => {
    try {
      onNext(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">フォームを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  const { form_settings, products } = config;

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {config.preset.preset_name}予約フォーム
          </h1>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* User Information Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                お客様情報
              </h2>

              {/* Name */}
              <div>
                <label htmlFor="user_name" className="block text-sm font-medium text-gray-700 mb-1">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  id="user_name"
                  type="text"
                  {...register('user_name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="山田太郎"
                />
                {errors.user_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.user_name.message}</p>
                )}
              </div>

              {/* Furigana - conditional */}
              {form_settings.enable_furigana && (
                <div>
                  <label htmlFor="furigana" className="block text-sm font-medium text-gray-700 mb-1">
                    ふりがな {form_settings.enable_furigana && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id="furigana"
                    type="text"
                    {...register('furigana')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="やまだたろう"
                  />
                  {errors.furigana && (
                    <p className="mt-1 text-sm text-red-600">{errors.furigana.message}</p>
                  )}
                </div>
              )}

              {/* Phone Number */}
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone_number"
                  type="tel"
                  {...register('phone_number')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="090-1234-5678"
                />
                {errors.phone_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
                )}
              </div>

              {/* Address - conditional */}
              {(form_settings.require_address || form_settings.require_address) && (
                <>
                  <div>
                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                      郵便番号 {form_settings.require_address && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      id="zip"
                      type="text"
                      {...register('zip')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="123-4567"
                    />
                    {errors.zip && (
                      <p className="mt-1 text-sm text-red-600">{errors.zip.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      住所 {form_settings.require_address && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      id="address"
                      {...register('address')}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="東京都渋谷区〇〇1-2-3"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                    )}
                  </div>
                </>
              )}

              {/* Gender - conditional */}
              {form_settings.enable_gender && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    性別 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="male"
                            checked={field.value === 'male'}
                            onChange={() => field.onChange('male')}
                            className="mr-2"
                          />
                          男性
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="female"
                            checked={field.value === 'female'}
                            onChange={() => field.onChange('female')}
                            className="mr-2"
                          />
                          女性
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="other"
                            checked={field.value === 'other'}
                            onChange={() => field.onChange('other')}
                            className="mr-2"
                          />
                          その他
                        </label>
                      </div>
                    )}
                  />
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>
              )}

              {/* Birthday - conditional */}
              {form_settings.enable_birthday && (
                <div>
                  <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">
                    生年月日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="birthday"
                    type="date"
                    {...register('birthday')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {errors.birthday && (
                    <p className="mt-1 text-sm text-red-600">{errors.birthday.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Note */}
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                備考・ご要望
              </label>
              <textarea
                id="note"
                {...register('note')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="アレルギーやご要望などがございましたらご記入ください"
              />
              {errors.note && (
                <p className="mt-1 text-sm text-red-600">{errors.note.message}</p>
              )}
            </div>

            {/* Product Selection */}
            <ProductSelection
              products={products}
              pickupWindows={config.pickup_windows}
              formSettings={form_settings}
            />

            {/* Pickup Date Calendar */}
            <PickupDateCalendar
              products={products}
              pickupWindows={config.pickup_windows}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? '処理中...' : '次へ進む'}
            </button>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};