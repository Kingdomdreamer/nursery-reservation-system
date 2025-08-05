-- =====================================
-- ベジライス予約システム - DB再構築スクリプト（商品テーブル以外）
-- =====================================
-- 注意: このスクリプトは商品テーブル以外のデータを削除・再構築します
-- 商品データは保持されます

-- 関連テーブルのデータを削除（外部キー制約を考慮した順序）
-- 1. 予約関連データを削除
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;

-- 2. フォーム設定とピックアップ関連を削除
DROP TABLE IF EXISTS pickup_windows CASCADE;
DROP TABLE IF EXISTS form_settings CASCADE;

-- 3. プリセット関連を削除（商品との中間テーブルも含む）
DROP TABLE IF EXISTS preset_products CASCADE;
DROP TABLE IF EXISTS product_presets CASCADE;

-- =====================================
-- テーブル再作成
-- =====================================

-- 1. プリセット管理テーブル
CREATE TABLE product_presets (
    id SERIAL PRIMARY KEY,
    preset_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. プリセット商品関連テーブル
CREATE TABLE preset_products (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER NOT NULL REFERENCES product_presets(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(preset_id, product_id)
);

-- 3. フォーム設定テーブル
CREATE TABLE form_settings (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER NOT NULL REFERENCES product_presets(id) ON DELETE CASCADE,
    show_price BOOLEAN DEFAULT true,
    require_phone BOOLEAN DEFAULT true,
    require_furigana BOOLEAN DEFAULT true,
    allow_note BOOLEAN DEFAULT true,
    is_enabled BOOLEAN DEFAULT true,
    custom_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(preset_id)
);

-- 4. 引き取り時間帯テーブル
CREATE TABLE pickup_windows (
    id TEXT PRIMARY KEY, -- デフォルト値でUUID生成する場合はUUIDを使用
    preset_id INTEGER NOT NULL REFERENCES product_presets(id) ON DELETE CASCADE,
    pickup_start TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 予約テーブル
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER NOT NULL REFERENCES product_presets(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    pickup_date TIMESTAMP WITH TIME ZONE NOT NULL,
    products JSONB NOT NULL,
    line_user_id TEXT,
    total_amount INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'confirmed',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 通知ログテーブル
CREATE TABLE notification_logs (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    recipient TEXT NOT NULL,
    message_content TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- インデックス作成
-- =====================================

-- プリセット関連
CREATE INDEX idx_preset_products_preset_id ON preset_products(preset_id);
CREATE INDEX idx_preset_products_product_id ON preset_products(product_id);
CREATE INDEX idx_preset_products_active ON preset_products(is_active);

-- フォーム設定
CREATE INDEX idx_form_settings_preset_id ON form_settings(preset_id);
CREATE INDEX idx_form_settings_enabled ON form_settings(is_enabled);

-- ピックアップ時間
CREATE INDEX idx_pickup_windows_preset_id ON pickup_windows(preset_id);
CREATE INDEX idx_pickup_windows_datetime ON pickup_windows(pickup_start, pickup_end);

-- 予約関連
CREATE INDEX idx_reservations_preset_id ON reservations(preset_id);
CREATE INDEX idx_reservations_pickup_date ON reservations(pickup_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_line_user_id ON reservations(line_user_id);
CREATE INDEX idx_reservations_created_at ON reservations(created_at);

-- 通知ログ
CREATE INDEX idx_notification_logs_reservation_id ON notification_logs(reservation_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);

-- =====================================
-- RLSポリシー（必要に応じて）
-- =====================================

-- 各テーブルでRLSを有効化（Supabaseの場合）
-- ALTER TABLE product_presets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE preset_products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE form_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pickup_windows ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 基本的な読み取りポリシー（必要に応じて調整）
-- CREATE POLICY "Anyone can read presets" ON product_presets FOR SELECT USING (true);
-- CREATE POLICY "Anyone can read preset_products" ON preset_products FOR SELECT USING (is_active = true);
-- CREATE POLICY "Anyone can read form_settings" ON form_settings FOR SELECT USING (is_enabled = true);
-- CREATE POLICY "Anyone can read pickup_windows" ON pickup_windows FOR SELECT USING (true);

-- =====================================
-- サンプルデータ（オプション）
-- =====================================

-- 基本プリセットの作成
INSERT INTO product_presets (preset_name, description) VALUES 
('野菜セット予約', '新鮮な野菜セットの予約フォーム'),
('果物セット予約', '季節の果物セットの予約フォーム'),
('お米セット予約', '厳選お米の予約フォーム');

-- フォーム設定のデフォルト値
INSERT INTO form_settings (preset_id, show_price, require_phone, require_furigana, allow_note, is_enabled)
SELECT id, true, true, true, true, true 
FROM product_presets;

-- ピックアップ時間のサンプル（2025年8月10日の例）
INSERT INTO pickup_windows (id, preset_id, pickup_start, pickup_end)
SELECT 
    'default-' || id || '-morning',
    id,
    '2025-08-10T09:00:00+09:00',
    '2025-08-10T12:00:00+09:00'
FROM product_presets
UNION ALL
SELECT 
    'default-' || id || '-afternoon',
    id,
    '2025-08-10T13:00:00+09:00',
    '2025-08-10T17:00:00+09:00'
FROM product_presets;

-- =====================================
-- 完了メッセージ
-- =====================================
SELECT 'DB再構築完了: 商品テーブル以外のデータが初期化されました' AS result;