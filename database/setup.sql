-- LINE LIFF Reservation System Database Setup
-- This file contains all the SQL commands to set up the database structure

-- 1. 商品プリセットテーブル
CREATE TABLE IF NOT EXISTS product_presets (
    id SERIAL PRIMARY KEY,
    preset_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 商品マスタテーブル
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    external_id TEXT,
    category_id INTEGER,
    price INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. フォーム設定テーブル
CREATE TABLE IF NOT EXISTS form_settings (
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
CREATE TABLE IF NOT EXISTS pickup_windows (
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
CREATE TABLE IF NOT EXISTS reservations (
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
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    message JSONB,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
-- 予約テーブルの検索パフォーマンス向上
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_pickup_date ON reservations(pickup_date);
CREATE INDEX IF NOT EXISTS idx_reservations_product_preset_id ON reservations(product_preset_id);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);

-- 通知ログテーブルの検索パフォーマンス向上
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- 引き取り可能期間テーブルの検索パフォーマンス向上
CREATE INDEX IF NOT EXISTS idx_pickup_windows_product_id ON pickup_windows(product_id);
CREATE INDEX IF NOT EXISTS idx_pickup_windows_preset_id ON pickup_windows(preset_id);
CREATE INDEX IF NOT EXISTS idx_pickup_windows_pickup_start ON pickup_windows(pickup_start);
CREATE INDEX IF NOT EXISTS idx_pickup_windows_pickup_end ON pickup_windows(pickup_end);

-- RLS (Row Level Security) の有効化
ALTER TABLE product_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの削除（既存のものがあれば）
DROP POLICY IF EXISTS "Enable read access for all users" ON product_presets;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON form_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON pickup_windows;
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can insert own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can delete own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view own notification logs" ON notification_logs;
DROP POLICY IF EXISTS "System can insert notification logs" ON notification_logs;
DROP POLICY IF EXISTS "Admin full access to reservations" ON reservations;

-- RLSポリシーの作成（基本的な読み取り許可）
CREATE POLICY "Enable read access for all users" ON product_presets FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON form_settings FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON pickup_windows FOR SELECT USING (true);

-- 予約テーブルのRLSポリシー（全ユーザーが読み書き可能 - LIFF環境での制限）
CREATE POLICY "Enable all access for reservations" ON reservations FOR ALL USING (true);

-- 通知ログテーブルのRLSポリシー
CREATE POLICY "Enable all access for notification logs" ON notification_logs FOR ALL USING (true);

-- 更新日時の自動更新用トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルに更新日時の自動更新トリガーを設定
DROP TRIGGER IF EXISTS update_product_presets_updated_at ON product_presets;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_form_settings_updated_at ON form_settings;
DROP TRIGGER IF EXISTS update_pickup_windows_updated_at ON pickup_windows;
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;

CREATE TRIGGER update_product_presets_updated_at BEFORE UPDATE ON product_presets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_settings_updated_at BEFORE UPDATE ON form_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pickup_windows_updated_at BEFORE UPDATE ON pickup_windows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータの削除（既存のものがあれば）
DELETE FROM pickup_windows;
DELETE FROM form_settings;
DELETE FROM products;
DELETE FROM product_presets;

-- サンプルデータの挿入
INSERT INTO product_presets (preset_name) VALUES 
('野菜セット'),
('果物セット'),
('お米セット');

INSERT INTO products (name, external_id, category_id, price) VALUES 
('野菜セットA', 'VEG001', 1, 1000),
('野菜セットB', 'VEG002', 1, 1500),
('野菜セットC', 'VEG003', 1, 2000),
('果物セット小', 'FRUIT001', 2, 1500),
('果物セット大', 'FRUIT002', 2, 2500),
('お米5kg', 'RICE001', 3, 3000),
('お米10kg', 'RICE002', 3, 5000);

INSERT INTO form_settings (preset_id, show_price, require_address, enable_gender, enable_birthday, enable_furigana, is_enabled) VALUES 
(1, true, true, false, false, true, true),
(2, true, false, false, false, false, true),
(3, true, true, true, true, true, true);

INSERT INTO pickup_windows (product_id, pickup_start, pickup_end, preset_id, dates) VALUES 
(1, '2025-07-25 10:00:00+09', '2025-07-25 18:00:00+09', 1, ARRAY['2025-07-25', '2025-07-26', '2025-07-27']),
(2, '2025-07-25 10:00:00+09', '2025-07-25 18:00:00+09', 1, ARRAY['2025-07-25', '2025-07-26', '2025-07-27']),
(3, '2025-07-25 10:00:00+09', '2025-07-25 18:00:00+09', 1, ARRAY['2025-07-25', '2025-07-26', '2025-07-27']),
(4, '2025-07-26 10:00:00+09', '2025-07-26 18:00:00+09', 2, ARRAY['2025-07-26', '2025-07-27', '2025-07-28']),
(5, '2025-07-26 10:00:00+09', '2025-07-26 18:00:00+09', 2, ARRAY['2025-07-26', '2025-07-27', '2025-07-28']),
(6, '2025-07-27 10:00:00+09', '2025-07-27 18:00:00+09', 3, ARRAY['2025-07-27', '2025-07-28', '2025-07-29']),
(7, '2025-07-27 10:00:00+09', '2025-07-27 18:00:00+09', 3, ARRAY['2025-07-27', '2025-07-28', '2025-07-29']);