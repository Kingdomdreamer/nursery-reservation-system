# Design Document

## Overview

このドキュメントでは、LINE LIFF（LINE Front-end Framework）を活用した顧客向け予約フォームアプリケーションの設計について詳細に説明します。このアプリケーションは、Next.jsを使用したフロントエンドとSupabaseを使用したバックエンドで構成されており、LINEプラットフォーム上で動作します。ユーザーはLINE上で商品予約を行い、管理者は予約情報を管理できます。

## Architecture

システムは以下の主要コンポーネントで構成されています：

1. **フロントエンド**：Next.js（App Router）を使用したReactアプリケーション
2. **バックエンド**：Supabaseを使用したサーバーレスバックエンド
3. **外部連携**：LINE Messaging APIとLINE LIFF SDK
4. **データストレージ**：Supabase PostgreSQLデータベース

## 技術スタック

### フロントエンド技術
- **フレームワーク**: Next.js 15.3.3 (App Router)
- **言語**: TypeScript 5.8.3
- **UIライブラリ**: React 19.0.0
- **スタイリング**: Tailwind CSS 3.4.1
- **UIコンポーネント**: Radix UI (各種コンポーネント)
- **フォーム管理**: React Hook Form 7.57.0 + Zod 3.25.50
- **状態管理**: Zustand 5.0.5
- **アニメーション**: Framer Motion 12.18.1
- **通知**: Sonner 2.0.5
- **日付処理**: date-fns 4.1.0
- **日本の祝日**: japanese-holidays 1.0.10
- **QRコード**: react-qr-code 2.0.15
- **CSVパース**: papaparse 5.5.3

### バックエンド技術
- **データベース**: Supabase PostgreSQL
- **認証**: Supabase Auth
- **API**: Next.js API Routes (App Router)
- **ORM/クライアント**: @supabase/supabase-js 2.49.8
- **SSR対応**: @supabase/ssr 0.6.1

### 外部連携
- **LINE LIFF**: @line/liff 2.26.1
- **LINE Messaging API**: REST API (Node.js fetch)

### 開発・ビルドツール
- **パッケージマネージャー**: npm / yarn 1.22.22
- **リンター**: ESLint 9 + eslint-config-next 15.1.8
- **型チェック**: TypeScript
- **CSS処理**: PostCSS 8
- **環境変数**: dotenv 16.5.0

### デプロイメント・ホスティング
- **ホスティング**: Vercel 
- **ドメイン**: https://vejiraisu.yoyaku.com/
- **SSL**: 自動対応（Vercel）

## 環境構成

### 開発環境
```
Node.js: 20.x以上
npm: 10.x以上
TypeScript: 5.8.3
```

### 環境変数設定
```env
# Next.js
NEXT_PUBLIC_BASE_URL=https://vejiraisu.yoyaku.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://uscvsipskkbegcfktjyt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzY3ZzaXBza2tiZWdjZmt0anl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MDI4MzUsImV4cCI6MjA2Nzk3ODgzNX0.VhcGWXb-PpHTfqPApSIG4C6xXLik8JClsNhOdJIgdzw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzY3ZzaXBza2tiZWdjZmt0anl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQwMjgzNSwiZXhwIjoyMDY3OTc4ODM1fQ.GpIODjKZJppJLu2Hwa2i2goPmE23vS5FnMa9J1LDzB0

# LINE LIFF
NEXT_PUBLIC_LIFF_ID=2007787336-ONKMVygx

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=UYqfMDzllpxhibeD9aHspQ1lbP50f1/zJk71E+/2+LYA3NPO7DaGm2YU5BRomA3n86L9z0b1KW+g3D9HsGe0G7iPz0yZtN7liEv5qs3lltZ3YKxP0Zst9BvZsmYnc2qgG1JtF6fEYax4AGQkaZsgCAdB04t89/1O/w1cDnyilFU=
LINE_CHANNEL_SECRET=36cf07cbd04fe902a7d41d4508d68905

# LINE Login
LINE_LOGIN_CHANNEL_ID=2007787336
LINE_LOGIN_CHANNEL_SECRET=eaf2dc5e15fd8d1cb14303491b751d12
```

### プロジェクト構造
```
liff-customer-form-new/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # 管理画面
│   │   ├── api/               # API Routes
│   │   ├── complete/          # 完了画面
│   │   ├── confirm/           # 確認画面
│   │   ├── edit/              # 編集画面
│   │   ├── form/              # フォーム画面
│   │   ├── login/             # ログイン画面
│   │   └── unauthorized/      # 認証エラー画面
│   ├── components/            # Reactコンポーネント
│   │   ├── admin/            # 管理画面コンポーネント
│   │   ├── form/             # フォーム関連コンポーネント
│   │   └── ui/               # 共通UIコンポーネント
│   ├── lib/                   # ユーティリティ関数
│   ├── types/                 # TypeScript型定義
│   └── utils/                 # ヘルパー関数
├── public/                    # 静的ファイル
│   └── images/               # 画像ファイル
├── .env.local                # 環境変数（ローカル）
├── next.config.ts            # Next.js設定
├── tailwind.config.ts        # Tailwind CSS設定
├── tsconfig.json             # TypeScript設定
└── package.json              # 依存関係
```

```mermaid
graph TD
    A[LINE User] -->|LIFF App| B[Next.js Frontend]
    B -->|API Calls| C[Supabase Backend]
    C -->|Store/Retrieve| D[PostgreSQL Database]
    B -->|Notifications| E[LINE Messaging API]
    E -->|Send Messages| A
    F[Admin User] -->|Admin Dashboard| B
```

## Components and Interfaces

### フロントエンドコンポーネント

1. **フォームページ** (`/form`)
   - ユーザー情報入力フォーム
   - 商品選択インターフェース
   - 引き取り日選択カレンダー

2. **確認ページ** (`/confirm`)
   - 入力情報の確認表示
   - 利用規約・プライバシーポリシーの表示
   - 同意と予約確定を兼ねたボタン（「同意して予約を確定する」）

3. **完了ページ** (`/complete`)
   - 予約完了メッセージ
   - LINEに戻るボタン

4. **管理ダッシュボード** (`/admin`)
   - 本日の予約一覧
     - 予約詳細表示ボタン：クリックすると予約の詳細情報をモーダルで表示
     - 予約編集ボタン：クリックすると予約編集画面に遷移
     - キャンセルボタン：クリックすると予約キャンセル確認ダイアログを表示し、確認後に予約をキャンセル
     - LINE通知ボタン：クリックするとユーザーにLINE通知を送信するオプションを表示
   - 週間予約サマリー
     - 日付選択：特定の日付をクリックすると、その日の予約一覧を表示
     - カテゴリフィルター：商品カテゴリでフィルタリング可能
     - エクスポートボタン：週間データをCSV形式でエクスポート
   - 月間カレンダー表示
     - 月切替ボタン：前月・翌月に表示を切り替え
     - 日付クリック：特定の日をクリックすると、その日の予約詳細を表示
     - 予約数バッジ：各日付に予約数を表示し、クリックで詳細表示

5. **商品マスタ管理画面** (`/admin/products`)
   - 商品一覧表示
     - 商品名、カテゴリ、価格の一覧表示
     - 検索・フィルタリング機能
   - 商品登録・編集機能
     - 新規商品登録フォーム
     - 既存商品の編集・削除機能
   - 一括インポート機能
     - CSV形式での商品データ一括インポート
     - インポート結果の確認・エラー表示
   - 一括エクスポート機能
     - 商品マスタデータのCSV出力

6. **通知設定管理** (`/admin/notifications`)
   - フォーム作成時の通知設定
     - 予約確認通知の有効/無効
     - リマインダー通知の送信タイミング設定
     - 通知メッセージテンプレートのカスタマイズ
   - 通知履歴の確認
     - 送信成功・失敗の履歴表示
     - 失敗時の再送機能（最大3回試行）

### バックエンドインターフェース

1. **API エンドポイント**
   - `/api/submit` - 予約データの送信処理
   - `/api/settings` - フォーム設定の取得
   - `/api/products` - 商品情報の取得
   - `/api/pickup-windows` - 引き取り可能期間の取得

## Data Models

### データベース設計

データベースは以下の主要テーブルで構成されています：

#### 1. `reservations` テーブル

予約情報を格納するメインテーブル

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| id | uuid | 主キー、予約ID |
| user_id | text | LINE ユーザーID |
| product_preset_id | integer | 商品プリセットID |
| user_name | text | 予約者名 |
| furigana | text | ふりがな |
| phone_number | text | 電話番号 |
| zip | text | 郵便番号 |
| address | text | 住所 |
| product | text[] | 商品名の配列 |
| product_category | text | 商品カテゴリ |
| quantity | integer | 数量 |
| unit_price | integer | 単価 |
| pickup_date | timestamp | 引き取り日 |
| variation | text | 商品バリエーション |
| comment | text | 商品コメント |
| note | text | 備考 |
| total_amount | integer | 合計金額 |
| created_at | timestamp | 作成日時 |

#### 2. `form_settings` テーブル

フォームの表示設定を管理するテーブル

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| id | integer | 主キー |
| preset_id | integer | プリセットID |
| show_price | boolean | 価格表示フラグ |
| require_address | boolean | 住所必須フラグ |
| enable_gender | boolean | 性別入力有効フラグ |
| enable_birthday | boolean | 生年月日入力有効フラグ |
| enable_furigana | boolean | ふりがな入力有効フラグ |
| pickup_start | timestamp | 引き取り開始日 |
| pickup_end | timestamp | 引き取り終了日 |
| valid_until | timestamp | フォーム有効期限 |
| is_enabled | boolean | フォーム有効フラグ |

#### 3. `products` テーブル

商品マスタ情報を管理するテーブル

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| id | integer | 主キー、商品ID |
| name | text | 商品名 |
| external_id | text | 外部システム連携用ID |
| category_id | integer | カテゴリID |
| price | integer | 価格 |

#### 4. `pickup_windows` テーブル

商品ごとの引き取り可能期間を管理するテーブル

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| id | integer | 主キー |
| product_id | integer | 商品ID |
| pickup_start | timestamp | 引き取り開始日 |
| pickup_end | timestamp | 引き取り終了日 |
| preset_id | integer | プリセットID |
| dates | text[] | 利用可能日の配列 |
| price | integer | 特別価格（オプション） |
| comment | text | コメント |
| variation | text | バリエーション名 |

#### 5. `product_presets` テーブル

商品プリセット情報を管理するテーブル

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| id | integer | 主キー |
| preset_name | text | プリセット名 |

#### 6. `notification_logs` テーブル

LINE通知ログを管理するテーブル

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| id | uuid | 主キー |
| user_id | text | LINE ユーザーID |
| type | text | 通知タイプ |
| message | jsonb | 送信メッセージ内容 |
| sent_at | timestamp | 送信日時 |

### データリレーション

```mermaid
erDiagram
    product_presets ||--o{ form_settings : "has"
    product_presets ||--o{ pickup_windows : "has"
    products ||--o{ pickup_windows : "has"
    reservations }o--|| product_presets : "belongs_to"
    notification_logs }o--|| reservations : "relates_to"
```

### データベース構築SQL

以下は、Supabaseで使用するPostgreSQLのDDL文です。

```sql
-- 1. 商品プリセットテーブル
CREATE TABLE product_presets (
    id SERIAL PRIMARY KEY,
    preset_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 商品マスタテーブル
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    external_id TEXT,
    category_id INTEGER,
    price INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. フォーム設定テーブル
CREATE TABLE form_settings (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER REFERENCES product_presets(id) ON DELETE CASCADE,
    show_price BOOLEAN DEFAULT false,
    require_address BOOLEAN DEFAULT false,
    enable_gender BOOLEAN DEFAULT false,
    enable_birthday BOOLEAN DEFAULT false,
    enable_furigana BOOLEAN DEFAULT false,
    pickup_start TIMESTAMP WITH TIME ZONE,
    pickup_end TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 引き取り可能期間テーブル
CREATE TABLE pickup_windows (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    pickup_start TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_end TIMESTAMP WITH TIME ZONE NOT NULL,
    preset_id INTEGER REFERENCES product_presets(id) ON DELETE CASCADE,
    dates TEXT[] DEFAULT '{}',
    price INTEGER,
    comment TEXT,
    variation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 予約テーブル
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    product_preset_id INTEGER REFERENCES product_presets(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    furigana TEXT,
    phone_number TEXT NOT NULL,
    zip TEXT,
    address TEXT,
    product TEXT[] DEFAULT '{}',
    product_category TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price INTEGER DEFAULT 0,
    pickup_date TIMESTAMP WITH TIME ZONE,
    variation TEXT,
    comment TEXT,
    note TEXT,
    total_amount INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 通知ログテーブル
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    message JSONB,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
-- 予約テーブルの検索パフォーマンス向上
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_pickup_date ON reservations(pickup_date);
CREATE INDEX idx_reservations_product_preset_id ON reservations(product_preset_id);
CREATE INDEX idx_reservations_created_at ON reservations(created_at);

-- 通知ログテーブルの検索パフォーマンス向上
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(type);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);

-- 引き取り可能期間テーブルの検索パフォーマンス向上
CREATE INDEX idx_pickup_windows_product_id ON pickup_windows(product_id);
CREATE INDEX idx_pickup_windows_preset_id ON pickup_windows(preset_id);
CREATE INDEX idx_pickup_windows_pickup_start ON pickup_windows(pickup_start);
CREATE INDEX idx_pickup_windows_pickup_end ON pickup_windows(pickup_end);

-- RLS (Row Level Security) の有効化
ALTER TABLE product_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成（基本的な読み取り許可）
CREATE POLICY "Enable read access for all users" ON product_presets FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON form_settings FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON pickup_windows FOR SELECT USING (true);

-- 予約テーブルのRLSポリシー（ユーザーは自分の予約のみ操作可能）
CREATE POLICY "Users can view own reservations" ON reservations FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own reservations" ON reservations FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own reservations" ON reservations FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own reservations" ON reservations FOR DELETE USING (auth.uid()::text = user_id);

-- 通知ログテーブルのRLSポリシー
CREATE POLICY "Users can view own notification logs" ON notification_logs FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "System can insert notification logs" ON notification_logs FOR INSERT WITH CHECK (true);

-- 管理者用のRLSポリシー（管理者は全データにアクセス可能）
-- 注意: 実際の実装では、管理者の識別方法を適切に設定する必要があります
CREATE POLICY "Admin full access to reservations" ON reservations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email IN ('admin@example.com') -- 実際の管理者メールアドレスに変更
    )
);

-- サンプルデータの挿入
INSERT INTO product_presets (preset_name) VALUES 
('野菜セット'),
('果物セット'),
('お米セット');

INSERT INTO products (name, external_id, category_id, price) VALUES 
('野菜セットA', 'VEG001', 1, 1000),
('野菜セットB', 'VEG002', 1, 1500),
('果物セット', 'FRUIT001', 2, 2000),
('お米5kg', 'RICE001', 3, 3000),
('お米10kg', 'RICE002', 3, 5000);

INSERT INTO form_settings (preset_id, show_price, require_address, enable_gender, enable_birthday, enable_furigana, is_enabled) VALUES 
(1, true, true, false, false, true, true),
(2, true, false, false, false, false, true),
(3, true, true, true, true, true, true);

INSERT INTO pickup_windows (product_id, pickup_start, pickup_end, preset_id, dates) VALUES 
(1, '2025-07-25 10:00:00+09', '2025-07-25 18:00:00+09', 1, ARRAY['2025-07-25', '2025-07-26', '2025-07-27']),
(2, '2025-07-25 10:00:00+09', '2025-07-25 18:00:00+09', 1, ARRAY['2025-07-25', '2025-07-26', '2025-07-27']),
(3, '2025-07-26 10:00:00+09', '2025-07-26 18:00:00+09', 2, ARRAY['2025-07-26', '2025-07-27', '2025-07-28']),
(4, '2025-07-27 10:00:00+09', '2025-07-27 18:00:00+09', 3, ARRAY['2025-07-27', '2025-07-28', '2025-07-29']),
(5, '2025-07-27 10:00:00+09', '2025-07-27 18:00:00+09', 3, ARRAY['2025-07-27', '2025-07-28', '2025-07-29']);

-- 更新日時の自動更新用トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルに更新日時の自動更新トリガーを設定
CREATE TRIGGER update_product_presets_updated_at BEFORE UPDATE ON product_presets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_settings_updated_at BEFORE UPDATE ON form_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pickup_windows_updated_at BEFORE UPDATE ON pickup_windows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### データベース初期化手順

1. **Supabaseプロジェクトの作成**
   - Supabase Dashboard (https://app.supabase.com) にアクセス
   - 新しいプロジェクトを作成

2. **SQLエディタでの実行**
   - Supabase Dashboard の「SQL Editor」を開く
   - 上記のSQLコードを順番に実行

3. **環境変数の設定**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **RLSポリシーの調整**
   - 管理者メールアドレスを実際のものに変更
   - 必要に応じてポリシーを調整

## Error Handling

1. **フォームバリデーション**
   - クライアントサイドでの入力検証
   - 必須フィールドの検証
   - 電話番号、郵便番号などのフォーマット検証

2. **API エラーハンドリング**
   - HTTP ステータスコードによるエラー通知
   - エラーメッセージの表示
   - 予約処理失敗時のリトライ機能

3. **LINE 連携エラー**
   - LIFF初期化エラーの処理
   - LINE通知送信失敗時のログ記録

## LINE通知メッセージ仕様

LINE Messaging APIを使用して、以下のタイミングでユーザーに通知メッセージを送信します。

### 1. 予約確認通知

予約が完了した時点で送信されるメッセージです。

**メッセージ構成:**
- **ヘッダー**: 予約完了のお知らせ
- **本文**:
  - 予約者情報（名前、電話番号）
  - 予約商品リスト（商品名、数量、価格）
  - 引き取り日情報（カテゴリ別日付）
  - 合計金額（設定により表示/非表示）
- **フッター**:
  - 予約編集用リンク
  - お問い合わせ情報

**サンプル:**
```
【予約完了のお知らせ】

山田太郎様、ご予約ありがとうございます。
以下の内容で予約を承りました。

■ご予約内容
・野菜セットA（2個）：2,000円
・果物セット（1個）：1,500円

■お引き取り日
・野菜セット：2025年7月25日（金）
・果物セット：2025年7月26日（土）

■合計金額
3,500円

ご予約内容の変更は以下のリンクから可能です。
https://example.com/edit?id=12345

ご不明点はお気軽にお問い合わせください。
```

### 2. リマインダー通知

引き取り日の前日または当日に送信されるリマインダーメッセージです。

**メッセージ構成:**
- **ヘッダー**: 引き取り日のお知らせ
- **本文**:
  - 予約者名
  - 引き取り対象商品
  - 引き取り日時
  - 引き取り場所
- **フッター**:
  - 予約確認用リンク
  - お問い合わせ情報

**サンプル:**
```
【明日の引き取りのお知らせ】

山田太郎様

明日は以下商品の引き取り日です。
・野菜セットA（2個）

■引き取り日時
2025年7月25日（金）10:00～18:00

■引き取り場所
〒123-4567
東京都渋谷区〇〇1-2-3
ベジライス渋谷店

ご予約内容の確認は以下のリンクから可能です。
https://example.com/view?id=12345
```

### 3. キャンセル通知

予約がキャンセルされた場合に送信されるメッセージです。

**メッセージ構成:**
- **ヘッダー**: 予約キャンセルのお知らせ
- **本文**:
  - キャンセルされた予約の概要
  - キャンセル日時
- **フッター**:
  - 再予約用リンク
  - お問い合わせ情報

**サンプル:**
```
【予約キャンセルのお知らせ】

山田太郎様

以下のご予約がキャンセルされました。

■キャンセルされた予約
・野菜セットA（2個）
・果物セット（1個）

■キャンセル日時
2025年7月20日 15:30

再度ご予約される場合は以下のリンクからお願いします。
https://example.com/reserve

ご不明点はお気軽にお問い合わせください。
```

## Testing Strategy

1. **ユニットテスト**
   - コンポーネントの個別テスト
   - フォームバリデーションロジックのテスト

2. **統合テスト**
   - フォーム送信からデータベース保存までのフロー
   - LINE通知機能の検証

3. **E2Eテスト**
   - 実際のユーザーフローのシミュレーション
   - 管理画面機能の検証

## データフロー

1. **予約フロー**
   ```
   ユーザー入力 → フォームバリデーション → 確認画面表示 → 
   データベース保存 → LINE通知送信 → 完了画面表示
   ```

2. **管理者閲覧フロー**
   ```
   管理者ログイン → 権限確認 → 予約データ取得 → 
   日付別/カテゴリ別表示 → データ分析表示
   ```

## セキュリティ考慮事項

1. **認証**
   - LINE LIFFによるユーザー認証
   - 管理画面へのアクセス制限

2. **データ保護**
   - 個人情報の適切な取り扱い
   - データベースアクセス制限

3. **入力検証**
   - すべてのユーザー入力の検証
   - SQLインジェクション対策

## 確認すべき仕様詳細項目

実装前に確認・決定すべき詳細仕様項目は以下の通りです：

### 1. データベース関連

- **予約データの保持期間**：3年間
- **インデックス設計**：パフォーマンス向上のための適切なインデックス設定

### 2. LINE LIFF関連

- **LIFF権限スコープ**：必要な権限スコープの確定（profile, openid, etc.）
- **エラー時のフォールバック**：LIFF初期化失敗時の代替フロー
- **複数デバイス対応**：同一ユーザーが異なるデバイスからアクセスした場合の挙動

### 3. 予約フロー

- **予約の重複チェック**：同一ユーザーによる重複予約の扱い
- **予約キャンセルポリシー**：キャンセル可能期限や条件
- **予約変更の制限**：変更可能な項目と変更可能期限

### 4. 管理機能

- **管理者権限レベル**：複数の管理者権限レベルの必要性
- **一括操作機能**：複数予約の一括処理機能の詳細
- **データエクスポート形式**：CSVなど、エクスポートするデータ形式と項目

### 5. パフォーマンスと拡張性

- **同時アクセス対応**：多数のユーザーが同時アクセスした場合の対応
- **スケーリング戦略**：ユーザー数や予約数が増加した場合の対応策
- **キャッシュ戦略**：頻繁にアクセスされるデータのキャッシュ方法

## 開発・デプロイメント手順

### 1. 開発環境セットアップ

```bash
# Node.js 20.x以上をインストール
# プロジェクトクローン後
cd liff-customer-form-new
npm install

# 環境変数ファイルの作成
cp .env.example .env.local
# .env.localに必要な環境変数を設定

# 開発サーバー起動
npm run dev
```

### 2. Supabaseセットアップ

1. **プロジェクト作成**
   - https://app.supabase.com でプロジェクト作成
   - プロジェクトURL、ANON KEY、SERVICE ROLE KEYを取得

2. **データベース初期化**
   - SQL Editorで提供されたDDL文を実行
   - サンプルデータの投入

3. **認証設定**
   - Authentication > Settings で必要な設定を行う

### 3. LINE開発者設定

1. **LINEログインチャンネル設定**
   - チャンネルID: 2007787336
   - LIFF App設定: エンドポイントURL設定

2. **Messaging APIチャンネル設定**
   - チャンネルID: 2007484278
   - Webhook URL設定（必要に応じて）

### 4. デプロイメント

#### Vercelデプロイ（推奨）

```bash
# Vercel CLIインストール
npm i -g vercel

# デプロイ
vercel

# 環境変数設定
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# その他の環境変数も同様に設定
```

#### 他のプラットフォーム

- **Netlify**: Next.js対応、環境変数設定が必要
- **Railway**: データベース付きデプロイ可能
- **AWS Amplify**: フルスタック対応

## パフォーマンス最適化

### 1. フロントエンド最適化

- **画像最適化**: Next.js Image コンポーネント使用
- **コード分割**: 動的インポートによる遅延読み込み
- **キャッシュ戦略**: SWRまたはReact Queryの活用
- **バンドルサイズ最適化**: webpack-bundle-analyzerによる分析

### 2. データベース最適化

- **インデックス最適化**: 頻繁な検索条件にインデックス設定
- **クエリ最適化**: N+1問題の回避
- **接続プール**: Supabaseの接続プール活用

### 3. API最適化

- **レスポンスキャッシュ**: Next.js API Routesでのキャッシュ設定
- **レート制限**: 不正アクセス防止
- **圧縮**: gzip圧縮の有効化

## 監視・ログ

### 1. エラー監視

- **Sentry**: エラートラッキング（推奨）
- **LogRocket**: ユーザーセッション記録
- **Vercel Analytics**: パフォーマンス監視

### 2. ログ管理

- **アプリケーションログ**: console.log → 構造化ログ
- **アクセスログ**: Vercel/Netlifyの標準ログ
- **データベースログ**: Supabaseダッシュボード

### 3. パフォーマンス監視

- **Core Web Vitals**: Lighthouseスコア監視
- **レスポンス時間**: API応答時間の監視（目標：10秒以内）
- **エラー率**: 4xx/5xxエラーの監視
- **同時接続数**: 最大100人未満の想定

## セキュリティ対策

### 1. 認証・認可

- **LIFF認証**: LINE IDによる認証
- **RLS**: Supabaseの行レベルセキュリティ
- **CSRF対策**: Next.jsの標準対策

### 2. データ保護

- **個人情報暗号化**: 機密データの暗号化
- **HTTPS強制**: SSL/TLS通信の強制
- **環境変数管理**: 機密情報の適切な管理

### 3. 入力検証

- **クライアントサイド**: Zodによるスキーマ検証
- **サーバーサイド**: API Routesでの再検証
- **SQLインジェクション対策**: パラメータ化クエリ

## 運用・保守

### 1. バックアップ戦略

- **データベース**: Supabaseの自動バックアップ
- **コード**: Gitリポジトリでのバージョン管理
- **設定**: 環境変数のドキュメント化

### 2. 障害対応

- **監視アラート**: 重要メトリクスの監視
- **復旧手順**: 障害時の対応手順書
- **連絡体制**: 障害時の連絡フロー

### 3. 定期メンテナンス

- **依存関係更新**: セキュリティアップデート
- **パフォーマンス監視**: 定期的な性能チェック
- **データクリーンアップ**: 古いデータの整理

## 品質保証

### 1. テスト戦略

- **ユニットテスト**: Jest + React Testing Library
- **統合テスト**: API エンドポイントのテスト
- **E2Eテスト**: Playwright または Cypress

### 2. コード品質

- **ESLint**: コード品質チェック
- **Prettier**: コードフォーマット
- **TypeScript**: 型安全性の確保
- **Husky**: Git hooks による品質チェック

### 3. CI/CD

- **GitHub Actions**: 自動テスト・デプロイ
- **プルリクエスト**: コードレビュープロセス
- **ステージング環境**: 本番前の検証環境