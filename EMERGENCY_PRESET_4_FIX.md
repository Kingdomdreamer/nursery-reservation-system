# プリセット4緊急修正ガイド

## 🚨 問題の概要
本番環境でプリセット4のフォーム（`/form/4`）にアクセスすると、商品が0個で React #310 エラーが発生している。

## 🔧 緊急修正手順

### 方法1: 管理画面から修正（推奨）

1. **管理画面にアクセス**
   ```
   https://nursery-reservation-system.vercel.app/admin/settings
   ```

2. **ログイン**
   - 管理者パスワードでログイン

3. **プリセット4を編集**
   - 既存のフォーム一覧でプリセット4を見つける
   - 「編集」ボタンをクリック

4. **商品を追加**
   - 商品検索欄で商品を検索
   - 3-5個の商品を選択して追加

5. **保存**
   - 「フォームを更新」ボタンをクリック

### 方法2: 新しいフォームを作成

1. **管理画面の「新しいフォーム作成」セクション**

2. **設定**
   - プリセット名: 「テスト用フォーム」
   - 商品を3-5個選択
   - フォーム設定を適切に設定

3. **作成**
   - 「フォームを作成」ボタンをクリック
   - 新しいプリセットIDを取得

4. **新しいURLを使用**
   ```
   https://nursery-reservation-system.vercel.app/form/{新しいプリセットID}
   ```

## 🛠️ 技術的な原因

### Config APIの問題
```javascript
// src/app/api/presets/[presetId]/config/route.ts
const activePresetProducts = (presetData.preset_products || [])
  .filter((pp: any) => {
    const product = Array.isArray(pp.product) ? pp.product[0] : pp.product;
    return pp.is_active && product && product.visible; // ここで全て除外されている
  });
```

### 可能な原因
1. `preset_products` テーブルにプリセット4のエントリがない
2. `is_active` が `false` に設定されている
3. 関連する `products` が `visible: false` になっている
4. JOIN クエリが失敗している

## 🔍 デバッグ方法

### 1. データベース直接確認
```sql
-- プリセット4の存在確認
SELECT * FROM product_presets WHERE id = 4;

-- プリセット4の商品確認
SELECT pp.*, p.name, p.visible 
FROM preset_products pp 
LEFT JOIN products p ON pp.product_id = p.id 
WHERE pp.preset_id = 4;

-- フォーム設定確認
SELECT * FROM form_settings WHERE preset_id = 4;
```

### 2. API直接テスト
```bash
curl https://nursery-reservation-system.vercel.app/api/presets/4/config
```

### 3. ブラウザコンソールでのデバッグ
```javascript
// プリセット4の設定を確認
fetch('/api/presets/4/config')
  .then(r => r.json())
  .then(console.log);

// 全商品を確認
fetch('/api/admin/products/all')
  .then(r => r.json())
  .then(console.log);
```

## ✅ 修正確認

修正後、以下を確認：

1. **エラーログの消失**
   ```
   ❌ [ProductSelection] Products array is empty
   ❌ Error: Minified React error #310
   ```

2. **正常なログ出力**
   ```
   ✅ ProductSelectionSection received 3 products: [...]
   ✅ [Config API] Successfully fetched config for preset 4: { products_count: 3 }
   ```

3. **フォームの正常表示**
   - 商品選択セクションが表示される
   - 商品が選択可能
   - 予約フォームが動作する

## 🚀 緊急対応完了後

1. **ログの確認**
   - React #310 エラーの消失を確認
   - 正常な商品表示を確認

2. **テスト実行**
   - フォームでの商品選択テスト
   - 予約完了までのフルテスト

3. **監視継続**
   - しばらくエラーログを監視
   - 他のプリセットでも同様の問題がないか確認

## 📋 予防策

今後同様の問題を防ぐため：

1. **プリセット作成時の商品必須化**
2. **空商品チェックの強化**
3. **管理画面での警告表示**
4. **定期的なデータベース整合性チェック**