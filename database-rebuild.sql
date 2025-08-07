-- ===== 商品予約システム データベース再構築スクリプト =====
-- 設計文書に基づく包括的なデータベース構造の再構築
-- 実行前に既存データのバックアップを取得してください

-- ===== 既存テーブルの一括削除 =====
-- 外部キー制約があるため、依存関係の逆順で削除

DROP TABLE IF EXISTS reservation_history CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS form_settings CASCADE;
DROP TABLE IF EXISTS preset_products CASCADE;
DROP TABLE IF EXISTS pickup_windows CASCADE;
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS product_presets CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- ===== 新しいテーブル構造の作成 =====
-- 商品マスタテーブル
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_code TEXT UNIQUE,
    name TEXT NOT NULL,
    variation_id INTEGER DEFAULT 1,
    variation_name TEXT DEFAULT '通常価格',
    tax_type VARCHAR(10) NOT NULL DEFAULT '内税' CHECK (tax_type IN ('内税', '外税')),
    price INTEGER NOT NULL DEFAULT 0,
    barcode TEXT,
    
    -- システム設定
    visible BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER DEFAULT 0,
    
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT products_name_check CHECK (length(name) > 0),
    CONSTRAINT products_price_check CHECK (price >= 0)
);

-- プリセット（フォーム）マスタテーブル
CREATE TABLE product_presets (
    id SERIAL PRIMARY KEY,
    preset_name TEXT NOT NULL,
    description TEXT,
    form_expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT presets_name_check CHECK (length(preset_name) > 0)
);

-- プリセット商品関連テーブル
CREATE TABLE preset_products (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER NOT NULL REFERENCES product_presets(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    pickup_start TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_end TIMESTAMP WITH TIME ZONE NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 一意制約
    UNIQUE(preset_id, product_id),
    
    -- 制約
    CONSTRAINT preset_products_pickup_dates_check CHECK (pickup_start < pickup_end)
);

-- フォーム設定テーブル
CREATE TABLE form_settings (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER NOT NULL REFERENCES product_presets(id) ON DELETE CASCADE,
    
    -- 表示項目設定
    show_name BOOLEAN NOT NULL DEFAULT true,
    show_furigana BOOLEAN NOT NULL DEFAULT true,
    show_gender BOOLEAN NOT NULL DEFAULT false,
    show_birthday BOOLEAN NOT NULL DEFAULT false,
    show_phone BOOLEAN NOT NULL DEFAULT true,
    show_zip BOOLEAN NOT NULL DEFAULT false,
    show_address1 BOOLEAN NOT NULL DEFAULT false,
    show_address2 BOOLEAN NOT NULL DEFAULT false,
    show_comment BOOLEAN NOT NULL DEFAULT true,
    show_price BOOLEAN NOT NULL DEFAULT true,
    show_total BOOLEAN NOT NULL DEFAULT true,
    
    -- 互換性のための追加フィールド
    require_phone BOOLEAN NOT NULL DEFAULT true,
    require_furigana BOOLEAN NOT NULL DEFAULT false,
    allow_note BOOLEAN NOT NULL DEFAULT true,
    enable_birthday BOOLEAN NOT NULL DEFAULT false,
    enable_gender BOOLEAN NOT NULL DEFAULT false,
    require_address BOOLEAN NOT NULL DEFAULT false,
    enable_furigana BOOLEAN NOT NULL DEFAULT true,
    
    -- システム設定
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    custom_message TEXT,
    
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 一意制約
    UNIQUE(preset_id)
);

-- 予約テーブル
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preset_id INTEGER NOT NULL REFERENCES product_presets(id) ON DELETE RESTRICT,
    
    -- 顧客情報
    user_name TEXT NOT NULL,
    furigana TEXT,
    gender VARCHAR(10),
    birthday DATE,
    phone_number TEXT NOT NULL,
    zip_code TEXT,
    address1 TEXT,
    address2 TEXT,
    comment TEXT,
    
    -- 互換性のための追加フィールド
    phone TEXT, -- phone_number のエイリアス
    pickup_date TIMESTAMP WITH TIME ZONE,
    note TEXT, -- comment のエイリアス
    
    -- 予約情報
    selected_products JSONB NOT NULL,
    products JSONB, -- selected_products のエイリアス（互換性）
    total_amount INTEGER NOT NULL DEFAULT 0,
    
    -- システム情報
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    line_user_id TEXT,
    cancel_token TEXT UNIQUE,
    
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT reservations_user_name_check CHECK (length(user_name) > 0),
    CONSTRAINT reservations_phone_check CHECK (length(phone_number) > 0),
    CONSTRAINT reservations_total_check CHECK (total_amount >= 0)
);

-- 予約履歴テーブル
CREATE TABLE reservation_history (
    id UUID PRIMARY KEY,
    preset_id INTEGER,
    
    -- 顧客情報（スナップショット）
    user_name TEXT NOT NULL,
    furigana TEXT,
    gender VARCHAR(10),
    birthday DATE,
    phone_number TEXT NOT NULL,
    zip_code TEXT,
    address1 TEXT,
    address2 TEXT,
    comment TEXT,
    
    -- 予約情報（スナップショット）
    selected_products JSONB NOT NULL,
    pickup_date TIMESTAMP WITH TIME ZONE,
    total_amount INTEGER NOT NULL DEFAULT 0,
    
    -- システム情報
    original_status VARCHAR(20) NOT NULL,
    line_user_id TEXT,
    
    -- 履歴メタデータ
    original_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    original_updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    moved_to_history_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 管理者認証テーブル
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 通知ログテーブル（既存互換性のため）
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    message JSONB,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ピックアップウィンドウテーブル（既存互換性のため）
CREATE TABLE pickup_windows (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER NOT NULL REFERENCES product_presets(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time TIME,
    end_time TIME,
    available_slots INTEGER DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ===== パフォーマンス最適化用インデックス =====
CREATE INDEX idx_products_visible_order ON products(visible, display_order) WHERE visible = true;
CREATE INDEX idx_products_variation ON products(name, variation_id) WHERE visible = true;

CREATE INDEX idx_presets_active ON product_presets(is_active, form_expiry_date) WHERE is_active = true;

CREATE INDEX idx_preset_products_preset ON preset_products(preset_id, display_order) WHERE is_active = true;
CREATE INDEX idx_preset_products_pickup ON preset_products(pickup_start, pickup_end) WHERE is_active = true;

CREATE INDEX idx_form_settings_enabled ON form_settings(preset_id) WHERE is_enabled = true;

CREATE INDEX idx_reservations_preset_status ON reservations(preset_id, status, created_at);
CREATE INDEX idx_reservations_phone ON reservations(phone_number, created_at);
CREATE INDEX idx_reservations_cancel_token ON reservations(cancel_token) WHERE cancel_token IS NOT NULL;

CREATE INDEX idx_reservation_history_preset ON reservation_history(preset_id, moved_to_history_at);
CREATE INDEX idx_reservation_history_phone ON reservation_history(phone_number, moved_to_history_at);

-- ===== 初期データの投入 =====

-- デフォルト管理者ユーザー（パスワード: admin123 - 実際の本番環境では変更してください）
INSERT INTO admin_users (username, password_hash) VALUES 
('admin', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ');

-- サンプル商品データ
INSERT INTO products (name, variation_id, variation_name, tax_type, price, display_order, product_code) VALUES 
('りんご', 1, '通常価格', '内税', 100, 1, 'APPLE001'),
('りんご', 2, '特価', '内税', 80, 2, 'APPLE002'),
('りんご', 3, '大玉', '内税', 150, 3, 'APPLE003'),
('みかん', 1, '通常価格', '内税', 120, 4, 'ORANGE001'),
('みかん', 2, '特価', '内税', 100, 5, 'ORANGE002'),
('バナナ', 1, '通常価格', '内税', 80, 6, 'BANANA001'),
('いちご', 1, 'パック', '内税', 300, 7, 'STRAWBERRY001');

-- サンプルプリセット
INSERT INTO product_presets (preset_name, description, is_active) VALUES 
('秋の収穫祭', '秋の新鮮な果物をお届けします', true),
('特価セール', 'お得な価格でご提供中', true),
('春のフルーツ', '春の新鮮なフルーツセット', true),
('テスト用フォーム', 'システムテスト用のフォーム', true);

-- サンプルフォーム設定
INSERT INTO form_settings (
    preset_id, 
    show_name, show_furigana, show_phone, show_comment, show_price, show_total,
    require_phone, require_furigana, allow_note
) VALUES 
(1, true, true, true, true, true, true, true, false, true),
(2, true, false, true, false, true, true, true, false, false),
(3, true, true, true, true, true, true, true, true, true),
(4, true, true, true, true, true, true, true, false, true);

-- サンプルプリセット商品関連
INSERT INTO preset_products (preset_id, product_id, pickup_start, pickup_end, display_order, is_active) VALUES 
-- 秋の収穫祭
(1, 1, '2025-02-01 09:00:00+09', '2025-02-28 17:00:00+09', 1, true),
(1, 2, '2025-02-01 09:00:00+09', '2025-02-28 17:00:00+09', 2, true),
(1, 4, '2025-02-01 09:00:00+09', '2025-02-28 17:00:00+09', 3, true),
-- 特価セール
(2, 2, '2025-02-15 09:00:00+09', '2025-03-15 17:00:00+09', 1, true),
(2, 5, '2025-02-15 09:00:00+09', '2025-03-15 17:00:00+09', 2, true),
-- 春のフルーツ
(3, 6, '2025-03-01 09:00:00+09', '2025-04-30 17:00:00+09', 1, true),
(3, 7, '2025-03-01 09:00:00+09', '2025-04-30 17:00:00+09', 2, true),
-- テスト用フォーム（プリセット4）
(4, 1, '2025-02-01 09:00:00+09', '2025-03-31 17:00:00+09', 1, true),
(4, 4, '2025-02-01 09:00:00+09', '2025-03-31 17:00:00+09', 2, true),
(4, 6, '2025-02-01 09:00:00+09', '2025-03-31 17:00:00+09', 3, true);

-- サンプルピックアップウィンドウ（互換性のため）
INSERT INTO pickup_windows (preset_id, start_date, end_date, start_time, end_time, available_slots, is_available) VALUES
(1, '2025-02-01 00:00:00+09', '2025-02-28 23:59:59+09', '09:00', '17:00', 10, true),
(2, '2025-02-15 00:00:00+09', '2025-03-15 23:59:59+09', '09:00', '17:00', 10, true),
(3, '2025-03-01 00:00:00+09', '2025-04-30 23:59:59+09', '09:00', '17:00', 10, true),
(4, '2025-02-01 00:00:00+09', '2025-03-31 23:59:59+09', '09:00', '17:00', 10, true);

-- ===== 実行完了 =====
SELECT 'データベース再構築が完了しました' as status;