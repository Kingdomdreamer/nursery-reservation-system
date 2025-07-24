import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FormField, Input } from '@/components/ui';
import type { ReservationFormData } from '@/lib/validations/reservationSchema';
import type { FormSettings } from '@/types';

export interface UserInfoSectionProps {
  formSettings: FormSettings;
  className?: string;
}

export const UserInfoSection = React.memo<UserInfoSectionProps>(({
  formSettings,
  className,
}) => {
  const { register, control, formState: { errors } } = useFormContext<ReservationFormData>();

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
        お客様情報
      </h2>

      <div className="space-y-4">
        {/* Name */}
        <FormField
          label="お名前"
          required
          error={errors.user_name?.message}
        >
          <Input
            {...register('user_name')}
            placeholder="山田太郎"
            error={errors.user_name?.message}
          />
        </FormField>

        {/* Furigana - conditional */}
        {formSettings.enable_furigana && (
          <FormField
            label="ふりがな"
            required
            error={errors.furigana?.message}
          >
            <Input
              {...register('furigana')}
              placeholder="やまだたろう"
              error={errors.furigana?.message}
            />
          </FormField>
        )}

        {/* Phone Number */}
        <FormField
          label="電話番号"
          required
          error={errors.phone_number?.message}
          hint="ハイフンありで入力してください（例：090-1234-5678）"
        >
          <Input
            {...register('phone_number')}
            type="tel"
            placeholder="090-1234-5678"
            error={errors.phone_number?.message}
          />
        </FormField>

        {/* Address - conditional */}
        {formSettings.require_address && (
          <>
            <FormField
              label="郵便番号"
              required={formSettings.require_address}
              error={errors.zip?.message}
              hint="ハイフンありで入力してください（例：123-4567）"
            >
              <Input
                {...register('zip')}
                placeholder="123-4567"
                error={errors.zip?.message}
              />
            </FormField>

            <FormField
              label="住所"
              required={formSettings.require_address}
              error={errors.address?.message}
            >
              <Input
                {...register('address')}
                as="textarea"
                rows={2}
                placeholder="東京都渋谷区〇〇1-2-3"
                error={errors.address?.message}
              />
            </FormField>
          </>
        )}

        {/* Gender - conditional */}
        {formSettings.enable_gender && (
          <FormField
            label="性別"
            required
            error={errors.gender?.message}
          >
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
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">男性</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="female"
                      checked={field.value === 'female'}
                      onChange={() => field.onChange('female')}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">女性</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="other"
                      checked={field.value === 'other'}
                      onChange={() => field.onChange('other')}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">その他</span>
                  </label>
                </div>
              )}
            />
          </FormField>
        )}

        {/* Birthday - conditional */}
        {formSettings.enable_birthday && (
          <FormField
            label="生年月日"
            required
            error={errors.birthday?.message}
          >
            <Input
              {...register('birthday')}
              type="date"
              error={errors.birthday?.message}
            />
          </FormField>
        )}

        {/* Note */}
        <FormField
          label="備考・ご要望"
          optional
          error={errors.note?.message}
          hint="アレルギーやご要望などがございましたらご記入ください"
        >
          <Input
            {...register('note')}
            as="textarea"
            rows={3}
            placeholder="特にございません"
            error={errors.note?.message}
          />
        </FormField>
      </div>
    </div>
  );
});

UserInfoSection.displayName = 'UserInfoSection';