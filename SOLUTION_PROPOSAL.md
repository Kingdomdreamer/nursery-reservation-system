# プリセット商品設定および React エラー #418 解決提案

## 問題の概要
1. 本番環境で `/api/admin/preset-products/{presetId}` が 404 エラー
2. React Minified Error #418 の発生（JSXにオブジェクトが渡される問題）
3. 商品選択UIで「現在選択できません」表示

## 解決策

### 1. API ルート修正（最優先）

#### 問題点
- Next.js 15での動的ルート処理の不整合
- context.params の await 処理が不適切

#### 解決方法
```typescript
// src/app/api/admin/preset-products/[presetId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ presetId: string }> }
) {
  const { presetId } = await params;
  const id = Number(presetId);
  
  if (Number.isNaN(id)) {
    return NextResponse.json(
      { error: '無効なプリセットIDです' },
      { status: 400 }
    );
  }
  
  // 残りの処理...
}
```

### 2. React Error #418 対策

#### 問題点
- 商品データのレンダリング時にオブジェクトが直接JSXに渡される
- 型安全性の不備

#### 解決方法
```typescript
// 安全なレンダリング関数を追加
const safeRender = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

// 使用例
<span>{safeRender(product.name)}</span>
```

### 3. 商品選択ロジック簡素化

#### 問題点
- 複雑なフォールバック処理
- データ取得の重複

#### 解決方法
```typescript
// 統一されたプリセット商品取得API
export async function GET(request: NextRequest, { params }: { params: Promise<{ presetId: string }> }) {
  const { presetId } = await params;
  const id = Number(presetId);
  
  try {
    // 1. プリセット商品の直接取得
    const { data: presetProducts, error: presetError } = await supabaseAdmin
      .from('preset_products')
      .select(`
        product_id,
        display_order,
        is_active,
        product:products(*)
      `)
      .eq('preset_id', id)
      .eq('is_active', true)
      .order('display_order');

    if (presetError) throw presetError;

    // 2. 商品データの整形
    const products = presetProducts
      ?.filter(pp => pp.product && pp.product.visible)
      .map(pp => ({
        ...pp.product,
        display_order: pp.display_order
      }))
      .sort((a, b) => a.display_order - b.display_order) || [];

    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4. フロントエンド修正

#### ProductSelectionSection の改善
```typescript
// エラーハンドリングの強化
const ProductSelectionSection = ({ products, ...props }) => {
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 型安全性の確保
  const safeProducts = useMemo(() => {
    if (!Array.isArray(products)) {
      setError('商品データの形式が正しくありません');
      return [];
    }
    
    return products.filter(product => 
      product && 
      typeof product === 'object' && 
      'id' in product && 
      'name' in product
    );
  }, [products]);

  if (!isClient) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  // 残りのレンダリング処理...
};
```

### 5. デバッグ用ログ追加

```typescript
// src/hooks/useFormConfig.ts
const fetchConfig = useCallback(async () => {
  try {
    console.log(`[DEBUG] Fetching config for preset: ${presetId}`);
    
    const response = await fetch(`/api/form/${presetId}`);
    console.log(`[DEBUG] API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DEBUG] API error response:`, errorText);
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`[DEBUG] API result:`, {
      success: result.success,
      hasData: !!result.data,
      productsCount: result.data?.products?.length || 0
    });
    
    setConfig(result.data);
  } catch (err) {
    console.error(`[DEBUG] Fetch error:`, err);
    setError(err.message);
  }
}, [presetId]);
```

## 実装優先順位

1. **最優先**: API ルートの修正（404エラー解消）
2. **高優先**: React Error #418 対策（safeRender関数追加）
3. **中優先**: 商品選択ロジック簡素化
4. **低優先**: デバッグログ追加

## 検証方法

1. ローカル環境でのテスト
2. 本番環境でのAPI動作確認
3. ブラウザコンソールでのエラー監視
4. 商品選択フローの完全テスト

## 期待される効果

- 本番環境での404エラー解消
- React Error #418の完全解消
- 商品選択UIの安定動作
- デバッグ効率の向上