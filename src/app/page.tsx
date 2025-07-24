'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LiffGuard } from '@/components/line/LiffProvider';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to form with preset ID 1 by default
    router.push('/form/1');
  }, [router]);

  return (
    <LiffGuard>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">予約フォームに移動中...</p>
        </div>
      </div>
    </LiffGuard>
  );
}