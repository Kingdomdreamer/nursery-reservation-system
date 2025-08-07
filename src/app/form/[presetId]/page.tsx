'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LiffGuard } from '@/components/line/LiffProvider';
import { ReservationForm } from '@/components/forms/ReservationForm';
import type { ReservationFormData } from '@/lib/validations/reservationSchema';

interface AvailablePreset {
  id: number;
  name: string;
}

interface FormPageProps {
  params: Promise<{
    presetId: string;
  }>;
}

export default function FormPage({ params }: FormPageProps) {
  const router = useRouter();
  const [presetId, setPresetId] = useState<number | null>(null);
  const [availablePresets, setAvailablePresets] = useState<AvailablePreset[]>([]);
  const [presetError, setPresetError] = useState<string | null>(null);
  
  useEffect(() => {
    params.then(({ presetId: paramPresetId }) => {
      setPresetId(parseInt(paramPresetId, 10));
    });
  }, [params]);

  // 利用可能なプリセットを取得
  useEffect(() => {
    const fetchAvailablePresets = async () => {
      try {
        const response = await fetch('/api/debug/presets');
        const data = await response.json();
        
        if (data.success && data.summary?.functional_presets) {
          setAvailablePresets(data.summary.functional_presets);
        }
      } catch (error) {
        console.error('Failed to fetch available presets:', error);
      }
    };

    fetchAvailablePresets();
  }, []);

  const [formData, setFormData] = useState<ReservationFormData | null>(null);
  
  if (presetId === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

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