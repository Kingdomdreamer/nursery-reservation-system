# 種苗店予約システム 仕様書

## 1. システム概要

### 1.1 目的
種苗店（園芸用品店）における商品予約システムを提供し、顧客の事前予約と管理者の効率的な予約管理を実現する。

### 1.2 システム構成
- **フロントエンド**: Next.js 14 (App Router)
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **デプロイメント**: Vercel
- **スタイリング**: Tailwind CSS + Bootstrap

### 1.3 対象ユーザー
- **一般顧客**: 商品の閲覧と予約を行うユーザー
- **管理者**: 予約管理、商品管理、フォーム管理を行うユーザー

## 2. 機能仕様

### 2.1 顧客向け機能

#### 2.1.1 商品閲覧機能
- **概要**: 利用可能な商品の一覧表示
- **機能詳細**:
  - 商品名、価格、説明の表示
  - カテゴリ別フィルタリング
  - 検索機能
  - 商品詳細ページ
- **実装状況**: ✅ 完了

#### 2.1.2 予約機能
- **概要**: 選択した商品の予約申し込み
- **機能詳細**:
  - 商品選択と数量指定
  - 顧客情報入力（氏名、電話番号、メールアドレス）
  - 受取希望日時の指定
  - 予約内容の確認
  - 予約番号の発行
- **実装状況**: ✅ 完了

#### 2.1.3 フォーム機能
- **概要**: 動的なフォーム作成・回答システム
- **機能詳細**:
  - 管理者が作成したフォームへの回答
  - 各種フィールドタイプ対応（テキスト、メール、電話番号、日付、選択肢等）
  - フォームの有効期限管理
  - 回答データの保存
- **実装状況**: ✅ 完了

### 2.2 管理者向け機能

#### 2.2.1 ダッシュボード
- **概要**: システムの全体的な状況を把握するための管理画面
- **機能詳細**:
  - 予約統計（総予約数、今日の予約数、保留中予約数）
  - 売上統計（今月の売上）
  - 人気商品ランキング
  - 最近のアクティビティ表示
  - 今日のタスク管理
  - フォーム設定確認機能
- **実装状況**: ✅ 完了

#### 2.2.2 予約管理機能
- **概要**: 顧客からの予約の確認・更新・管理
- **機能詳細**:
  - 予約一覧表示（デスクトップ・モバイル対応）
  - 予約ステータス管理（保留中→確定→準備完了→完了→キャンセル）
  - 予約詳細情報の表示
  - 予約の検索・フィルタリング
  - 予約確定時の自動通知送信
  - 受取リマインダー送信
- **実装状況**: ✅ 完了

#### 2.2.3 商品管理機能
- **概要**: 商品情報の管理
- **機能詳細**:
  - 商品の追加・編集・削除
  - 商品の販売状態管理（販売中/停止中）
  - 商品検索機能
  - CSVインポート/エクスポート機能
  - 商品カテゴリ管理
- **実装状況**: ✅ 完了

#### 2.2.4 フォーム管理機能
- **概要**: 動的フォームの作成・管理
- **機能詳細**:
  - フォーム作成・編集・削除
  - フィールドの追加・設定
  - フォームの有効期限設定
  - 回答データの閲覧・エクスポート
  - フォーム設定の診断機能
- **実装状況**: ✅ 完了

#### 2.2.5 通知機能
- **概要**: 顧客への各種通知送信
- **機能詳細**:
  - 予約確定通知（LINE/メール）
  - 受取リマインダー通知
  - マルチチャンネル対応（LINE、メール、SMS）
  - 通知履歴の記録
  - 通知設定の管理
- **実装状況**: ✅ 完了

#### 2.2.6 顧客管理機能
- **概要**: 顧客情報の管理
- **機能詳細**:
  - 顧客一覧表示
  - 顧客詳細情報の表示
  - 顧客の予約履歴
  - 顧客情報の編集
- **実装状況**: ✅ 完了

#### 2.2.7 PDF生成機能
- **概要**: 予約情報のPDF書類生成
- **機能詳細**:
  - 個別予約の注文書PDF生成
  - 当日の予約一覧レポートPDF生成
  - HTMLテンプレートベースのスタイリング
  - ブラウザの印刷機能を利用したPDF出力
  - 予約詳細情報の完全な表示・出力
  - スタティスティクス情報を含む日報機能
- **実装状況**: ✅ 完了

## 3. データベース設計

### 3.1 主要テーブル

#### 3.1.1 customers（顧客）
```sql
- id (UUID, Primary Key)
- full_name (VARCHAR, 氏名)
- phone (VARCHAR, 電話番号)
- postal_code (VARCHAR, )
- email (VARCHAR, メールアドレス)
- line_user_id (VARCHAR, LINE ID)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3.1.2 products（商品）
```sql
- id (UUID, Primary Key)
- name (VARCHAR, 商品名)
- description (TEXT, 説明)
- price (DECIMAL, 価格)
- category_id (UUID, カテゴリID)
- is_available (BOOLEAN, 販売状態)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3.1.3 reservations（予約）
```sql
- id (UUID, Primary Key)
- reservation_number (VARCHAR, 予約番号)
- customer_id (UUID, 顧客ID)
- reservation_date (DATE, 受取日)
- pickup_time_start (TIME, 受取時間開始)
- pickup_time_end (TIME, 受取時間終了)
- status (ENUM, ステータス: pending/confirmed/ready/completed/cancelled)
- payment_status (ENUM, 支払状態: unpaid/paid/partial/refunded)
- total_amount (DECIMAL, 合計金額)
- discount_amount (DECIMAL, 割引金額)
- final_amount (DECIMAL, 最終金額)
- notes (TEXT, 備考)
- admin_notes (TEXT, 管理メモ)
- confirmation_sent_at (TIMESTAMP, 確認送信日時)
- reminder_sent_at (TIMESTAMP, リマインダー送信日時)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3.1.4 reservation_items（予約商品）
```sql
- id (UUID, Primary Key)
- reservation_id (UUID, 予約ID)
- product_id (UUID, 商品ID)
- quantity (INTEGER, 数量)
- unit_price (DECIMAL, 単価)
- subtotal (DECIMAL, 小計)
- pickup_date (DATE, 受取日)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3.1.5 form_configurations（フォーム設定）
```sql
- id (UUID, Primary Key)
- name (VARCHAR, フォーム名)
- description (TEXT, 説明)
- form_fields (JSONB, フィールド定義)
- settings (JSONB, 設定)
- is_active (BOOLEAN, 有効状態)
- valid_from (TIMESTAMP, 有効開始日時)
- valid_to (TIMESTAMP, 有効終了日時)
- version (INTEGER, バージョン)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 3.2 リレーション
- customers 1:N reservations
- reservations 1:N reservation_items
- products 1:N reservation_items
- product_categories 1:N products

## 4. API仕様

### 4.1 認証
- Supabase Authを使用
- 管理者認証は必須
- 顧客は匿名での予約も可能

### 4.2 主要エンドポイント

#### 4.2.1 予約関連
- `GET /api/reservations` - 予約一覧取得
- `POST /api/reservations` - 予約作成
- `PUT /api/reservations/:id` - 予約更新
- `DELETE /api/reservations/:id` - 予約削除

#### 4.2.2 商品関連
- `GET /api/products` - 商品一覧取得
- `POST /api/products` - 商品作成
- `PUT /api/products/:id` - 商品更新
- `DELETE /api/products/:id` - 商品削除

#### 4.2.3 通知関連
- `POST /api/notifications/confirmation` - 確認通知送信
- `POST /api/notifications/reminder` - リマインダー送信

### 4.2.4 PDF関連
- `PDFService.generateReservationPDF(reservationId)` - 個別予約PDF生成
- `PDFService.generateDailyReportPDF(date)` - 日報PDF生成
- `PDFService.printHTML(html)` - HTMLをPDF印刷出力

## 5. セキュリティ

### 5.1 認証・認可
- Supabase RLS（Row Level Security）を使用
- 管理者機能は認証必須
- APIエンドポイントの権限チェック

### 5.2 データ保護
- 個人情報の暗号化
- SQLインジェクション対策
- XSS対策

## 6. パフォーマンス

### 6.1 データベース最適化
- 適切なインデックス設定
- クエリの最適化
- ページネーション実装

### 6.2 フロントエンド最適化
- 遅延読み込み
- キャッシュ活用
- レスポンシブデザイン

## 7. 運用・保守

### 7.1 監視
- エラーログの記録
- パフォーマンス監視
- 利用状況の追跡

### 7.2 バックアップ
- データベースの定期バックアップ
- 設定ファイルのバックアップ
- 復旧手順の文書化

## 8. 今後の拡張予定

### 8.1 中優先度機能（段階的実装）
- **LINE LIFF API連携**: LINE内でのネイティブ体験
- **多管理者対応**: 役割ベースアクセス制御
- **PWA対応**: オフライン機能と通知
- **高度なPDF機能**: バーコード生成、ロゴ追加、カスタムテンプレート

### 8.2 低優先度機能（将来実装）
- **決済機能**: オンライン決済システム
- **高度な分析**: 売上分析・顧客分析
- **自動化**: 定期予約・自動リマインダー

## 9. 技術的制約・注意事項

### 9.1 実装除外機能
- **在庫管理**: 今回のシステムでは実装対象外
- **複雑な決済処理**: 現金決済のみ対応
- **多言語対応**: 日本語のみ対応
- **売上分析**: 種苗店予約システムのスコープ外

### 9.2 環境要件
- Node.js 18以上
- Next.js 14以上
- Supabase プロジェクト
- Vercel デプロイメント環境

## 10. 開発・テスト

### 10.1 開発環境
- ローカル開発環境でのテスト
- Supabase開発環境との連携
- TypeScriptによる型安全性

### 10.2 品質保証
- コードレビュー
- 単体テスト
- 統合テスト
- ユーザビリティテスト

## 11. PDF機能仕様書

### 11.1 個別予約注文書PDF
- **概要**: 個別の予約情報を詳細な注文書としてPDF出力
- **含まれる情報**:
  - 予約基本情報（予約番号、ステータス、受取日時）
  - 顧客情報（氏名、電話番号、メールアドレス）
  - 注文商品一覧（商品名、数量、単価、小計）
  - 金額情報（小計、割引、合計）
  - 備考・管理メモ
- **フォーマット**: A4サイズ、日本語対応、プリンタフレンドリー

### 11.2 日報予約レポートPDF
- **概要**: 指定日の予約一覧と統計情報を含む日報レポート
- **含まれる情報**:
  - 予約概要（総予約数、総金額）
  - ステータス別統計
  - 時間スロット別統計
  - 詳細予約一覧テーブル
  - ステータスバッジ、色分け表示
- **フォーマット**: A4サイズ、縦向き、コンパクトテーブルレイアウト

### 11.3 技術実装詳細
- **HTMLテンプレートシステム**: スタイルシートを含む完全なHTMLテンプレート
- **ブラウザ印刷機能**: `window.print()` APIを使用したPDF生成
- **レスポンシブルデザイン**: 印刷時のサイズ調整、ページブレーク対応
- **エラーハンドリング**: データ取得エラー、PDF生成エラーの適切な処理

### 11.4 ユーザーインターフェース統合
- **予約一覧ページ**: 個別予約のPDFボタンを各行に配置
- **モーダルウィンドウ**: 予約詳細モーダル内にPDFボタンを統合
- **日報レポート**: ページヘッダーに当日レポートPDFボタンを設置
- **フィードバック**: トースト通知で生成状況をユーザーに通知

---

**文書バージョン**: 1.1  
**作成日**: 2024年  
**最終更新**: 2024年  
**ステータス**: 開発完了（PDF機能含む）