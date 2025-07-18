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

### 1.4 営業時間・予約制限
- **営業時間**: 9:00-18:00（水曜定休）
- **予約可能期間**: 翌日から2ヶ月先まで（デフォルト設定）
- **受取時間単位**: 30分単位（9:00-9:30、9:30-10:00...17:30-18:00）
- **フォーム設定**: 各フォーム作成時に予約可能期間を個別設定可能
- **時間枠制限**: 営業時間内であれば特に制限なし
- **予約重複**: 同一時間枠での複数予約受付可能
- **例外処理**: 祝日・臨時休業日の設定機能は現状なし（手動運用）

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
- **フォーム公開・アクセス**:
  - **主要チャネル**: 店舗公式LINE経由でのフォーム配信
  - **補助チャネル**: QRコード生成（チラシ・店頭掲示用）
  - **QRコード機能**: 管理画面で自動生成、印刷用PDF出力対応
  - **アクセス制御**: フォーム有効期限による自動制御
- **回答管理**:
  - **重複回答処理**: 同一ユーザーの複数回答は最新内容で上書き
  - **期限切れ処理**: 専用メッセージ画面表示（代替案表示なし）
  - **期限切れメッセージ**: シンプルな期限切れ通知のみ
  - **データ保持**: 回答データは無期限保存
- **実装状況**: ✅ 完了（種苗店特化機能含む）

### 2.2 管理者向け機能

#### 2.2.1 ダッシュボード
- **概要**: システムの全体的な状況を把握するための管理画面
- **機能詳細**:
  - 予約統計（総予約数、今日の予約数、保留中予約数）
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
  - 商品カテゴリ管理（拡張性を考慮した柔軟な分類）
- **商品カテゴリ**:
  - 種苗店特有のカテゴリに対応（種子、苗、肥料、園芸用品等）
  - 将来的な拡張性を考慮した階層構造対応
  - カテゴリごとの表示順序設定
  - 明確な分類は今後の運用に合わせて柔軟に設定
- **商品管理方針**:
  - 店舗の売り出しに合わせた商品一覧参照方式
  - 季節商品の自動制御は行わず、手動管理
- **将来拡張予定**:
  - 商品画像の表示・管理機能（中優先度）
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
- **QRコード生成機能**:
  - フォームURL用QRコード自動生成
  - 管理画面でのQRコード表示・ダウンロード
  - 印刷用PDF形式での出力対応（A4サイズ対応）
  - チラシ・店頭掲示用の高解像度画像生成（300dpi以上）
  - 基本用途：印刷物での配布・掲示
- **実装状況**: ✅ 完了（種苗店特化機能含む）

#### 2.2.5 通知機能
- **概要**: 顧客への各種通知送信
- **機能詳細**:
  - 予約確定通知（LINE/メール）
  - 受取リマインダー通知（前日・当日送信）
  - マルチチャンネル対応（LINE、メール、SMS）
  - 通知履歴の記録
  - 通知設定の管理
- **通知スケジュール**:
  - **前日リマインダー**: 受取日前日の18:00に送信
  - **当日リマインダー**: 受取日当日の9:00に送信
  - **確定通知**: 予約ステータス変更時に即座送信
- **再送処理**:
  - 送信失敗時は30分後に自動再送
  - 最大3回まで再送試行
  - 3回失敗後は管理画面に通知失敗アラート表示
- **テンプレート管理**:
  - 管理画面から通知メッセージのカスタマイズ可能
  - 予約情報の動的挿入（予約番号、商品名、受取日時等）
  - LINE/メール別のテンプレート設定
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
- **データ管理ポリシー**:
  - **保存期間**: 顧客データ・予約データは無期限保存
  - **削除機能**: 管理画面から顧客データの完全削除が可能
  - **削除範囲**: 顧客削除時は関連する予約データも連動削除（CASCADE）
  - **プライバシー対応**: 顧客からの削除要求に対する迅速な対応
  - **データエクスポート**: 削除前のデータバックアップ機能
  - **統計データ影響**: 削除後の統計データへの影響は考慮しない
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
- full_name (VARCHAR(100) NOT NULL, 氏名)
- phone (VARCHAR(15) NOT NULL, 電話番号 - ハイフンなし数字のみ)
- postal_code (VARCHAR(8), 郵便番号 - ハイフンあり形式)
- email (VARCHAR(255), メールアドレス - RFC5322準拠)
- line_user_id (VARCHAR(50), LINE User ID - LINE API仕様準拠)
- created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
```

#### 3.1.2 products（商品）
```sql
- id (UUID, Primary Key)
- name (VARCHAR(200) NOT NULL, 商品名)
- description (TEXT, 商品説明 - 最大2000文字)
- price (DECIMAL(10,2) NOT NULL, 価格 - 税込み円単位)
- category_id (UUID, カテゴリID - product_categoriesテーブル参照)
- is_available (BOOLEAN DEFAULT true, 販売状態 - true:販売中, false:販売停止)
- created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
```

#### 3.1.3 reservations（予約）
```sql
- id (UUID, Primary Key)
- reservation_number (VARCHAR(20) NOT NULL UNIQUE, 予約番号 - 形式: RES-YYYYMMDD-XXXX)
- customer_id (UUID NOT NULL, 顧客ID - customersテーブル参照)
- reservation_date (DATE NOT NULL, 受取日)
- pickup_time_start (TIME NOT NULL, 受取時間開始 - 30分単位)
- pickup_time_end (TIME NOT NULL, 受取時間終了 - 30分単位)
- status (ENUM('pending', 'confirmed', 'ready', 'completed', 'cancelled') DEFAULT 'pending', 予約ステータス)
- payment_status (ENUM('unpaid', 'paid', 'partial', 'refunded') DEFAULT 'unpaid', 支払状態)
- total_amount (DECIMAL(10,2) NOT NULL DEFAULT 0, 合計金額 - 税込み円単位)
- discount_amount (DECIMAL(10,2) DEFAULT 0, 割引金額 - 円単位)
- final_amount (DECIMAL(10,2) NOT NULL DEFAULT 0, 最終金額 - 税込み円単位)
- notes (TEXT, 顧客備考 - 最大1000文字)
- admin_notes (TEXT, 管理メモ - 最大2000文字)
- confirmation_sent_at (TIMESTAMP WITH TIME ZONE, 確認通知送信日時)
- reminder_sent_at (TIMESTAMP WITH TIME ZONE, リマインダー送信日時)
- created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
```

#### 3.1.4 reservation_items（予約商品）
```sql
- id (UUID, Primary Key)
- reservation_id (UUID NOT NULL, 予約ID - reservationsテーブル参照)
- product_id (UUID NOT NULL, 商品ID - productsテーブル参照)
- quantity (INTEGER NOT NULL CHECK (quantity > 0), 数量 - 1以上の整数)
- unit_price (DECIMAL(10,2) NOT NULL, 単価 - 予約時点の価格)
- subtotal (DECIMAL(10,2) NOT NULL, 小計 - quantity × unit_price)
- pickup_date (DATE NOT NULL, 受取日 - reservation.reservation_dateと同一)
- created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
```

#### 3.1.5 form_configurations（フォーム設定）
```sql
- id (UUID, Primary Key)
- name (VARCHAR(100) NOT NULL, フォーム名)
- description (TEXT, フォーム説明 - 最大500文字)
- form_fields (JSONB NOT NULL, フィールド定義 - JSON配列形式)
- settings (JSONB DEFAULT '{}', フォーム設定 - 価格表示設定等)
- is_active (BOOLEAN DEFAULT true, 有効状態)
- valid_from (TIMESTAMP WITH TIME ZONE, 有効開始日時)
- valid_to (TIMESTAMP WITH TIME ZONE, 有効終了日時)
- version (INTEGER DEFAULT 1, バージョン番号)
- created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
```

#### 3.1.6 product_categories（商品カテゴリ）
```sql
- id (UUID, Primary Key)
- name (VARCHAR(100) NOT NULL, カテゴリ名)
- description (TEXT, カテゴリ説明)
- parent_id (UUID, 親カテゴリID - 階層構造対応)
- sort_order (INTEGER DEFAULT 0, 表示順序)
- is_active (BOOLEAN DEFAULT true, 有効状態)
- created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
```

#### 3.1.7 notification_logs（通知履歴）
```sql
- id (UUID, Primary Key)
- reservation_id (UUID NOT NULL, 予約ID)
- notification_type (ENUM('confirmation', 'reminder_day_before', 'reminder_same_day') NOT NULL, 通知種別)
- channel (ENUM('line', 'email', 'sms') NOT NULL, 送信チャネル)
- recipient (VARCHAR(255) NOT NULL, 送信先)
- status (ENUM('pending', 'sent', 'failed', 'retry') DEFAULT 'pending', 送信状態)
- retry_count (INTEGER DEFAULT 0, 再送回数)
- sent_at (TIMESTAMP WITH TIME ZONE, 送信完了日時)
- error_message (TEXT, エラーメッセージ)
- created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
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
- **インデックス設定**:
  - reservations.reservation_date (B-tree)
  - reservations.status (B-tree)
  - customers.phone (B-tree)
  - products.category_id (B-tree)
  - reservation_items.reservation_id (B-tree)
- **クエリ最適化**:
  - 予約一覧取得: 最大実行時間200ms以内
  - 商品検索: 最大実行時間100ms以内
  - JOIN操作の最小化とサブクエリ最適化
- **ページネーション**: 1ページあたり20件、最大1000件まで取得可能

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
- **データベースバックアップ**:
  - 頻度: 毎日午前2時（JST）
  - 保存期間: 30日間
  - 保存先: Supabase自動バックアップ + AWS S3
  - 復旧テスト: 月1回実施
- **設定ファイルバックアップ**:
  - 環境変数設定ファイル
  - Vercelデプロイ設定
  - LINE API設定情報
- **復旧手順**: 最大復旧時間目標（RTO）: 4時間、復旧ポイント目標（RPO）: 24時間

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

## 10. 実装環境・ツール情報

### 10.1 開発環境
- **フレームワーク**: Next.js 14 (App Router)
- **ランタイム**: Node.js 18+
- **パッケージマネージャー**: npm
- **言語**: TypeScript
- **スタイリング**: Bootstrap 5.3.2（野菜・農業イメージの黄緑色系テーマ）
- **アイコン**: Bootstrap Icons + Lucide React
- **フォームライブラリ**: React Hook Form

### 10.2 データベース
- **プロバイダー**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **リアルタイム**: Supabase Realtime
- **ストレージ**: Supabase Storage
- **RLS**: Row Level Security 有効

### 10.3 デプロイメント
- **ホスティング**: Vercel
- **ドメイン**: 本番環境ではベジライス様のドメインを使用
- **SSL**: 自動設定
- **CDN**: Vercel Edge Network

### 10.4 外部サービス連携
- **LINE Developers Platform**: メッセージ送信、LIFFアプリ
- **郵便番号API**: 住所検索機能
- **通知サービス**: LINE Messaging API

### 10.5 UI/UXデザイン仕様（2025年7月17日更新）

#### テーマカラー
- **プライマリーカラー**: #8bc34a（明るい黄緑色）
- **セカンダリーカラー**: #7cb342（濃い黄緑色）
- **背景色**: #f1f8e9（薄い緑色）
- **アクセントカラー**: #e8f5e8（極薄い緑色）
- **テーマコンセプト**: 野菜・植物・農業をイメージした自然で親しみやすい色合い

#### レイアウト設計
- **サイドバー**: 完全固定（width: 280px, position: fixed）
- **メインコンテンツ**: 固定サイドバー分の左マージン（margin-left: 280px）
- **ヘッダー**: 緑色グラデーション（#8bc34a → #7cb342）
- **サイドバー**: 緑色グラデーション（#7cb342 → #8bc34a）
- **コンテンツエリア**: 薄い緑色グラデーション背景（#f1f8e9 → #e8f5e8）

#### システム設定機能
- **設定保存**: SettingsService.tsによる完全データベース連携
- **設定カテゴリ**: 基本設定・通知設定・営業設定・高度な設定
- **データ管理**: system_settingsテーブルでJSONB形式保存
- **リアルタイム反映**: 設定変更の即座反映機能

#### 管理画面の機能強化
- **予約編集**: ReservationEditModal.tsxによる完全編集機能
- **新規予約**: /admin/reservations/new への遷移機能
- **通知・設定**: AdminLayout.tsxのボタン機能実装
- **商品画像**: ProductAdd.tsxでの画像アップロード機能（Base64変換・5MB制限）

#### データベース拡張
- **system_settings**: システム設定保存用テーブル追加
- **JSONB形式**: 柔軟な設定データ保存
- **自動更新**: updated_atの自動更新トリガー実装

### 10.5 パフォーマンスモニタリング
- **メトリクス**: Vercel Analytics
- **エラートラッキング**: ブラウザコンソールログ
- **パフォーマンス**: Lighthouseスコア監視

### 10.6 セキュリティ
- **認証**: Supabase Auth (JWT)
- **アクセス制御**: Row Level Security (RLS)
- **APIセキュリティ**: 環境変数によるシークレット管理
- **CORS**: Next.jsのデフォルト設定

### 10.7 開発ツール
- **エディター**: VS Code推奨
- **バージョン管理**: Git
- **コードフォーマッター**: Prettier
- **リンター**: ESLint
- **タイプチェッカー**: TypeScript

### 10.8 フォルダ構成
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

### 10.9 環境変数
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

## 11. PDF機能仕様

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

## 12. 開発・テスト

### 12.1 開発環境
- ローカル開発環境でのテスト
- Supabase開発環境との連携
- TypeScriptによる型安全性

### 12.2 品質保証
- コードレビュー
- 単体テスト
- 統合テスト
- ユーザビリティテスト

---

**文書バージョン**: 1.3  
**作成日**: 2025年  
**最終更新**: 2025年7月17日  
**ステータス**: 開発完了（仕様書ブラッシュアップ完了）

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

## 13. LINE連携機能仕様

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