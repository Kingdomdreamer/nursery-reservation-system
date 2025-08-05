# テストスクリプト

## 自動テストスイート

### 概要

`test-suite.js` はベジライス予約システムの自動テストを実行するスクリプトです。

### 実行方法

```bash
# Node.js依存関係のインストール (初回のみ)
npm install @supabase/supabase-js dotenv

# テストスイートの実行
node scripts/test-suite.js
```

### テスト内容

1. **環境変数確認テスト**
   - 必要な環境変数の設定確認
   - URL・ID形式の妥当性チェック

2. **データベース接続テスト**
   - Supabase接続確認
   - 必要テーブルの存在確認

3. **フォーム設定テスト**
   - プリセット（1,2,3）の存在確認
   - フォーム設定の有効性確認

4. **商品データ整合性テスト**
   - 商品データの妥当性チェック
   - プリセット-商品関連付けの確認

5. **商品フィルタリングテスト**
   - プリセット別商品フィルタリング
   - 表示順序の確認

6. **LINE API設定テスト**
   - LINE関連環境変数の確認
   - 設定値の形式チェック

### 出力例

```
=== 環境変数確認テスト ===
✅ NEXT_PUBLIC_SUPABASE_URL が設定されています
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されています
✅ NEXT_PUBLIC_LIFF_ID が設定されています
...

=== テスト結果サマリー ===
📊 テスト実行結果:
   合計テスト数: 25
✅    成功: 23
❌    失敗: 2
   成功率: 92%

🎉 テストの大部分が成功しました! システムは正常に動作しているようです。
```

### トラブルシューティング

- **権限エラー**: `chmod +x scripts/test-suite.js` で実行権限を付与
- **依存関係エラー**: `npm install` で必要なパッケージをインストール
- **環境変数エラー**: `.env.local` ファイルの設定を確認

### 継続的インテグレーション

```bash
# package.jsonにスクリプトを追加
"scripts": {
  "test:system": "node scripts/test-suite.js",
  "test:ci": "npm run build && npm run test:system"
}

# 実行
npm run test:system
```