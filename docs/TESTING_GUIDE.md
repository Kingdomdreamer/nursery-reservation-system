# ベジライス予約システム テスト手順書

## 📋 目次

1. [テスト環境の準備](#テスト環境の準備)
2. [機能テスト](#機能テスト)
3. [LINE Mini App テスト](#line-mini-app-テスト)
4. [管理画面テスト](#管理画面テスト)
5. [データベーステスト](#データベーステスト)
6. [パフォーマンステスト](#パフォーマンステスト)
7. [トラブルシューティング](#トラブルシューティング)

---

## テスト環境の準備

### 1. 必要な環境

- **ローカル開発環境**
  - Node.js 18+
  - npm または yarn
  - ブラウザ（Chrome、Safari、Firefox）
  
- **LINE Developer環境**
  - LINE Developersアカウント
  - LIFF アプリ設定
  - Messaging API設定

- **Supabase環境**
  - Supabaseプロジェクト
  - データベース設定完了

### 2. 環境変数の確認

`.env.local`ファイルの設定を確認：

```bash
# システム設定
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
NODE_ENV=development

# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LINEミニアプリ設定
NEXT_PUBLIC_LIFF_ID=your-liff-id
NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID=your-channel-id
LINE_MINIAPP_CHANNEL_SECRET=your-channel-secret

# LINE Messaging API設定
LINE_MESSAGING_CHANNEL_ID=your-messaging-channel-id
LINE_MESSAGING_CHANNEL_SECRET=your-messaging-channel-secret
LINE_MESSAGING_ACCESS_TOKEN=your-messaging-access-token
```

### 3. 開発サーバーの起動

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルドテスト
npm run build
```

---

## 機能テスト

### 1. フォーム選択画面のテスト

**テスト対象URL**: `http://localhost:3000/`

#### テストケース

| 項目 | 手順 | 期待結果 |
|------|------|----------|
| 画面表示 | トップページにアクセス | フォーム選択画面が表示される |
| プリセット表示 | 各プリセットボタンを確認 | 野菜セット、果物セット、お米セットが表示 |
| フォーム遷移 | 「野菜セット」をクリック | `/form/1` に遷移する |
| パラメータ遷移 | `/?preset=2` にアクセス | 直接 `/form/2` に遷移する |
| 無効ID | `/?preset=999` にアクセス | フォーム選択画面が表示される |

### 2. 予約フォームのテスト

**テスト対象URL**: `http://localhost:3000/form/1`

#### 2.1 商品選択テスト

| 項目 | 手順 | 期待結果 |
|------|------|----------|
| 商品表示 | フォームを開く | プリセットに関連付けられた商品のみ表示 |
| 商品選択 | 商品の数量を変更 | 数量が正しく変更される |
| 合計計算 | 複数商品を選択 | 合計金額が正しく計算される |
| 商品フィルタ | 他のプリセット（/form/2）を確認 | 異なる商品セットが表示される |

#### 2.2 ユーザー情報入力テスト

| 項目 | 手順 | 期待結果 |
|------|------|----------|
| 必須項目 | 氏名を空で送信 | エラーメッセージ表示 |
| 電話番号 | 無効な番号を入力 | バリデーションエラー |
| ふりがな | ひらがな以外を入力 | エラーメッセージ表示 |
| 住所入力 | プリセット1で住所を確認 | 住所フィールドが表示される |

#### 2.3 フォーム送信テスト

| 項目 | 手順 | 期待結果 |
|------|------|----------|
| 正常送信 | 必要項目を入力して送信 | 確認画面に遷移 |
| 商品未選択 | 商品を選択せず送信 | エラーメッセージ表示 |
| ネットワークエラー | オフラインで送信 | エラーハンドリング表示 |

### 3. 確認画面のテスト

**テスト対象URL**: `http://localhost:3000/confirm/1?data=...`

| 項目 | 手順 | 期待結果 |
|------|------|----------|
| データ表示 | 確認画面を開く | フォームデータが正しく表示 |
| 修正機能 | 「修正する」ボタンをクリック | フォーム画面に戻る |
| 送信完了 | 「送信する」ボタンをクリック | 完了画面に遷移 |

### 4. 完了画面のテスト

**テスト対象URL**: `http://localhost:3000/complete/1`

| 項目 | 手順 | 期待結果 |
|------|------|----------|
| 完了表示 | 完了画面を開く | 送信完了メッセージが表示 |
| 新規予約 | 「新しい予約をする」をクリック | トップページに戻る |

---

## LINE Mini App テスト

### 1. LIFF環境でのテスト

**重要**: LIFF環境でのテストはLINE公式アカウントが必要です。

#### 1.1 テスト準備

```bash
# LIFF URLでアクセス
https://miniapp.line.me/[YOUR_LIFF_ID]?preset=1
```

#### 1.2 テストケース

| 項目 | 手順 | 期待結果 |
|------|------|----------|
| LIFF初期化 | LINE内でアプリを開く | LIFF SDKが正常に初期化される |
| プロフィール取得 | フォームを開く | LINEユーザー情報が取得される |
| 予約送信 | フォームを送信 | 予約データがSupabaseに保存される |
| LINE通知 | 予約完了後を確認 | LINEに予約確認メッセージが届く |

### 2. LINE通知テスト

#### 2.1 予約確認メッセージのテスト

| 項目 | 確認内容 | 期待結果 |
|------|----------|----------|
| メッセージ形式 | Flexメッセージの表示 | 適切なレイアウトで表示 |
| 予約情報 | 氏名、商品、数量、金額 | 正しい情報が表示される |
| 日時表示 | 予約日時の表示 | 正しい日本時間で表示 |
| 問い合わせ先 | 連絡先情報 | 正しい問い合わせ先が表示 |

### 3. リッチメニューテスト

| 項目 | 手順 | 期待結果 |
|------|------|----------|
| メニュー表示 | LINE公式アカウントを開く | リッチメニューが表示される |
| 野菜セット | 野菜セットボタンをタップ | `/form/1`が開く |
| 果物セット | 果物セットボタンをタップ | `/form/2`が開く |
| お米セット | お米セットボタンをタップ | `/form/3`が開く |
| 予約確認 | 予約確認ボタンをタップ | 予約確認ページが開く |

---

## 管理画面テスト

### 1. 認証テスト

**テスト対象URL**: `http://localhost:3000/admin`

| 項目 | 手順 | 期待結果 |
|------|------|----------|
| 未認証アクセス | 直接管理画面にアクセス | ログイン画面が表示される |
| 認証成功 | 正しい認証情報でログイン | ダッシュボードが表示される |
| 認証失敗 | 間違った認証情報 | エラーメッセージ表示 |

### 2. ダッシュボードテスト

**テスト対象URL**: `http://localhost:3000/admin`

| 項目 | 手順 | 期待結果 |
|------|------|----------|
| 統計表示 | ダッシュボードを開く | 予約数、売上等の統計が表示 |
| リアルタイム更新 | 新しい予約を作成 | 統計が自動更新される |
| グラフ表示 | グラフエリアを確認 | 期間別データがグラフで表示 |

### 3. 予約管理テスト

**テスト対象URL**: `http://localhost:3000/admin/reservations`

| 項目 | 手順 | 期待結果 |
|------|------|----------|
| 予約一覧 | 予約管理画面を開く | 予約一覧が表示される |
| 検索機能 | 氏名で検索 | 該当する予約が表示される |
| 日付フィルタ | 期間を指定してフィルタ | 期間内の予約のみ表示 |
| 予約詳細 | 予約をクリック | 詳細情報が表示される |
| ステータス更新 | ステータスを変更 | データベースに反映される |

### 4. 商品管理テスト

**テスト対象URL**: `http://localhost:3000/admin/settings`

| 項目 | 手順 | 期待結果 |
|------|------|----------|
| 商品一覧 | 商品管理を開く | 商品一覧が表示される |
| 商品追加 | 新しい商品を追加 | 商品が正常に作成される |
| 商品編集 | 既存商品を編集 | 変更が正常に保存される |
| 商品削除 | 商品を削除 | 商品が正常に削除される |
| CSVインポート | CSVファイルをインポート | 商品データが一括登録される |

### 5. プリセット管理テスト

| 項目 | 手順 | 期待結果 |
|------|------|----------|
| プリセット一覧 | プリセット管理を開く | プリセット一覧が表示される |
| 商品関連付け | プリセットに商品を関連付け | 関連付けが正常に保存される |
| 表示順変更 | 商品の表示順を変更 | 変更がフォームに反映される |
| プリセット削除 | プリセットを削除 | 関連データも適切に処理される |

---

## データベーステスト

### 1. Supabase接続テスト

```javascript
// テスト用スクリプト例
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('product_presets')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    console.log('✅ Supabase接続成功');
  } catch (error) {
    console.error('❌ Supabase接続失敗:', error.message);
  }
}

testConnection();
```

### 2. データ整合性テスト

| 項目 | 確認内容 | テスト方法 |
|------|----------|------------|
| 外部キー制約 | プリセットと商品の関連付け | 無効なプリセットIDでの商品作成 |
| RLS ポリシー | データアクセス権限 | 異なるユーザーでのデータアクセス |
| データ型検証 | 入力データの妥当性 | 不正な型のデータ挿入 |
| 一意制約 | 重複データの防止 | 同じデータの重複挿入 |

### 3. パフォーマンステスト

```sql
-- インデックス効果の確認
EXPLAIN ANALYZE SELECT * FROM reservations WHERE user_id = 'test-user-id';

-- 大量データでのクエリ性能
EXPLAIN ANALYZE SELECT COUNT(*) FROM products WHERE visible = true;

-- JOIN クエリの性能
EXPLAIN ANALYZE 
SELECT p.name, pp.display_order 
FROM products p 
JOIN preset_products pp ON p.id = pp.product_id 
WHERE pp.preset_id = 1;
```

---

## パフォーマンステスト

### 1. ページ読み込み速度

| ページ | 目標時間 | 測定方法 |
|--------|----------|----------|
| トップページ | < 2秒 | Chrome DevTools Performance |
| フォームページ | < 3秒 | Lighthouse |
| 管理画面 | < 4秒 | PageSpeed Insights |

### 2. JavaScript バンドルサイズ

```bash
# バンドルサイズの確認
npm run build

# 期待値
# First Load JS: < 120kB
# 各ページ: < 50kB (shared除く)
```

### 3. Lighthouse テスト

| 項目 | 目標スコア | 確認項目 |
|------|------------|----------|
| Performance | > 90 | LCP, FID, CLS |
| Accessibility | > 95 | ARIA, コントラスト |
| Best Practices | > 95 | HTTPS, セキュリティ |
| SEO | > 90 | メタタグ, 構造化データ |

---

## トラブルシューティング

### 1. よくある問題と対処法

#### LINE Mini App が開かない

**症状**: LIFF URLにアクセスしても白い画面が表示される

**確認項目**:
- LIFF IDが正しく設定されているか
- エンドポイントURLがHTTPSか
- LINE Developersでドメインが登録されているか

**解決方法**:
```bash
# 環境変数を確認
echo $NEXT_PUBLIC_LIFF_ID

# コンソールエラーを確認
# ブラウザのDevToolsでエラーログをチェック
```

#### 予約データが保存されない

**症状**: フォーム送信後、データベースにデータが保存されない

**確認項目**:
- Supabase RLS ポリシーが正しく設定されているか
- 必須フィールドが全て入力されているか
- ネットワークエラーが発生していないか

**解決方法**:
```sql
-- RLS ポリシーの確認
SELECT * FROM pg_policies WHERE tablename = 'reservations';

-- データベース接続の確認
SELECT NOW();
```

#### LINE通知が送信されない

**症状**: 予約完了後、LINEに通知が届かない

**確認項目**:
- Messaging API設定が正しいか
- アクセストークンが有効か
- ユーザーが友だち追加しているか

**解決方法**:
```bash
# LINE API設定の確認
curl -X POST https://api.line.me/v2/bot/message/push \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
-d '{
  "to": "USER_ID",
  "messages": [{"type": "text", "text": "テストメッセージ"}]
}'
```

### 2. ログの確認方法

#### アプリケーションログ

```bash
# 開発環境
npm run dev
# コンソールでエラーログを確認

# 本番環境 (Vercel)
# Vercel ダッシュボードの Functions タブでログを確認
```

#### データベースログ

```bash
# Supabase ダッシュボード
# プロジェクト > Settings > Database > Logs
```

#### LINE APIログ

```bash
# LINE Developers コンソール
# チャネル > Messaging API設定 > リクエスト履歴
```

### 3. 緊急時の対応

#### サービス停止時

1. 現在の状況を確認
2. エラー箇所を特定
3. 緊急パッチの適用
4. ユーザーへの通知

#### データ障害時

1. バックアップからの復旧
2. データ整合性の確認
3. 影響範囲の調査
4. 再発防止策の実施

---

## テスト実行チェックリスト

### 📋 事前準備

- [ ] 環境変数が正しく設定されている
- [ ] データベースが正常に動作している
- [ ] LINE Developer設定が完了している
- [ ] 必要なブラウザが準備されている

### 📋 機能テスト

- [ ] フォーム選択画面の動作確認
- [ ] 全プリセットのフォーム動作確認
- [ ] 商品選択・計算機能の確認
- [ ] ユーザー情報入力・バリデーション確認
- [ ] 確認画面・完了画面の確認

### 📋 LINE Mini App テスト

- [ ] LIFF環境での動作確認
- [ ] LINEプロフィール連携の確認
- [ ] LINE通知の送信確認
- [ ] リッチメニューの動作確認

### 📋 管理画面テスト

- [ ] 認証機能の確認
- [ ] ダッシュボードの表示確認
- [ ] 予約管理機能の確認
- [ ] 商品・プリセット管理の確認

### 📋 パフォーマンステスト

- [ ] ページ読み込み速度の測定
- [ ] Lighthouseスコアの確認
- [ ] バンドルサイズの確認
- [ ] データベースクエリ性能の確認

---

## 📞 サポート情報

### 開発チーム連絡先

- **技術的な問題**: [tech-support@example.com]
- **LINE API関連**: [line-support@example.com]
- **データベース関連**: [db-support@example.com]

### 外部サービス

- **Supabase サポート**: https://supabase.com/support
- **LINE Developers**: https://developers.line.biz/ja/support/
- **Vercel サポート**: https://vercel.com/support

---

**最終更新**: 2025年8月1日  
**バージョン**: 1.0.0