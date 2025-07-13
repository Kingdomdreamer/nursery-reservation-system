# 片桐商店 ベジライス - 予約管理システム

肥料や農薬、苗を販売する片桐商店 ベジライス様専用の商品予約システムです。

## 概要

このシステムは片桐商店 ベジライス向けの商品予約システムで、以下の機能を提供します：

- **商品予約**: 肥料、農薬、苗などの種苗店商品の予約
- **複数商品対応**: 一度の予約で複数の商品を選択可能
- **引き取り日指定**: 商品ごとに個別の引き取り日を設定
- **合計金額計算**: 選択した商品の合計金額を自動計算
- **個人情報入力**: 予約者の連絡先情報の管理
- **管理画面**: 商品・予約・フォーム管理機能
- **LINE通知**: LINEテンプレート編集・通知機能

## 技術スタック

- **フロントエンド**: Next.js 14 (React 18)
- **データベース**: Supabase (PostgreSQL)
- **スタイリング**: Tailwind CSS
- **認証**: Supabase Auth
- **言語**: TypeScript

## 主要コンポーネント

### 予約フォーム関連
- `ReservationForm`: メイン予約フォーム
- `ProductSelectionForm`: 商品選択・数量・引き取り日入力
- `PersonalInfoForm`: 個人情報入力フォーム
- `ConfirmationScreen`: 予約内容確認画面
- `CompletionScreen`: 予約完了画面

### 管理画面
- `AdminDashboard`: 統計ダッシュボード
- `ProductList`: 商品一覧・管理
- `ProductAdd`: 商品追加・CSV一括登録
- `ReservationListAdmin`: 予約一覧・管理
- `FormBuilder`: フォーム作成・編集
- `FormList`: フォーム一覧・管理
- `LineTemplateEditor`: LINE通知テンプレート編集

## 予約フォームについて

### 入力項目（管理画面でフォーム作成時にフォームごとに表示非表示の設定が可能）
- **氏名** (必須)
- **フリガナ**
- **電話番号** (必須)
- **郵便番号**
- **住所**
- **生年月日**
- **性別**
- **受取希望日** (必須)
- **ご要望・備考**
- **小計・合計**


### フォーム機能
- **項目のトグル制御**: 各項目の表示/非表示を管理画面で設定
- **有効期限設定**: フォームの受付開始・終了日時を設定
- **QRコード生成**: フォームURLのQRコード自動生成
- **商品選択**: Supabaseから商品を検索・選択して予約対象に設定
- **リアルタイムプレビュー**: 設定変更の即座反映

## 管理機能

### 商品管理
- **商品一覧**: カテゴリ別表示、在庫管理、検索機能
- **商品追加**: 単一商品追加、CSV一括登録
- **価格バリエーション**: 商品ごとの価格設定対応
- **在庫管理**: 在庫数量、最小/最大注文数設定

### 予約管理
- **予約一覧**: ステータス別管理、詳細表示、編集機能
- **ステータス管理**: 保留中→確定→準備完了→完了→キャンセル
- **通知機能**: LINE通知の送信・管理

### フォーム管理
- **フォーム作成**: ドラッグ&ドロップでの項目設定
- **フォーム一覧**: 有効/無効状態、有効期限管理
- **QRコード**: フォームアクセス用QRコード生成

### LINE通知管理
- **テンプレート編集**: 4種類の通知テンプレート
  - 予約確定通知
  - 予約リマインダー
  - 支払い確認通知
  - キャンセル通知
- **変数機能**: 顧客名、予約番号、商品一覧等の動的挿入
- **プレビュー機能**: 実際の表示内容を確認

## データベース設計

### 主要テーブル
- `product_categories`: 商品カテゴリ
- `products`: 商品情報
- `customers`: 顧客情報
- `reservations`: 予約情報
- `reservation_items`: 予約商品詳細
- `form_configurations`: フォーム設定
- `line_templates`: LINE通知テンプレート
- `notification_histories`: 通知履歴

## 開発・実行

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 本番環境での起動
npm start

# リント
npm run lint
```

## 環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## ディレクトリ構造

```
app/
├── admin/              # 管理画面
│   └── page.tsx
├── components/         # Reactコンポーネント
│   ├── admin/          # 管理画面コンポーネント
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminLayout.tsx
│   │   ├── FormBuilder.tsx
│   │   ├── FormList.tsx
│   │   ├── LineTemplateEditor.tsx
│   │   ├── ProductAdd.tsx
│   │   ├── ProductList.tsx
│   │   └── ReservationListAdmin.tsx
│   ├── CompletionScreen.tsx
│   ├── ConfirmationScreen.tsx
│   ├── ManageScreen.tsx
│   ├── PersonalInfoForm.tsx
│   ├── ProductSelectionForm.tsx
│   └── ReservationForm.tsx
├── lib/                # ライブラリ・ユーティリティ
│   └── supabase.ts     # Supabase設定・型定義
├── utils/              # ユーティリティ関数
│   └── addressSearch.ts
├── globals.css         # グローバルスタイル
├── layout.tsx          # アプリケーションレイアウト
└── page.tsx           # トップページ
```

## 主要機能フロー

### 予約フロー
1. **商品選択**: 片桐商店の商品（肥料・農薬・苗など）を選択
2. **数量・日付指定**: 各商品の数量と引き取り日を入力
3. **個人情報入力**: 予約者の連絡先情報を入力
4. **内容確認**: 予約内容と合計金額を確認
5. **予約完了**: 予約が確定され、完了画面を表示

### 管理フロー
1. **商品登録**: 商品情報の登録・更新
2. **フォーム設定**: 予約フォームの項目・有効期限設定
3. **予約管理**: 受注確認、ステータス更新
4. **通知送信**: LINE通知の送信・履歴管理

## セキュリティ

- **Row Level Security (RLS)**: Supabaseでのデータアクセス制御
- **認証**: 管理画面アクセスの認証機能
- **フォーム有効性**: 有効期限とアクティブ状態の管理
- **入力検証**: フロントエンド・バックエンド双方での検証

## デザインシステム

- **Codebase風デザイン**: モダンなウィジェット・カードデザイン
- **レスポンシブ**: モバイル・タブレット・デスクトップ対応
- **アニメーション**: スムーズなトランジション・ホバーエフェクト
- **カラーテーマ**: 農業テーマに合わせた緑・茶色系パレット

---

**注意**: このシステムは片桐商店 ベジライス様専用の予約システムです。
