# 🗄️ データベース構築ガイド

## 📋 概要

保育園・種苗店予約システムのSupabaseデータベースを完全構築するためのSQLスクリプトです。

## 🚀 実行手順

### 1. Supabaseプロジェクトにアクセス

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. 対象プロジェクトを選択
3. 左メニューの「SQL Editor」をクリック

### 2. SQLスクリプト実行

1. 「New Query」ボタンをクリック
2. `complete_setup.sql` の内容を全てコピー&ペースト
3. 「Run」ボタンをクリックして実行

### 3. 実行確認

正常に完了すると以下が表示されます：
```
✅ テーブル作成完了: 16テーブル
✅ インデックス作成完了: 25+インデックス
✅ 制約設定完了: 50+制約
```

### 4. 日本語検索の設定（オプション）

基本構築完了後、日本語全文検索を有効にする場合：

1. `japanese_search_setup.sql` の内容をコピー&ペースト
2. 「Run」ボタンをクリック
3. 利用可能な検索方式が自動判定・設定されます

**注意**: PostgreSQLの日本語設定が利用できない場合は、`simple`設定またはtrigram検索を使用

## 📊 構築されるテーブル一覧

### 基本テーブル (4テーブル)
- `customers` - 顧客
- `products` - 商品  
- `product_categories` - 商品カテゴリ
- `user_profiles` - ユーザープロファイル

### 予約関連 (2テーブル)
- `reservations` - 予約
- `reservation_items` - 予約商品

### フォーム関連 (6テーブル)
- `forms` - フォーム
- `form_configurations` - フォーム設定
- `form_fields` - フォームフィールド
- `form_products` - フォーム商品関連
- `form_display_settings` - フォーム表示設定
- `pricing_display_settings` - 価格表示設定

### システム管理 (4テーブル)
- `notifications` - 通知
- `system_settings` - システム設定
- `line_templates` - LINEテンプレート
- `export_history` - エクスポート履歴

## 🔧 主要機能

### 1. 自動機能
- **UUID自動生成**: 全テーブルでUUIDを自動生成
- **updated_at自動更新**: データ更新時に自動でタイムスタンプ更新
- **予約番号自動生成**: `RES-YYYYMMDD-XXXX` 形式で自動生成

### 2. セキュリティ
- **Row Level Security (RLS)**: 全テーブルでRLS有効
- **管理者ポリシー**: 認証済み管理者のみアクセス可能
- **公開フォームポリシー**: 匿名ユーザーもフォーム閲覧可能

### 3. パフォーマンス最適化
- **戦略的インデックス**: 検索・結合頻度の高いカラムにインデックス
- **全文検索**: 商品名での高速検索対応
- **制約チェック**: データ整合性保証

### 4. 初期データ
- **商品カテゴリ**: 6つの基本カテゴリ（種子、苗、花の苗、ハーブ、肥料、園芸用品）
- **システム設定**: 営業時間、通知設定等の基本設定
- **LINEテンプレート**: 確定通知、リマインダー等4種類

## 🔍 便利なビュー

### reservation_details
予約の詳細情報（顧客情報・商品一覧含む）
```sql
SELECT * FROM reservation_details 
WHERE reservation_date = CURRENT_DATE;
```

### product_statistics  
商品別の売上統計
```sql
SELECT * FROM product_statistics 
ORDER BY total_revenue DESC;
```

## 🛠️ 便利な関数

### generate_reservation_number()
予約番号の自動生成
```sql
SELECT generate_reservation_number(); 
-- 結果例: RES-20250719-0001
```

### calculate_final_amount(total, discount)
最終金額の計算
```sql
SELECT calculate_final_amount(1000, 100); 
-- 結果: 900
```

## ⚠️ 注意事項

### 実行前の確認
1. **バックアップ**: 既存データがある場合は事前にバックアップ
2. **権限確認**: Supabaseプロジェクトの管理者権限が必要
3. **環境確認**: 本番環境での実行は十分注意

### 実行後の設定
1. **環境変数**: アプリケーション側の環境変数を確認
2. **RLS確認**: Row Level Securityの動作テスト
3. **初期ユーザー**: 最初の管理者ユーザーを`user_profiles`に登録

## 🔄 メンテナンス

### 定期実行推奨
```sql
-- インデックス最適化
REINDEX DATABASE postgres;

-- 統計情報更新
ANALYZE;

-- 不要なデータクリーンアップ（例：古い通知）
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '30 days' 
AND is_read = true;
```

## 📞 トラブルシューティング

### よくあるエラー

#### 1. 権限エラー
```
ERROR: permission denied for table auth.users
```
**解決**: Supabaseの管理者権限でログインしてください

#### 2. 拡張機能エラー
```
ERROR: extension "uuid-ossp" does not exist
```
**解決**: 以下を先に実行してください
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### 3. RLSエラー
```
ERROR: new row violates row-level security policy
```
**解決**: `user_profiles`テーブルに適切なユーザー情報を登録してください

### サポート
- 📖 **仕様書**: `SYSTEM_SPECIFICATIONS_UNIFIED.md` を参照
- 🐛 **バグ報告**: GitHubのIssuesに報告
- 💬 **質問**: プロジェクトメンテナーに連絡

---

**🎉 これで完全なデータベース環境が構築されます！**