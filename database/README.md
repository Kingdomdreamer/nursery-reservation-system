# ベジライス予約システム - データベースSQLスクリプト集

## 📋 概要

このディレクトリには、ベジライス予約システムのデータベース構築・メンテナンスに必要なSQLスクリプトが整理されています。

## 🗂️ ファイル構成

### 1. `01_create_tables.sql` - テーブル作成
**用途**: データベースの基本構造を作成
**実行順序**: 1番目

**含まれるテーブル**:
- `product_presets` - プリセット管理
- `products` - 商品マスター（POS連携対応）
- `form_settings` - フォーム設定
- `preset_products` - プリセット-商品関連付け
- `pickup_windows` - 受け取り期間設定
- `reservations` - 予約データ
- `notification_logs` - 通知履歴

### 2. `02_create_indexes.sql` - インデックス作成
**用途**: クエリパフォーマンスの最適化
**実行順序**: 2番目

**含まれるインデックス**:
- パフォーマンス最適化インデックス
- 全文検索インデックス（商品・顧客名）
- 部分インデックス（条件付き）
- JSONB インデックス（通知メッセージ）

### 3. `03_create_functions_triggers.sql` - 関数・トリガー
**用途**: ビジネスロジックと自動化処理
**実行順序**: 3番目

**含まれる機能**:
- 自動 updated_at 更新
- バリデーション関数
- ビジネスロジック関数
- 統計・集計関数
- データクリーンアップ関数

### 4. `04_create_rls_policies.sql` - セキュリティポリシー
**用途**: Row Level Security（RLS）の設定
**実行順序**: 4番目

**セキュリティ機能**:
- ユーザー別データアクセス制御
- 管理者権限管理
- LIFF環境対応
- 匿名アクセス制限

### 5. `05_insert_sample_data.sql` - サンプルデータ
**用途**: 初期データとテスト用サンプルデータの投入
**実行順序**: 5番目

**含まれるデータ**:
- 3つのプリセット（野菜・果物・お米セット）
- 15商品（バリエーション含む）
- フォーム設定
- プリセット-商品関連付け
- 受け取り期間設定

### 6. `06_maintenance_queries.sql` - メンテナンス用クエリ集
**用途**: 日常的な管理・監視・トラブルシューティング
**実行タイミング**: 必要に応じて

**含まれるクエリ**:
- データ確認・統計分析
- パフォーマンス監視
- セキュリティ確認
- バックアップ・復旧支援

## 🚀 セットアップ手順

### 初回構築時

```bash
# 1. テーブル作成
psql -d your_database -f 01_create_tables.sql

# 2. インデックス作成
psql -d your_database -f 02_create_indexes.sql

# 3. 関数・トリガー作成
psql -d your_database -f 03_create_functions_triggers.sql

# 4. セキュリティポリシー設定
psql -d your_database -f 04_create_rls_policies.sql

# 5. サンプルデータ投入
psql -d your_database -f 05_insert_sample_data.sql
```

### Supabase での実行

```bash
# Supabase CLI を使用
supabase db reset
supabase db push

# または管理画面のSQL Editorで各ファイルの内容を実行
```

## 🔧 メンテナンス

### 定期実行推奨クエリ

```sql
-- 統計情報更新（週1回）
ANALYZE;

-- 古い通知ログ削除（月1回）
SELECT cleanup_old_notification_logs(30);

-- パフォーマンス確認（月1回）
-- 06_maintenance_queries.sql の「パフォーマンス確認クエリ」を実行
```

### トラブルシューティング

```sql
-- データ整合性確認
SELECT * FROM rls_policies_status;

-- 重複データ確認
-- 06_maintenance_queries.sql の「重複商品確認」クエリを実行

-- インデックス使用状況確認
-- 06_maintenance_queries.sql の「インデックス使用状況」クエリを実行
```

## 📊 データベース設計の特徴

### 1. **プリセット別商品管理**
- 各プリセット（野菜セット等）に商品を関連付け
- `preset_products` テーブルで多対多関係を管理
- 表示順序とアクティブ状態を制御

### 2. **商品バリエーション対応**
- 同一商品の価格・サイズ違いを管理
- `base_product_name` + `variation_name` で構造化
- POS システム連携フィールドを完備

### 3. **フォーム設定の柔軟性**
- プリセット別にフォーム項目を制御
- 価格表示・住所入力・ふりがな等を個別設定
- 有効期間と受け取り期間の管理

### 4. **セキュリティ重視**
- 全テーブルでRLS有効化
- ユーザー別データアクセス制御
- 管理者権限の適切な分離

### 5. **パフォーマンス最適化**
- 頻繁なクエリに対するインデックス設計
- 部分インデックスによる効率化
- 全文検索対応

## 🔍 主要テーブル関係図

```
product_presets (プリセット)
    ↓ 1:N
form_settings (フォーム設定)

product_presets 
    ↓ M:N (preset_products経由)
products (商品)

product_presets
    ↓ 1:N
pickup_windows (受け取り期間)

product_presets
    ↓ 1:N
reservations (予約)

reservations.user_id
    ↓ 1:N
notification_logs (通知履歴)
```

## ⚠️ 注意事項

### 本番環境での実行時

1. **バックアップ必須**: 本番データベースでSQLを実行する前は必ずバックアップを取得
2. **段階的実行**: 一度にすべてのスクリプトを実行せず、段階的に確認しながら実行
3. **RLS確認**: セキュリティポリシーが正しく動作することを確認
4. **インデックス作成**: 大量データがある場合、インデックス作成は時間がかかる可能性

### 開発環境での確認

```sql
-- データ投入後の確認
SELECT * FROM rls_policies_status;

-- 商品フィルタリング確認
SELECT get_preset_product_count(1); -- プリセット1の商品数
SELECT get_preset_product_count(2); -- プリセット2の商品数
SELECT get_preset_product_count(3); -- プリセット3の商品数
```

## 📞 サポート

- **SQLエラー**: `06_maintenance_queries.sql` のトラブルシューティングクエリを参照
- **パフォーマンス問題**: インデックス使用状況とスロークエリを確認
- **データ整合性**: 重複データ確認クエリを実行

---

**最終更新**: 2025年8月1日  
**対応システム**: PostgreSQL 14+ / Supabase