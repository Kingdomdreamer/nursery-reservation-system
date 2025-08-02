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
        {formSettings.require_furigana && (
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

        {/* Phone Number - conditional */}
        {formSettings.require_phone && (
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
        )}

        {/* Note - conditional */}
        {formSettings.allow_note && (
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
        )}
      </div>
    </div>
  );
});

UserInfoSection.displayName = 'UserInfoSection';