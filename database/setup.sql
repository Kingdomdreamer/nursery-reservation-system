-- LINE LIFF Nursery Reservation System Database Setup
-- Updated to match current implementation (2025-08-05)
-- This file contains all the SQL commands to set up the database structure

-- 1. 商品プリセットテーブル
CREATE TABLE IF NOT EXISTS product_presets (
    id SERIAL PRIMARY KEY,
    preset_name TEXT NOT NULL,
    description TEXT,
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
    
    -- バリエーション管理フィールド
    base_product_name TEXT,      -- 基本商品名（例：種粕 20kg）
    variation_name TEXT,         -- バリエーション名（例：通常価格、売出価格）
    variation_type VARCHAR(20) DEFAULT 'price', -- price, size, weight, other
    
    -- POSシステム連携フィールド
    product_code TEXT,           -- 商品コード
    barcode TEXT,               -- バーコード
    auto_barcode BOOLEAN DEFAULT false, -- 自動発番フラグ
    
    -- 税設定フィールド
    tax_type VARCHAR(20) DEFAULT 'exclusive',  -- inclusive(内税) or exclusive(外税)
    tax_rate DECIMAL(5,2) DEFAULT 10.00,      -- 税率（%）
    
    -- 価格設定フィールド
    price_type VARCHAR(20) DEFAULT 'fixed',    -- fixed(通常), department(部門打ち), weight(量り売り)
    price2 INTEGER,                           -- 税率別価格2（軽減税率用等）
    cost_price INTEGER,                       -- 原価
    
    -- 販売・表示設定
    unit_id INTEGER,                          -- 販売単位ID
    unit_type VARCHAR(10) DEFAULT 'piece',    -- piece(個), kg, g
    unit_weight DECIMAL(8,2),                 -- 単位重量
    
    -- システム設定
    point_eligible BOOLEAN DEFAULT true,      -- ポイント付与対象
    visible BOOLEAN DEFAULT true,             -- 表示/非表示
    receipt_print BOOLEAN DEFAULT true,       -- レシート印字設定
    
    -- その他
    receipt_name TEXT,                        -- レシート用商品名
    input_name TEXT,                         -- 商品入力用名称
    memo TEXT,                               -- 備考
    old_product_code TEXT,                   -- 旧商品コード
    analysis_tag_id INTEGER,                 -- 分析タグID
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. フォーム設定テーブル（現在の実装に合わせて更新）
CREATE TABLE IF NOT EXISTS form_settings (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER REFERENCES product_presets(id) ON DELETE CASCADE,
    
    -- 新しいフィールド（現在の実装で使用）
    show_price BOOLEAN DEFAULT true,
    require_phone BOOLEAN DEFAULT true,
    require_furigana BOOLEAN DEFAULT true,
    allow_note BOOLEAN DEFAULT true,
    is_enabled BOOLEAN DEFAULT true,
    custom_message TEXT,
    
    -- レガシーフィールド（互換性のため保持）
    require_address BOOLEAN DEFAULT false,
    enable_gender BOOLEAN DEFAULT false,
    enable_birthday BOOLEAN DEFAULT false,
    enable_furigana BOOLEAN DEFAULT false,
    pickup_start TIMESTAMP WITH TIME ZONE,
    pickup_end TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. プリセット商品関連テーブル
CREATE TABLE IF NOT EXISTS preset_products (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER NOT NULL REFERENCES product_presets(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(preset_id, product_id)
);

-- 5. 引き取り可能期間テーブル
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

-- 6. 予約テーブル
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
    
    -- LINEサポート用フィールド
    line_user_id TEXT,
    status VARCHAR(20) DEFAULT 'confirmed',
    products_json TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 通知ログテーブル
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
CREATE INDEX IF NOT EXISTS idx_reservations_line_user_id ON reservations(line_user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- 通知ログテーブルの検索パフォーマンス向上
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- プリセット商品関連テーブルの検索パフォーマンス向上
CREATE INDEX IF NOT EXISTS idx_preset_products_preset_id ON preset_products(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_products_product_id ON preset_products(product_id);
CREATE INDEX IF NOT EXISTS idx_preset_products_display_order ON preset_products(display_order);
CREATE INDEX IF NOT EXISTS idx_preset_products_is_active ON preset_products(is_active);

-- 引き取り可能期間テーブルの検索パフォーマンス向上
CREATE INDEX IF NOT EXISTS idx_pickup_windows_product_id ON pickup_windows(product_id);
CREATE INDEX IF NOT EXISTS idx_pickup_windows_preset_id ON pickup_windows(preset_id);
CREATE INDEX IF NOT EXISTS idx_pickup_windows_pickup_start ON pickup_windows(pickup_start);
CREATE INDEX IF NOT EXISTS idx_pickup_windows_pickup_end ON pickup_windows(pickup_end);

-- 商品テーブルの検索パフォーマンス向上
CREATE INDEX IF NOT EXISTS idx_products_visible ON products(visible);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_base_product_name ON products(base_product_name);
CREATE INDEX IF NOT EXISTS idx_products_variation_type ON products(variation_type);

-- フォーム設定テーブルの検索パフォーマンス向上
CREATE INDEX IF NOT EXISTS idx_form_settings_preset_id ON form_settings(preset_id);
CREATE INDEX IF NOT EXISTS idx_form_settings_is_enabled ON form_settings(is_enabled);

-- RLS (Row Level Security) の有効化
ALTER TABLE product_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの削除（既存のものがあれば）
DROP POLICY IF EXISTS "Enable read access for all users" ON product_presets;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON preset_products;
DROP POLICY IF EXISTS "Enable read access for all users" ON form_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON pickup_windows;
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can insert own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can delete own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view own notification logs" ON notification_logs;
DROP POLICY IF EXISTS "System can insert notification logs" ON notification_logs;
DROP POLICY IF EXISTS "Admin full access to reservations" ON reservations;
DROP POLICY IF EXISTS "Enable all access for reservations" ON reservations;
DROP POLICY IF EXISTS "Enable all access for notification logs" ON notification_logs;

-- RLSポリシーの作成（基本的な読み取り許可）
CREATE POLICY "Enable read access for all users" ON product_presets FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON preset_products FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON form_settings FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON pickup_windows FOR SELECT USING (true);

-- 予約テーブルのRLSポリシー（全ユーザーが読み書き可能 - LIFF環境での制限）
CREATE POLICY "Enable all access for reservations" ON reservations FOR ALL USING (true);

-- 通知ログテーブルのRLSポリシー
CREATE POLICY "Enable all access for notification logs" ON notification_logs FOR ALL USING (true);

-- 管理者用のフルアクセスポリシー（必要に応じて）
-- CREATE POLICY "Admin full access" ON product_presets FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
-- CREATE POLICY "Admin full access" ON products FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
-- CREATE POLICY "Admin full access" ON form_settings FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

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
DROP TRIGGER IF EXISTS update_preset_products_updated_at ON preset_products;
DROP TRIGGER IF EXISTS update_form_settings_updated_at ON form_settings;
DROP TRIGGER IF EXISTS update_pickup_windows_updated_at ON pickup_windows;
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;

CREATE TRIGGER update_product_presets_updated_at BEFORE UPDATE ON product_presets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preset_products_updated_at BEFORE UPDATE ON preset_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_settings_updated_at BEFORE UPDATE ON form_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pickup_windows_updated_at BEFORE UPDATE ON pickup_windows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータの削除（既存のものがあれば）
DELETE FROM pickup_windows;
DELETE FROM preset_products;
DELETE FROM form_settings;
DELETE FROM reservations;
DELETE FROM notification_logs;
DELETE FROM products;
DELETE FROM product_presets;

-- サンプルデータの挿入
INSERT INTO product_presets (preset_name, description) VALUES 
('野菜セット', '季節の野菜を詰め合わせた便利なセット'),
('果物セット', '新鮮な果物を詰め合わせた美味しいセット'),
('お米セット', '農園で作った美味しいお米のセット');

INSERT INTO products (
  name, external_id, category_id, price, 
  base_product_name, variation_name, variation_type,
  product_code, barcode, tax_type, tax_rate, price_type,
  point_eligible, visible, receipt_print, memo
) VALUES 
-- 種粕 20kg のバリエーション商品
('種粕 20kg（通常価格）', 'TANEKASU001', 1, 1800, '種粕 20kg', '通常価格', 'price', 
 '#2000000000619', '#2000000000619', 'exclusive', 10.00, 'fixed', true, true, true, '通常販売価格'),
('種粕 20kg（売出価格）', 'TANEKASU002', 1, 1700, '種粕 20kg', '売出価格', 'price', 
 '#2000000000077', '#2000000000077', 'exclusive', 10.00, 'fixed', true, true, true, 'セール価格'),
('種粕 20kg（予約売出価格）', 'TANEKASU003', 1, 1700, '種粕 20kg', '予約売出価格', 'price', 
 '#2000000000084', '#2000000000084', 'exclusive', 10.00, 'fixed', true, true, true, '予約専用価格'),

-- 種粕ペレット 20kg のバリエーション商品  
('種粕ペレット 20kg（通常価格）', 'PELLET001', 1, 1900, '種粕ペレット 20kg', '通常価格', 'price',
 '#2000000000053', '#2000000000053', 'exclusive', 10.00, 'fixed', true, true, true, '通常販売価格'),
('種粕ペレット 20kg（売出価格）', 'PELLET002', 1, 1800, '種粕ペレット 20kg', '売出価格', 'price',
 '#2000000001555', '#2000000001555', 'exclusive', 10.00, 'fixed', true, true, true, 'セール価格'),

-- 従来の商品（バリエーションなし）
('野菜セットA', 'VEG001', 2, 1000, '野菜セットA', null, null,
 'VEG001', null, 'exclusive', 8.00, 'fixed', true, true, true, '春の野菜を詰め合わせ'),
('果物セット', 'FRUIT001', 2, 1500, '果物セット', null, null,
 'FRUIT001', null, 'exclusive', 8.00, 'fixed', true, true, true, '季節の果物セット'),
('お米5kg', 'RICE001', 3, 2500, 'お米5kg', null, null,
 'RICE001', null, 'exclusive', 8.00, 'fixed', true, true, true, '農園のお米5kg'),
('お米10kg', 'RICE002', 3, 4800, 'お米10kg', null, null,
 'RICE002', null, 'exclusive', 8.00, 'fixed', true, true, true, '農園のお米10kg');

-- フォーム設定の挿入（新しいフィールド構造に対応）
INSERT INTO form_settings (
  preset_id, show_price, require_phone, require_furigana, allow_note, 
  is_enabled, custom_message,
  -- レガシーフィールド（互換性のため）
  require_address, enable_gender, enable_birthday, enable_furigana
) VALUES 
(1, true, true, true, true, true, '野菜セットの予約フォームです', 
 true, false, false, true),
(2, true, true, false, true, true, '果物セットの予約フォームです', 
 false, false, false, false),
(3, true, true, true, true, true, 'お米セットの予約フォームです', 
 true, true, true, true);

-- プリセット商品の関連付け
INSERT INTO preset_products (preset_id, product_id, display_order, is_active) VALUES 
-- 野菜セットプリセット（preset_id: 1）に関連商品
(1, 6, 1, true),  -- 野菜セットA
-- 果物セットプリセット（preset_id: 2）に関連商品
(2, 7, 1, true),  -- 果物セット
-- お米セットプリセット（preset_id: 3）に関連商品
(3, 8, 1, true),  -- お米5kg
(3, 9, 2, true);  -- お米10kg

-- 引き取り期間の設定
INSERT INTO pickup_windows (product_id, pickup_start, pickup_end, preset_id, dates, price, comment) VALUES 
-- 野菜セット
(6, '2025-08-10 10:00:00+09', '2025-08-10 18:00:00+09', 1, 
 ARRAY['2025-08-10', '2025-08-11', '2025-08-12'], 1000, '午前10時〜午後6時'),
-- 果物セット
(7, '2025-08-11 10:00:00+09', '2025-08-11 18:00:00+09', 2, 
 ARRAY['2025-08-11', '2025-08-12', '2025-08-13'], 1500, '午前10時〜午後6時'),
-- お米セット
(8, '2025-08-12 10:00:00+09', '2025-08-12 18:00:00+09', 3, 
 ARRAY['2025-08-12', '2025-08-13', '2025-08-14'], 2500, 'お米5kg - 午前10時〜午後6時'),
(9, '2025-08-12 10:00:00+09', '2025-08-12 18:00:00+09', 3, 
 ARRAY['2025-08-12', '2025-08-13', '2025-08-14'], 4800, 'お米10kg - 午前10時〜午後6時');

-- 統計情報の更新
ANALYZE product_presets;
ANALYZE products;
ANALYZE form_settings;
ANALYZE preset_products;
ANALYZE pickup_windows;
ANALYZE reservations;
ANALYZE notification_logs;

-- セットアップ完了メッセージ
-- SELECT 'Database setup completed successfully!' as setup_status;