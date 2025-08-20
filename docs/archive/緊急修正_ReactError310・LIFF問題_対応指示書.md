# 緊急修正指示書 - React Error #310・LIFF問題対応

## エラー概要

### 1. React Error #310
**エラー:** `Minified React error #310`
**原因:** useMemoフックでの依存配列の問題
**影響:** 商品選択コンポーネントがクラッシュ

### 2. LIFF認証問題
**エラー:** `Need access_token for api call, Please login first`
**原因:** LINEアプリ外からのアクセス時の認証処理
**影響:** プロフィール取得失敗

### 3. 商品データ問題
**問題:** `Products array is empty`
**原因:** APIから商品データが正しく取得できていない
**影響:** 商品選択ができない

## 緊急修正内容

### 1. React Error #310の修正

#### 1.1 useMemoの依存配列修正
**対象ファイル:** 商品選択関連コンポーネント

```typescript
// 修正前（エラーの原因）
const processedProducts = useMemo(() => {
  // 処理内容
}, [products]); // productsがundefinedの場合にエラー

// 修正後
const processedProducts = useMemo(() => {
  if (!products || !Array.isArray(products)) {
    return [];
  }
  // 処理内容
}, [products]);
```

#### 1.2 安全なデータ処理
```typescript
// 商品データの安全な処理
const safeProducts = useMemo(() => {
  try {
    if (!products || !Array.isArray(products)) {
      console.warn('[ProductSelection] Products is not an array:', products);
      return [];
    }
    
    return products.filter(product => 
      product && 
      typeof product === 'object' && 
      product.id && 
      product.name
    );
  } catch (error) {
    console.error('[ProductSelection] Error processing products:', error);
    return [];
  }
}, [products]);
```

### 2. LIFF認証問題の修正

#### 2.1 LiffProviderの改善
**ファイル:** `src/components/line/LiffProvider.tsx`

```typescript
// プロフィール取得の改善
try {
  if (liff.isLoggedIn()) {
    const userProfile = await liff.getProfile();
    const liffProfile: LiffProfile = {
      userId: userProfile.userId,
      displayName: userProfile.displayName,
      pictureUrl: userProfile.pictureUrl,
      statusMessage: userProfile.statusMessage,
    };
    setProfile(liffProfile);
    console.log('Profile loaded:', liffProfile.displayName);
  } else {
    console.warn('User is not logged in to LINE');
    // LINEアプリ外の場合はダミープロフィール
    if (!liff.isInClient()) {
      setProfile({
        userId: 'guest_user',
        displayName: 'ゲストユーザー',
        pictureUrl: null,
        statusMessage: null
      });
    }
  }
} catch (profileError) {
  console.warn('Profile not available:', profileError);
  // エラーでも続行可能にする
  setProfile({
    userId: 'anonymous_user',
    displayName: '匿名ユーザー',
    pictureUrl: null,
    statusMessage: null
  });
}
```

### 3. 商品データ取得の修正

#### 3.1 APIレスポンスの検証
**ファイル:** `src/hooks/useFormConfig.ts`

```typescript
const fetchFormConfig = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await fetch(`/api/presets/${presetId}/config`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('[useFormConfig] API result:', result);
    
    // データ構造の検証
    if (!result.success || !result.data) {
      throw new Error('Invalid API response structure');
    }
    
    const { data } = result;
    
    // 商品データの検証と修正
    const validatedProducts = Array.isArray(data.products) 
      ? data.products.filter(product => 
          product && 
          typeof product === 'object' && 
          product.id && 
          product.name
        )
      : [];
    
    console.log('[useFormConfig] Validated products:', validatedProducts.length);
    
    setFormConfig({
      ...data,
      products: validatedProducts
    });
    
  } catch (err) {
    console.error('[useFormConfig] Error:', err);
    setError(err instanceof Error ? err.message : 'Unknown error');
    
    // フォールバック設定
    setFormConfig({
      form_settings: {
        show_price: true,
        require_phone: true,
        require_furigana: false,
        allow_note: true,
        is_enabled: true
      },
      products: [],
      pickup_windows: [],
      preset: null,
      preset_products: []
    });
  } finally {
    setLoading(false);
  }
}, [presetId]);
```
## 詳
細エラー分析

### 根本原因の特定
ログから以下が判明：
1. **API正常**: `{success: true, productsCount: 0}` - APIは動作している
2. **商品データ空**: `Products array is empty` - 商品データが0件
3. **useMemoエラー**: React Error #310 - 空配列処理でのuseMemo問題

### 緊急修正手順

#### Step 1: 商品選択コンポーネントの修正
**ファイル:** `src/components/features/reservation/ProductSelectionSection.tsx`

```typescript
// 現在のuseMemoを安全な形に修正
const processedProducts = useMemo(() => {
  console.log('[ProductSelection] Processing products:', {
    type: typeof products,
    isArray: Array.isArray(products),
    length: products?.length || 0,
    data: products
  });

  // 安全なガード句
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

  // 安全な処理
  try {
    return products.filter(product => {
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
  } catch (error) {
    console.error('[ProductSelection] Error processing products:', error);
    return [];
  }
}, [products]); // 依存配列は変更しない
```

#### Step 2: 空商品データ対応UI
```typescript
// 商品が空の場合の表示
if (!processedProducts || processedProducts.length === 0) {
  return (
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
            <p>管理者にお問い合わせください。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Step 3: APIレスポンス検証強化
**ファイル:** `src/app/api/presets/[presetId]/config/route.ts`

```typescript
// レスポンス構築部分の修正
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
  // 商品データの安全な処理
  products: Array.isArray(sortedProducts) ? sortedProducts : [],
  pickup_windows: Array.isArray(pickupWindows) ? pickupWindows : [],
  preset_products: Array.isArray(activePresetProducts) ? activePresetProducts : []
};

// デバッグ情報の追加
console.log(`[Config API] Response data structure:`, {
  presetExists: !!responseData.preset,
  formSettingsExists: !!responseData.form_settings,
  productsCount: responseData.products.length,
  pickupWindowsCount: responseData.pickup_windows.length,
  presetProductsCount: responseData.preset_products.length
});
```

#### Step 4: 商品データ不足の調査
**データベース確認クエリ:**

```sql
-- プリセット6の商品関連付け確認
SELECT 
  pp.id,
  pp.preset_id,
  pp.product_id,
  pp.is_active,
  p.name as product_name,
  p.visible
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
```

#### Step 5: 緊急回避策
**一時的な商品データ生成:**

```typescript
// useFormConfig.tsでの緊急回避
if (validatedProducts.length === 0) {
  console.warn('[useFormConfig] No products found, creating fallback data');
  
  // 緊急用のダミー商品データ
  const fallbackProducts = [
    {
      id: 999,
      name: '商品データ準備中',
      price: 0,
      category_id: 1,
      visible: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  setFormConfig({
    ...data,
    products: fallbackProducts
  });
} else {
  setFormConfig({
    ...data,
    products: validatedProducts
  });
}
```

## 実装優先度

### 🚨 **即座に実装（緊急）**
1. **Step 1**: ProductSelectionSectionのuseMemo修正
2. **Step 2**: 空商品データ対応UI追加

### ⚡ **24時間以内（高優先度）**
3. **Step 3**: APIレスポンス検証強化
4. **Step 4**: データベース調査・修正

### 📋 **1週間以内（中優先度）**
5. **Step 5**: 根本的なデータ構造見直し

## 完了確認

- [ ] React Error #310が解消される
- [ ] 商品データが空でもクラッシュしない
- [ ] 適切なエラーメッセージが表示される
- [ ] プリセット6に商品データが関連付けられる