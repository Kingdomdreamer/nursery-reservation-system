# 完全修正指示書 - React Error #310・商品データ問題

## 問題概要

### 🚨 **緊急エラー**
- **React Error #310**: useMemoフックでのクラッシュ
- **商品データ空**: プリセット6に商品が0件
- **無限ループ**: useMemoが繰り返し実行される

### 📊 **エラーログ分析結果**
```
API正常: {success: true, productsCount: 0}
商品データ: Products array is empty
エラー発生: Minified React error #310 (useMemo)
```

## 修正内容

### 1. ProductSelectionSection.tsx の修正

**ファイル:** `src/components/features/reservation/ProductSelectionSection.tsx`

```typescript
'use client';

import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui';
import type { Product, PickupWindow, FormSettings } from '@/types';
import type { ReservationFormData, ProductSelectionData } from '@/lib/validations/reservationSchema';
import { getCategoryName } from '@/lib/utils';

// 安全なレンダリング関数
const safeRender = (value: any, fallback: string = '') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export interface ProductSelectionSectionProps {
  products: Product[];
  pickupWindows: PickupWindow[];
  formSettings: FormSettings;
  onProductSelect: (productId: number, quantity: number) => void;
  selectedProducts: ProductSelectionData[];
}

export default function ProductSelectionSection({
  products,
  pickupWindows,
  formSettings,
  onProductSelect,
  selectedProducts
}: ProductSelectionSectionProps) {
  const { register, formState: { errors } } = useFormContext<ReservationFormData>();

  // 安全な商品データ処理
  const processedProducts = useMemo(() => {
    console.log('[ProductSelection] Processing products:', {
      type: typeof products,
      isArray: Array.isArray(products),
      length: products?.length || 0,
      data: products
    });

    // 厳密なガード句
    if (!products) {
      console.warn('[ProductSelection] Products is null/undefined');
      return [];
    }

    if (!Array.isArray(products)) {
      console.warn('[ProductSelection] Products is not an array:', typeof products);
      return [];
    }

    if (products.length === 0) {
      console.warn('[ProductSelection] Products array is empty');
      return [];
    }

    // 安全なフィルタリング
    try {
      const validProducts = products.filter(product => {
        if (!product || typeof product !== 'object') {
          console.warn('[ProductSelection] Invalid product:', product);
          return false;
        }
        
        if (!product.id || !product.name) {
          console.warn('[ProductSelection] Product missing required fields:', product);
          return false;
        }
        
        return true;
      });

      console.log(`[ProductSelection] Filtered ${validProducts.length} valid products from ${products.length} total`);
      return validProducts;
    } catch (error) {
      console.error('[ProductSelection] Error processing products:', error);
      return [];
    }
  }, [products]); // 依存配列は products のみ

  // 商品データが空の場合の表示
  if (!processedProducts || processedProducts.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">商品選択</h3>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                商品データが見つかりません
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>このプリセットには商品が関連付けられていません。</p>
                <p>管理者にお問い合わせいただくか、しばらく時間をおいて再度お試しください。</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm"
                >
                  ページを再読み込み
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 通常の商品選択UI
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">商品選択</h3>
      
      <div className="space-y-3">
        {processedProducts.map((product) => (
          <div key={product.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-base font-medium text-gray-900">
                  {safeRender(product.name)}
                </h4>
                {product.category_id && (
                  <p className="text-sm text-gray-500">
                    カテゴリ: {getCategoryName(product.category_id)}
                  </p>
                )}
                {formSettings.show_price && (
                  <p className="text-lg font-semibold text-green-600">
                    ¥{product.price?.toLocaleString() || '0'}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="99"
                  defaultValue="0"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                  onChange={(e) => {
                    const quantity = parseInt(e.target.value) || 0;
                    onProductSelect(product.id, quantity);
                  }}
                />
                <span className="text-sm text-gray-500">個</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedProducts.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">選択済み商品</h4>
          <div className="space-y-1">
            {selectedProducts.map((item, index) => (
              <div key={index} className="text-sm text-blue-800">
                {safeRender(item.product_name)} × {item.quantity}個
                {formSettings.show_price && (
                  <span className="ml-2 font-medium">
                    ¥{item.total_price?.toLocaleString() || '0'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 2. useFormConfig.ts の修正

**ファイル:** `src/hooks/useFormConfig.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { FormConfigResponse } from '@/types';

export const useFormConfig = (presetId: number) => {
  const [formConfig, setFormConfig] = useState<FormConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFormConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[useFormConfig] Fetching config for preset: ${presetId} (attempt 1)`);
      
      const response = await fetch(`/api/presets/${presetId}/config`);
      
      console.log('[useFormConfig] API response:', {
        status: response.status,
        statusText: response.statusText,
        responseTime: `${Date.now()}ms`,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[useFormConfig] API result:', {
        success: result.success,
        hasData: !!result.data,
        productsCount: result.data?.products?.length || 0,
        formSettingsExists: !!result.data?.form_settings,
        presetExists: !!result.data?.preset
      });
      
      // データ構造の厳密な検証
      if (!result.success || !result.data) {
        throw new Error('Invalid API response structure');
      }
      
      const { data } = result;
      
      // 商品データの安全な処理
      let validatedProducts = [];
      if (Array.isArray(data.products)) {
        validatedProducts = data.products.filter(product => {
          if (!product || typeof product !== 'object') {
            console.warn('[useFormConfig] Invalid product object:', product);
            return false;
          }
          
          if (!product.id || !product.name) {
            console.warn('[useFormConfig] Product missing required fields:', product);
            return false;
          }
          
          return true;
        });
      } else {
        console.warn('[useFormConfig] Products is not an array:', typeof data.products);
      }
      
      console.log(`[useFormConfig] Validated ${validatedProducts.length} products`);
      
      // 商品データが空の場合の警告
      if (validatedProducts.length === 0) {
        console.warn(`[useFormConfig] No valid products found for preset ${presetId}`);
        console.warn('[useFormConfig] This may cause display issues. Check database configuration.');
      }
      
      // 安全なフォーム設定の構築
      const safeFormSettings = {
        show_price: data.form_settings?.show_price ?? true,
        require_phone: data.form_settings?.require_phone ?? true,
        require_furigana: data.form_settings?.require_furigana ?? false,
        allow_note: data.form_settings?.allow_note ?? true,
        is_enabled: data.form_settings?.is_enabled ?? true,
        custom_message: data.form_settings?.custom_message || null,
        ...data.form_settings
      };
      
      // 最終的な設定オブジェクト
      const finalConfig: FormConfigResponse = {
        form_settings: safeFormSettings,
        products: validatedProducts,
        pickup_windows: Array.isArray(data.pickup_windows) ? data.pickup_windows : [],
        preset: data.preset || null,
        preset_products: Array.isArray(data.preset_products) ? data.preset_products : []
      };
      
      setFormConfig(finalConfig);
      
    } catch (err) {
      console.error('[useFormConfig] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // エラー時のフォールバック設定
      const fallbackConfig: FormConfigResponse = {
        form_settings: {
          show_price: true,
          require_phone: true,
          require_furigana: false,
          allow_note: true,
          is_enabled: true,
          custom_message: null
        },
        products: [], // 空配列で安全に初期化
        pickup_windows: [],
        preset: null,
        preset_products: []
      };
      
      setFormConfig(fallbackConfig);
    } finally {
      setLoading(false);
    }
  }, [presetId]);

  useEffect(() => {
    if (presetId && presetId > 0) {
      fetchFormConfig();
    }
  }, [presetId, fetchFormConfig]);

  return {
    formConfig,
    loading,
    error,
    refetch: fetchFormConfig
  };
};
```

### 3. API レスポンス修正

**ファイル:** `src/app/api/presets/[presetId]/config/route.ts`

```typescript
// レスポンス構築部分の修正（既存コードの該当箇所を置き換え）

// データの整形と検証（既存の処理の後に追加）
const activePresetProducts = (presetData.preset_products || [])
  .filter((pp: any) => {
    if (!pp || typeof pp !== 'object') return false;
    
    const product = Array.isArray(pp.product) ? pp.product[0] : pp.product;
    if (!product || typeof product !== 'object') return false;
    
    return pp.is_active && product.visible !== false && product.id;
  })
  .map((pp: any) => {
    const product = Array.isArray(pp.product) ? pp.product[0] : pp.product;
    return {
      ...pp,
      product: product
    };
  })
  .sort((a: any, b: any) => (a.display_order || 999) - (b.display_order || 999));

// 商品データの安全な抽出
const safeProducts = activePresetProducts
  .map((pp: any) => pp.product)
  .filter((product: any) => {
    if (!product || typeof product !== 'object') {
      console.warn('[Config API] Invalid product in preset_products:', product);
      return false;
    }
    
    if (!product.id || !product.name) {
      console.warn('[Config API] Product missing required fields:', product);
      return false;
    }
    
    return true;
  });

// レスポンスデータの構築
const responseData: FormConfigResponse = {
  preset: {
    id: presetData.id,
    preset_name: presetData.preset_name,
    created_at: presetData.created_at,
    updated_at: presetData.updated_at
  },
  form_settings: presetData.form_settings?.[0] || {
    id: 0,
    preset_id: id,
    show_price: true,
    require_phone: true,
    require_furigana: false,
    allow_note: true,
    is_enabled: true,
    custom_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  products: safeProducts, // 安全に処理された商品データ
  pickup_windows: Array.isArray(pickupWindows) ? pickupWindows : [],
  preset_products: activePresetProducts
};

// デバッグ情報の出力
console.log(`[Config API] Successfully fetched config for preset ${id}:`, {
  products_count: safeProducts.length,
  pickup_windows_count: (pickupWindows || []).length,
  form_settings_exists: !!(presetData.form_settings && presetData.form_settings.length > 0),
  preset_products_count: activePresetProducts.length
});

// 商品データが空の場合の警告
if (safeProducts.length === 0) {
  console.warn(`[Config API] No products found for preset ${id}. This may cause display issues.`);
  console.warn('[Config API] Check preset_products and pickup_windows tables for proper associations.');
}
```

### 4. データベース修正クエリ

**実行が必要なSQL:**

```sql
-- プリセット6の商品関連付け状況確認
SELECT 
  pp.id,
  pp.preset_id,
  pp.product_id,
  pp.is_active,
  p.name as product_name,
  p.visible,
  p.price
FROM preset_products pp
LEFT JOIN products p ON pp.product_id = p.id
WHERE pp.preset_id = 6;

-- 引き取り期間の確認
SELECT 
  pw.id,
  pw.preset_id,
  pw.product_id,
  p.name as product_name
FROM pickup_windows pw
LEFT JOIN products p ON pw.product_id = p.id
WHERE pw.preset_id = 6;

-- プリセット6に商品を関連付け（データが空の場合）
INSERT INTO preset_products (preset_id, product_id, display_order, is_active)
SELECT 6, id, ROW_NUMBER() OVER (ORDER BY name), true
FROM products 
WHERE visible = true 
LIMIT 5;

-- 引き取り期間も作成（必要に応じて）
INSERT INTO pickup_windows (preset_id, product_id, pickup_start, pickup_end, dates, comment)
SELECT 
  6,
  id,
  '2025-08-10 10:00:00+09',
  '2025-08-17 18:00:00+09',
  ARRAY['2025-08-10', '2025-08-11', '2025-08-12'],
  '引き取り可能期間'
FROM products 
WHERE visible = true 
LIMIT 5;
```

## 修正手順

### Phase 1: 緊急修正（即座に実行）
1. **ProductSelectionSection.tsx** のuseMemo修正
2. **useFormConfig.ts** の安全なデータ処理追加

### Phase 2: API修正（24時間以内）
3. **config/route.ts** のレスポンス検証強化
4. データベースクエリでプリセット6の商品関連付け確認

### Phase 3: データ修正（必要に応じて）
5. プリセット6への商品関連付け追加
6. 引き取り期間データの作成

## 完了確認チェックリスト

- [ ] React Error #310が解消される
- [ ] 商品データが空でもクラッシュしない
- [ ] 適切なエラーメッセージが表示される
- [ ] プリセット6に商品データが表示される
- [ ] 無限ループが発生しない
- [ ] コンソールエラーが解消される

## 注意事項

- 本修正は既存の動作に影響を与えないよう設計されています
- エラーハンドリングを強化し、予期しない状況でも安全に動作します
- デバッグ情報を充実させ、今後の問題特定を容易にします