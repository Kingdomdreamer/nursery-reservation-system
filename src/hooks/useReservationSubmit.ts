import { useState, useCallback } from 'react';
import { useLiff } from '@/components/line/LiffProvider';
import type { ReservationFormData } from '@/lib/validations/reservationSchema';
import type { Reservation } from '@/types';

export interface UseReservationSubmitOptions {
  onSuccess?: (reservation: Reservation) => void;
  onError?: (error: string) => void;
}

export interface UseReservationSubmitReturn {
  submitReservation: (formData: ReservationFormData, presetId: number) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useReservationSubmit = (
  options: UseReservationSubmitOptions = {}
): UseReservationSubmitReturn => {
  const { onSuccess, onError } = options;
  const { profile } = useLiff();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const submitReservation = useCallback(async (
    formData: ReservationFormData,
    presetId: number
  ) => {
    if (!profile?.userId) {
      const errorMessage = 'ユーザー情報が取得できません';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          userId: profile.userId,
          presetId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '予約の作成に失敗しました');
      }

      const reservation = result.data?.reservation;
      if (reservation) {
        onSuccess?.(reservation);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予約の作成に失敗しました';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [profile?.userId, onSuccess, onError]);

  return {
    submitReservation,
    loading,
    error,
    clearError,
  };
};