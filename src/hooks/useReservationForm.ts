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
  methods: UseFormReturn<any>;
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
        require_phone: false,
        require_furigana: false,
        allow_note: false,
      });
    }
    
    return createConditionalSchema(formSettings);
  }, [formSettings]);

  // Form methods
  const methods = useForm({
    resolver: zodResolver(validationSchema),
    mode: 'onChange' as const,
    defaultValues: {
      user_name: profile?.displayName || '',
      furigana: '',
      phone_number: '',
      products: [],
      pickup_dates: {},
      note: '',
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