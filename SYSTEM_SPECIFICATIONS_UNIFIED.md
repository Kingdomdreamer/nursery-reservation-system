# 🌱 保育園・種苗店予約システム - 統合仕様書

## 📋 システム概要

**プロジェクト名**: 保育園・種苗店予約システム (Nursery Reservation System)  
**目的**: 種苗店（園芸用品店）における商品予約システムを提供し、顧客の事前予約と管理者の効率的な予約管理を実現  
**フレームワーク**: Next.js 14 (App Router)  
**スタイリング**: Bootstrap 5.3.2 + カスタムテーマ  
**データベース**: Supabase (PostgreSQL)  
**認証**: Supabase Auth  
**言語**: TypeScript  
**更新日**: 2025年7月19日

---

## 🎨 デザインシステム

### テーマカラー
- **プライマリーカラー**: #8bc34a (ライトグリーン)
- **セカンダリーカラー**: #7cb342 (グリーン)
- **グラデーション**: `linear-gradient(135deg, #8bc34a 0%, #7cb342 100%)`
- **背景色**: #f1f8e9（薄い緑色）
- **アクセントカラー**: #e8f5e8（極薄い緑色）
- **テーマコンセプト**: 野菜・植物・農業をイメージした自然で親しみやすい色合い

### スタイリングフレームワーク
- **Bootstrap 5.3.2**: 完全移行済み
- **アイコン**: Bootstrap Icons + Lucide React
- **レスポンシブ**: モバイルファースト設計

---

## 📁 プロジェクト構造

```
nursery-reservation-system/
├── app/                     # Next.js App Router
│   ├── admin/              # 管理画面
│   │   ├── page.tsx        # ダッシュボード
│   │   ├── customers/      # 顧客管理
│   │   ├── forms/          # フォーム管理
│   │   ├── notifications/  # 通知管理
│   │   ├── products/       # 商品管理
│   │   │   └── add/       # 商品追加
│   │   ├── reservations/   # 予約管理
│   │   │   └── new/       # 新規予約
│   │   └── settings/      # システム設定
│   ├── components/         # Reactコンポーネント
│   │   ├── admin/         # 管理画面コンポーネント
│   │   ├── forms/         # フォーム関連コンポーネント
│   │   ├── line/          # LINE連携コンポーネント
│   │   ├── pwa/           # PWA関連コンポーネント
│   │   └── ui/            # 共通UIコンポーネント
│   ├── contexts/          # React Context
│   ├── lib/               # ライブラリ
│   │   └── services/      # サービス層
│   ├── form/[formId]/     # 動的フォームページ
│   └── api/               # APIルート
├── lib/                   # ユーティリティ関数
├── services/              # ビジネスロジック
├── types/                 # TypeScript型定義
├── utils/                 # ヘルパー関数
├── database/              # SQLスクリプト
├── docs/                  # ドキュメント
└── public/                # 静的ファイル
    ├── icons/             # PWAアイコン
    └── sw.js              # Service Worker
```

---

## 🗄️ Supabaseテーブル設計

### 現在実装されているテーブル一覧

以下の16のテーブルが現在のシステムで使用されています：

#### 1. **customers** (顧客)
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(255),
  postal_code VARCHAR(8),
  address TEXT,
  line_user_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. **products** (商品)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category_id UUID REFERENCES product_categories(id),
  unit VARCHAR(20),
  min_order_quantity INTEGER DEFAULT 1,
  max_order_quantity INTEGER,
  variation_name VARCHAR(100),
  image_url TEXT,
  barcode VARCHAR(50),
  tax_type VARCHAR(20) DEFAULT 'inclusive',
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. **product_categories** (商品カテゴリ)
```sql
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES product_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. **reservations** (予約)
```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_number VARCHAR(20) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  reservation_date DATE NOT NULL,
  pickup_time_start TIME NOT NULL,
  pickup_time_end TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  admin_notes TEXT,
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. **reservation_items** (予約商品)
```sql
CREATE TABLE reservation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  pickup_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. **forms** (フォーム)
```sql
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_to TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7. **form_configurations** (フォーム設定)
```sql
CREATE TABLE form_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  form_fields JSONB NOT NULL DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_to TIMESTAMP WITH TIME ZONE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 8. **form_fields** (フォームフィールド)
```sql
CREATE TABLE form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  field_type VARCHAR(50) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  field_label VARCHAR(200) NOT NULL,
  field_options JSONB DEFAULT '[]',
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 9. **form_products** (フォーム商品関連)
```sql
CREATE TABLE form_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  max_quantity INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 10. **form_display_settings** (フォーム表示設定)
```sql
CREATE TABLE form_display_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  show_prices BOOLEAN DEFAULT true,
  price_display_mode VARCHAR(20) DEFAULT 'full',
  show_categories BOOLEAN DEFAULT true,
  show_descriptions BOOLEAN DEFAULT true,
  custom_css TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 11. **pricing_display_settings** (価格表示設定)
```sql
CREATE TABLE pricing_display_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  show_item_prices BOOLEAN DEFAULT true,
  show_subtotals BOOLEAN DEFAULT true,
  show_total BOOLEAN DEFAULT true,
  show_tax_breakdown BOOLEAN DEFAULT false,
  price_format VARCHAR(20) DEFAULT 'currency',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 12. **notifications** (通知)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 13. **system_settings** (システム設定)
```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, key)
);
```

#### 14. **user_profiles** (ユーザープロファイル)
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role VARCHAR(20) DEFAULT 'admin',
  full_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(15),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 15. **line_templates** (LINEテンプレート)
```sql
CREATE TABLE line_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type VARCHAR(50) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  template_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 16. **export_history** (エクスポート履歴)
```sql
CREATE TABLE export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type VARCHAR(50) NOT NULL,
  exported_by UUID REFERENCES user_profiles(id),
  file_name VARCHAR(255),
  file_size INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  download_url TEXT,
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);
```

### 主要なリレーション

```
customers 1:N reservations
reservations 1:N reservation_items
products 1:N reservation_items
product_categories 1:N products
forms 1:N form_configurations
forms 1:N form_fields
forms 1:N form_products
forms 1:1 form_display_settings
forms 1:1 pricing_display_settings
user_profiles 1:N notifications
user_profiles 1:N export_history
```

### インデックス設定

```sql
-- パフォーマンス最適化のための推奨インデックス
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_customer ON reservations(customer_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_line_user_id ON customers(line_user_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_reservation_items_reservation ON reservation_items(reservation_id);
CREATE INDEX idx_reservation_items_product ON reservation_items(product_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_forms_active ON forms(is_active);
```

---

## 🔧 主要機能一覧

### 1. 管理画面機能

#### 📊 ダッシュボード (`/admin`)
- **統計表示**: 総予約数、今日の予約、保留中予約、売上
- **人気商品ランキング**: プログレスバー付き表示
- **最近のアクティビティ**: タイムライン形式
- **クイックアクション**: 4つのショートカットボタン

#### 👥 顧客管理 (`/admin/customers`)
- 顧客一覧表示（LINE認証状態表示）
- 新規顧客登録
- 顧客情報編集
- 顧客詳細表示・予約履歴
- 顧客データ削除機能

#### 📝 フォーム管理 (`/admin/forms`)
- フォーム一覧表示
- **新規フォーム作成**: 多段階ウィザード形式
- フォーム編集・削除
- 価格表示設定・表示制御
- プレビュー機能・QRコード生成
- フォーム回答データ閲覧・エクスポート

#### 📦 商品管理 (`/admin/products`)
- 商品一覧表示・カテゴリ管理
- **新規商品追加**: 単一/CSV一括対応
- 商品編集・削除・販売状態管理
- 商品画像アップロード機能（Base64変換・5MB制限）
- CSVインポート/エクスポート機能

#### 🗓️ 予約管理 (`/admin/reservations`)
- 予約一覧表示・検索・フィルタリング
- **新規予約作成**: 顧客選択、商品選択、日時設定
- 予約編集・キャンセル
- ステータス管理（保留→確定→準備完了→完了→キャンセル）
- PDF生成機能（個別注文書・日報レポート）

#### 🔔 通知管理 (`/admin/notifications`)
- システム通知表示・管理
- 通知の既読/未読管理
- 通知削除・全通知既読機能
- 予約確定・リマインダー通知

#### ⚙️ システム設定 (`/admin/settings`)
- 基本設定（サイト名、連絡先等）
- 通知設定（メール、LINE、SMS）
- 営業設定（営業時間、営業日）
- 高度な設定（自動確定、予約制限等）

### 2. 公開機能

#### 📋 予約フォーム (`/form/[formId]`)
- 動的フォーム表示・種苗店特化テンプレート
- 4ステップ予約フロー（商品選択→受取日時→顧客情報→確認）
- リアルタイムバリデーション
- 商品選択・数量指定・カテゴリフィルタ
- 価格計算・表示制御
- 確認画面・完了画面
- LINE LIFF連携・プロフィール自動取得

---

## 🔄 LINE連携機能

### LINE LIFF実装
- **プロフィール自動取得**: 表示名、プロフィール画像
- **データベース自動連携**: LINE User IDと顧客情報の紐付け
- **自動入力**: LINEプロフィール情報からフォーム項目を自動入力
- **環境別LIFF ID管理**: 開発・ステージング・本番環境対応

### 価格表示制御システム
- **表示モード**: 詳細表示・合計のみ・非表示・カスタム
- **管理機能**: フォームごとの価格表示設定
- **リアルタイムプレビュー**: 設定変更の即座反映

---

## 📱 PWA機能

### Service Worker実装
- **キャッシュ戦略**: 静的リソース・動的リソース・ページキャッシュ
- **オフライン対応**: オフライン時のフォールバック表示
- **バックグラウンド同期**: オフラインデータの自動同期

### PWAアイコン
- **マルチサイズ対応**: 72x72〜512x512の全サイズ
- **ショートカットアイコン**: 新規予約・管理・商品管理
- **ブランドカラー**: 緑色テーマ統一

---

## 🔒 セキュリティ仕様

### 認証・認可
- **Supabase Auth**: JWT トークンベース認証
- **Row Level Security (RLS)**: データベースレベルのアクセス制御
- **APIセキュリティ**: 環境変数によるシークレット管理

### データ保護
- **個人情報の暗号化**: 顧客情報・LINE User ID
- **SQLインジェクション対策**: Supabaseクライアントによる安全なクエリ
- **XSS対策**: 入力値のサニタイゼーション
- **CSRF対策**: Next.jsのデフォルト保護機能

---

## 📊 パフォーマンス最適化

### データベース最適化
- **インデックス設定**: 主要検索フィールドにB-treeインデックス
- **クエリ最適化**: JOIN操作の最小化・サブクエリ最適化
- **ページネーション**: 1ページあたり20件、最大1000件

### フロントエンド最適化
- **遅延読み込み**: 画像・コンポーネントの動的ロード
- **キャッシュ活用**: Service Workerによるリソースキャッシュ
- **レスポンシブデザイン**: モバイルファースト・タッチ操作最適化

---

## 🛠️ 開発・運用

### 開発環境
- **Node.js**: 18以上
- **Next.js**: 14 (App Router)
- **TypeScript**: 型安全性の確保
- **Package Manager**: npm

### 環境変数
```bash
# Supabase関連
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LINE関連
LINE_CHANNEL_ACCESS_TOKEN=your_access_token
NEXT_PUBLIC_LIFF_ID_DEV=your_dev_liff_id
NEXT_PUBLIC_LIFF_ID_STAGING=your_staging_liff_id
NEXT_PUBLIC_LIFF_ID_PROD=your_prod_liff_id

# 環境設定
NODE_ENV=development|staging|production
```

### バックアップ・復旧
- **データベースバックアップ**: 毎日午前2時（JST）
- **保存期間**: 30日間
- **復旧時間目標（RTO）**: 4時間
- **復旧ポイント目標（RPO）**: 24時間

---

## 🚀 今後の拡張予定

### 短期計画
1. **決済機能**: オンライン決済システム連携
2. **在庫管理**: 商品在庫の自動管理機能
3. **高度な分析**: 売上分析・顧客行動分析
4. **多管理者対応**: 役割ベースアクセス制御

### 中期計画
1. **マルチテナント**: 複数店舗対応
2. **AI予測**: 需要予測・在庫最適化
3. **マーケティング**: 自動メール配信・セグメント管理
4. **多言語対応**: 国際化対応

---

## 📖 更新履歴

### v1.4.0 (2025-07-19)
- ✅ Supabaseテーブル設計統合・整理
- ✅ 仕様書統合（種苗店・保育園システム）
- ✅ PWAアイコン修正・Service Worker最適化
- ✅ 全16テーブル構造の詳細記載

### v1.3.0 (2025-07-17)
- ✅ CSV商品一括追加エラー修正
- ✅ フォーム作成ボタン修正
- ✅ 通知システム実装
- ✅ 全ボタン機能検証・修正

---

**🎉 統合仕様書完成 - 全機能・全テーブルが体系的に整理され、安定動作を実現！**