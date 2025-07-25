import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { createConditionalSchema, type ReservationFormData } from '@/lib/validations/reservationSchema';
import { useLiff } from '@/components/line/LiffProvider';
import type { FormSettings } from '@/types';

export interface UseReservationFormOptions {
  formSettings?: FormSettings;
  defaultValues?: Partial<ReservationFormData>;
}

export interface UseReservationFormReturn {
  methods: UseFormReturn<ReservationFormData>;
  selectedProducts: any[];
}

export const useReservationForm = (
  options: UseReservationFormOptions = {}
): UseReservationFormReturn => {
  const { formSettings, defaultValues } = options;
  const { profile } = useLiff();

  // Create validation schema based on form settings
  const validationSchema = useMemo(() => {
    if (!formSettings) {
      return createConditionalSchema({
        require_address: false,
        enable_furigana: false,
        enable_gender: false,
        enable_birthday: false,
      });
    }
    
    return createConditionalSchema(formSettings);
  }, [formSettings]);

  // Form methods
  const methods = useForm<ReservationFormData>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange',
    defaultValues: {
      user_name: profile?.displayName || '',
      products: [],
      pickup_dates: {},
      ...defaultValues,
    },
  });

  // Get selected products from form state
  const selectedProducts = methods.watch('products') || [];

  return {
    methods,
    selectedProducts,
  };
};