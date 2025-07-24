'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LiffGuard } from '@/components/line/LiffProvider';
import { ReservationForm } from '@/components/forms/ReservationForm';
import type { ReservationFormData } from '@/lib/validations/reservationSchema';

interface FormPageProps {
  params: {
    presetId: string;
  };
}

export default function FormPage({ params }: FormPageProps) {
  const router = useRouter();
  const presetId = parseInt(params.presetId, 10);

  const [formData, setFormData] = useState<ReservationFormData | null>(null);

  const handleNext = (data: ReservationFormData) => {
    setFormData(data);
    // For now, just store in sessionStorage and redirect to confirmation
    // In the next steps, we'll add product selection
    sessionStorage.setItem('reservationFormData', JSON.stringify(data));
    router.push(`/confirm/${presetId}`);
  };

  // Validate preset ID
  if (isNaN(presetId) || presetId < 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">無効なフォームIDです</h2>
          <p className="text-gray-600 mb-4">正しいURLからアクセスしてください</p>
          <button
            onClick={() => window.history.back()}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <LiffGuard>
      <ReservationForm 
        presetId={presetId} 
        onNext={handleNext}
      />
    </LiffGuard>
  );
}