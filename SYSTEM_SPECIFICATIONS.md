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
  - LINE認証情報の自動入力
  - LINE認証情報の自動的な顧客データベース連携
  - 価格表示設定（管理者が設定可能な価格表示制御）
  - 種苗店特化のフォームテンプレート
  - 4ステップの予約フロー（商品選択→受取日時→顧客情報→確認）
  - 商品選択機能（カテゴリフィルタ、検索、数量管理）
  - 郵便番号による住所自動入力
- **実装状況**: ✅ 完了（種苗店特化機能含む）

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
  - 種苗店特化テンプレート機能（基本予約、詳細予約、栽培相談、アンケート）
  - 事前定義フィールド（栽培目的、栽培場所、栽培経験等）
  - フィールドのカテゴリ分類管理
- **実装状況**: ✅ 完了（種苗店特化機能含む）

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
  - LINE認証状態の表示・管理
  - LINE認証済み顧客のフィルタリング
  - LINE連携統計情報の表示
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

### 4.2.5 LINE認証関連
- `LineAuthService.linkLineAuthToCustomer()` - LINE認証情報と顧客データベースの連携
- `LineAuthService.findCustomerByLineId()` - LINE IDによる顧客検索
- `LineAuthService.autoLinkExistingCustomer()` - 既存顧客の自動認識・連携
- `LineAuthService.unlinkLineAuth()` - LINE認証情報の解除

### 4.2.6 フォーム関連
- `ReservationFormTemplate` - 種苗店特化の4ステップ予約フロー
- `StandardReservationForm` - 標準予約フォームラッパー
- `CustomerInfoForm` - 顧客情報入力の最適化
- `ProductSelectionForm` - 商品選択統合機能
- `FormCreation` - テンプレート機能付きフォーム作成

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
- **LINE LIFF API連携**: LINE内でのネイティブ体験 ✅ 完了（2025年7月16日）
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

## 12. 実装環境・ツール情報

### 12.1 開発環境
- **フレームワーク**: Next.js 14 (App Router)
- **ランタイム**: Node.js 18+
- **パッケージマネージャー**: npm
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS + Bootstrap 5.3.2
- **アイコン**: Bootstrap Icons + Lucide React
- **フォームライブラリ**: React Hook Form

### 12.2 データベース
- **プロバイダー**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **リアルタイム**: Supabase Realtime
- **ストレージ**: Supabase Storage
- **RLS**: Row Level Security 有効

### 12.3 デプロイメント
- **ホスティング**: Vercel
- **ドメイン**: 本番環境ではベジライス様のドメインを使用
- **SSL**: 自動設定
- **CDN**: Vercel Edge Network

### 12.4 外部サービス連携
- **LINE Developers Platform**: メッセージ送信、LIFFアプリ
- **郵便番号API**: 住所検索機能
- **通知サービス**: LINE Messaging API

### 12.5 パフォーマンスモニタリング
- **メトリクス**: Vercel Analytics
- **エラートラッキング**: ブラウザコンソールログ
- **パフォーマンス**: Lighthouseスコア監視

### 12.6 セキュリティ
- **認証**: Supabase Auth (JWT)
- **アクセス制御**: Row Level Security (RLS)
- **APIセキュリティ**: 環境変数によるシークレット管理
- **CORS**: Next.jsのデフォルト設定

### 12.7 開発ツール
- **エディター**: VS Code推奨
- **バージョン管理**: Git
- **コードフォーマッター**: Prettier
- **リンター**: ESLint
- **タイプチェッカー**: TypeScript

### 12.8 フォルダ構成
```
nursery-reservation-system/
├── app/                     # Next.js App Router
│   ├── components/         # Reactコンポーネント
│   │   ├── admin/          # 管理画面コンポーネント
│   │   ├── forms/          # フォーム関連コンポーネント
│   │   ├── line/           # LINE連携コンポーネント
│   │   └── ui/             # 共通コンポーネント
│   ├── contexts/           # React Context
│   ├── admin/              # 管理画面ページ
│   ├── form/               # フォームページ
│   └── api/                # APIルート
├── lib/                    # ユーティリティ関数
├── services/               # サービスクラス
├── types/                  # TypeScript型定義
├── utils/                  # ヘルパー関数
├── database/               # SQLスクリプト
├── docs/                   # ドキュメント
└── public/                 # 静的ファイル
```

### 12.9 環境変数
以下の環境変数が設定されています：

**Supabase関連**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**LINE関連**
- `LINE_CHANNEL_ACCESS_TOKEN`
- `NEXT_PUBLIC_LIFF_ID_DEV` (開発環境)
- `NEXT_PUBLIC_LIFF_ID_STAGING` (ステージング環境)
- `NEXT_PUBLIC_LIFF_ID_PROD` (本番環境)
- `LINE_CHANNEL_SECRET_DEV/STAGING/PROD`

**環境設定**
- `NODE_ENV` (development/staging/production)

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

**文書バージョン**: 1.2  
**作成日**: 2025年  
**最終更新**: 2025年7月16日  
**ステータス**: 開発完了（PDF機能含む）

---

### 📝 更新履歴

#### 2025年7月16日（v1.2）
- 管理画面の全体的な修正・改善を実施
- UI/UXの統一性向上
- レスポンシブデザインの調整
- エラーハンドリングの強化
- 今後の作業フロー更新プロセスを確立
- LINE LIFF API実装を完了
- LINE認証情報と顧客データベースの連携機能を実装
- フォームページでのLIFF機能活用を実装
- 種苗店特化フォームシステムの完全再構築
- 4ステップ予約フローの実装
- フォームテンプレート機能の実装
- 商品選択統合機能の実装
- フォーム作成時の価格表示設定機能を実装
- 管理画面での価格表示設定管理機能を実装
- データベースに価格表示設定フィールドを追加
- 参考サイト（form-mailer.jp）のデザインに合わせたフォーム再構築を完了
- モノクロームベースのシンプルでプロフェッショナルなデザインに統一

---

## 13. LINE連携機能詳細

### 13.1 LINE LIFF概要
- **目的**: LINE内でのシームレスな予約体験提供
- **機能**: プロフィール自動取得、LINE内ブラウザ最適化
- **対応端末**: iOS、Android、PC（LINE Web版）

### 13.2 実装機能
#### 13.2.1 認証・プロフィール連携
- **ユーザープロフィール自動取得**: 表示名、プロフィール画像
- **データベース自動連携**: LINE User IDと顧客情報の紐付け
- **シングルサインオン**: LINE認証による自動ログイン

#### 13.2.2 フォーム連携
- **自動入力**: LINEプロフィール情報からフォーム項目を自動入力
- **認証状態表示**: LINE認証済み状態の視覚的表示
- **データ同期**: 予約完了時のLINE情報保存

#### 13.2.3 UI/UX最適化
- **LINE内ブラウザ対応**: フルスクリーンモード
- **タッチ操作最適化**: モバイルフレンドリーUI
- **ローディング最適化**: LIFF初期化待ち時間の最小化

### 13.3 価格表示制御システム

#### 13.3.1 表示モード
- **詳細表示（full）**: すべての価格情報表示
- **合計のみ（summary）**: 合計金額のみ表示
- **非表示（hidden）**: 価格情報を完全非表示
- **カスタム（custom）**: 個別項目ごとに表示制御

#### 13.3.2 管理機能
- **管理画面設定**: フォームごとの価格表示設定
- **リアルタイムプレビュー**: 設定変更の即座反映
- **データベース連携**: form_display_settingsテーブルで管理

#### 13.3.3 実装詳細
- **PricingDisplayHelper**: 価格表示判定ロジック
- **条件分岐**: shouldShowItemPrices(), shouldShowTotal()等
- **レスポンシブ対応**: 各表示モードでの適切なレイアウト

### 13.4 環境設定・デプロイ

#### 13.4.1 LIFF ID管理
- **環境別設定**: 
  - `NEXT_PUBLIC_LIFF_ID_DEV`: 開発環境用
  - `NEXT_PUBLIC_LIFF_ID_STAGING`: ステージング環境用  
  - `NEXT_PUBLIC_LIFF_ID_PROD`: 本番環境用（ベジライス）
- **自動切り替え**: VERCEL_ENVに基づく環境判定
- **設定ファイル**: `.env.example`テンプレート提供

#### 13.4.2 本番環境移行
- **移行ガイド**: `docs/LINE_LIFF_SETUP_GUIDE.md`
- **チェックリスト**: 必要な設定手順を文書化
- **セキュリティ**: ドメイン検証、アクセス制御設定

### 13.5 セキュリティ・監視
- **LIFF ID検証**: 正規のLIFF IDからのアクセスのみ許可
- **CORS設定**: 許可されたドメインからのアクセス制限
- **データ暗号化**: プロフィール情報の安全な送信・保存
- **ログ監視**: エラー追跡、使用状況分析
- **プライバシー保護**: 必要最小限の情報のみ取得・保存