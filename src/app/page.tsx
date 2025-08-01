'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LiffGuard } from '@/components/line/LiffProvider';

interface PresetOption {
  id: number;
  name: string;
  description: string;
}

const AVAILABLE_PRESETS: PresetOption[] = [
  { id: 1, name: '野菜セット', description: '新鮮な季節の野菜をお届け' },
  { id: 2, name: '果物セット', description: '甘くて美味しい旬の果物' },
  { id: 3, name: 'お米セット', description: 'こだわりの美味しいお米' },
];

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // URLパラメータからプリセットIDを取得
    const presetParam = searchParams.get('preset');
    
    if (presetParam) {
      const presetId = parseInt(presetParam, 10);
      
      // 有効なプリセットIDかチェック
      const validPreset = AVAILABLE_PRESETS.find(p => p.id === presetId);
      
      if (validPreset) {
        // 指定されたプリセットのフォームにリダイレクト
        router.push(`/form/${presetId}`);
        return;
      } else {
        console.warn('Invalid preset ID:', presetId);
      }
    }
    
    // プリセットIDが指定されていない、または無効な場合はフォーム選択画面を表示
    setIsLoading(false);
  }, [searchParams, router]);

  const handlePresetSelect = (presetId: number) => {
    router.push(`/form/${presetId}`);
  };

  if (isLoading) {
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

  return (
    <LiffGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🌱 ベジライス予約システム
            </h1>
            <p className="text-gray-600">
              ご希望の商品セットを選択してください
            </p>
          </div>

          <div className="space-y-4">
            {AVAILABLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className="w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-green-300 transition-all duration-200 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {preset.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {preset.description}
                    </p>
                  </div>
                  <div className="ml-4 text-green-600">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              お困りの際はお気軽にお問い合わせください
            </p>
          </div>
        </div>
      </div>
    </LiffGuard>
  );
}