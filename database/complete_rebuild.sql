-- =====================================
-- 完全データベース再構築スクリプト
-- ベジライス予約システム
-- =====================================

-- ⚠️  警告: このスクリプトは既存のデータベースを完全に削除します！
-- 実行前に必要なデータのバックアップを取得してください。

BEGIN;

-- =====================================
-- ステップ1: 既存のビューを削除
-- =====================================
DROP VIEW IF EXISTS rls_policies_status CASCADE;

-- =====================================
-- ステップ2: 既存の関数を削除
-- =====================================
DROP FUNCTION IF EXISTS get_current_user_id() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS check_user_reservation_limit(TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_table_columns(TEXT) CASCADE;

-- =====================================
-- ステップ3: 既存のポリシーを削除（テーブル削除前）
-- =====================================
-- product_presets ポリシー
DROP POLICY IF EXISTS "product_presets_select_all" ON product_presets;
DROP POLICY IF EXISTS "product_presets_admin_all" ON product_presets;
DROP POLICY IF EXISTS "anonymous_read_public_data" ON product_presets;

-- products ポリシー
DROP POLICY IF EXISTS "products_select_visible" ON products;
DROP POLICY IF EXISTS "products_admin_all" ON products;
DROP POLICY IF EXISTS "anonymous_read_products" ON products;

-- form_settings ポリシー
DROP POLICY IF EXISTS "form_settings_select_enabled" ON form_settings;
DROP POLICY IF EXISTS "form_settings_admin_all" ON form_settings;
DROP POLICY IF EXISTS "anonymous_read_form_settings" ON form_settings;

-- preset_products ポリシー
DROP POLICY IF EXISTS "preset_products_select_active" ON preset_products;
DROP POLICY IF EXISTS "preset_products_admin_all" ON preset_products;
DROP POLICY IF EXISTS "anonymous_read_preset_products" ON preset_products;

-- pickup_windows ポリシー
DROP POLICY IF EXISTS "pickup_windows_select_all" ON pickup_windows;
DROP POLICY IF EXISTS "pickup_windows_admin_all" ON pickup_windows;
DROP POLICY IF EXISTS "anonymous_read_pickup_windows" ON pickup_windows;

-- reservations ポリシー
DROP POLICY IF EXISTS "reservations_select_own" ON reservations;
DROP POLICY IF EXISTS "reservations_insert_authenticated" ON reservations;
DROP POLICY IF EXISTS "reservations_update_own" ON reservations;
DROP POLICY IF EXISTS "reservations_delete_admin" ON reservations;
DROP POLICY IF EXISTS "reservations_liff_access" ON reservations;

-- notification_logs ポリシー
DROP POLICY IF EXISTS "notification_logs_select_own" ON notification_logs;
DROP POLICY IF EXISTS "notification_logs_insert_system" ON notification_logs;
DROP POLICY IF EXISTS "notification_logs_liff_access" ON notification_logs;

-- =====================================
-- ステップ4: 既存のテーブルを削除（依存関係を考慮した順序）
-- =====================================
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS pickup_windows CASCADE;
DROP TABLE IF EXISTS preset_products CASCADE;
DROP TABLE IF EXISTS form_settings CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_presets CASCADE;

-- =====================================
-- ステップ5: 既存のシーケンスを削除
-- =====================================
DROP SEQUENCE IF EXISTS product_presets_id_seq CASCADE;
DROP SEQUENCE IF EXISTS products_id_seq CASCADE;
DROP SEQUENCE IF EXISTS form_settings_id_seq CASCADE;
DROP SEQUENCE IF EXISTS preset_products_id_seq CASCADE;
DROP SEQUENCE IF EXISTS pickup_windows_id_seq CASCADE;

-- =====================================
-- ステップ6: 既存の型を削除
-- =====================================
DROP TYPE IF EXISTS reservation_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

SELECT 'データベースのクリーンアップが完了しました' as cleanup_status;

-- =====================================
-- 1. プリセット管理テーブル
-- =====================================
CREATE TABLE product_presets (
    id SERIAL PRIMARY KEY,
    preset_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 2. 商品マスターテーブル
-- =====================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    external_id TEXT,
    category_id INTEGER,
    price INTEGER DEFAULT 0,
    
    -- 商品バリエーション管理
    base_product_name TEXT,
    variation_name TEXT,
    variation_type VARCHAR(20) DEFAULT 'price',
    
    -- POS システム連携
    product_code TEXT,
    barcode TEXT,
    auto_barcode BOOLEAN DEFAULT false,
    
    -- 税金・価格設定
    tax_type VARCHAR(20) DEFAULT 'exclusive',
    tax_rate DECIMAL(5,2) DEFAULT 10.00,
    price_type VARCHAR(20) DEFAULT 'fixed',
    price2 INTEGER,
    cost_price INTEGER,
    
    -- 販売・表示設定
    unit_id INTEGER,
    unit_type VARCHAR(10) DEFAULT 'piece',
    unit_weight DECIMAL(8,2),
    point_eligible BOOLEAN DEFAULT true,
    visible BOOLEAN DEFAULT true,
    receipt_print BOOLEAN DEFAULT true,
    
    -- 追加フィールド
    receipt_name TEXT,
    input_name TEXT,
    memo TEXT,
    old_product_code TEXT,
    analysis_tag_id INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 3. フォーム設定テーブル（実際のスキーマに合わせて調整）
-- =====================================
CREATE TABLE form_settings (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER NOT NULL,
    show_price BOOLEAN DEFAULT true,
    require_phone BOOLEAN DEFAULT true,
    require_furigana BOOLEAN DEFAULT true,
    allow_note BOOLEAN DEFAULT true,
    is_enabled BOOLEAN DEFAULT true,
    custom_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_form_settings_preset 
        FOREIGN KEY (preset_id) REFERENCES product_presets(id) ON DELETE CASCADE
);

-- =====================================
-- 4. プリセット-商品関連付けテーブル
-- =====================================
CREATE TABLE preset_products (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_preset_products_preset 
        FOREIGN KEY (preset_id) REFERENCES product_presets(id) ON DELETE CASCADE,
    CONSTRAINT fk_preset_products_product 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT unique_preset_product 
        UNIQUE(preset_id, product_id)
);

-- =====================================
-- 5. 受け取り期間テーブル
-- =====================================
CREATE TABLE pickup_windows (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    preset_id INTEGER,
    pickup_start TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_end TIMESTAMP WITH TIME ZONE NOT NULL,
    dates TEXT[] DEFAULT '{}',
    price INTEGER,
    comment TEXT,
    variation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_pickup_windows_product 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_pickup_windows_preset 
        FOREIGN KEY (preset_id) REFERENCES product_presets(id) ON DELETE CASCADE
);

-- =====================================
-- 6. 予約テーブル
-- =====================================
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 顧客情報
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    furigana TEXT,
    phone_number TEXT NOT NULL,
    zip TEXT,
    address TEXT,
    
    -- 注文情報
    product_preset_id INTEGER NOT NULL,
    product TEXT[] DEFAULT '{}',
    product_category TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price INTEGER DEFAULT 0,
    total_amount INTEGER DEFAULT 0,
    pickup_date TIMESTAMP WITH TIME ZONE,
    variation TEXT,
    comment TEXT,
    note TEXT,
    
    -- システム情報
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_reservations_preset 
        FOREIGN KEY (product_preset_id) REFERENCES product_presets(id) ON DELETE CASCADE
);

-- =====================================
-- 7. 通知ログテーブル
-- =====================================
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    message JSONB,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- RLS（Row Level Security）設定
-- =====================================

-- 全テーブルでRLSを有効化
ALTER TABLE product_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー（認証不要）
CREATE POLICY "product_presets_select_all" ON product_presets
    FOR SELECT USING (true);

CREATE POLICY "products_select_visible" ON products
    FOR SELECT USING (visible = true);

CREATE POLICY "form_settings_select_enabled" ON form_settings
    FOR SELECT USING (is_enabled = true);

CREATE POLICY "preset_products_select_active" ON preset_products
    FOR SELECT USING (is_active = true);

CREATE POLICY "pickup_windows_select_all" ON pickup_windows
    FOR SELECT USING (true);

-- 匿名アクセス用ポリシー
CREATE POLICY "anonymous_read_public_data" ON product_presets
    FOR SELECT TO anon USING (true);

CREATE POLICY "anonymous_read_products" ON products
    FOR SELECT TO anon USING (visible = true);

CREATE POLICY "anonymous_read_form_settings" ON form_settings
    FOR SELECT TO anon USING (is_enabled = true);

CREATE POLICY "anonymous_read_preset_products" ON preset_products
    FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "anonymous_read_pickup_windows" ON pickup_windows
    FOR SELECT TO anon USING (true);

-- 予約データ: LIFF環境用ポリシー（開発・本番環境）
CREATE POLICY "reservations_liff_access" ON reservations
    FOR ALL USING (true);

CREATE POLICY "notification_logs_liff_access" ON notification_logs
    FOR INSERT WITH CHECK (true);

-- =====================================
-- サンプルデータ挿入
-- =====================================

-- プリセット作成
INSERT INTO product_presets (id, preset_name, description) VALUES 
(6, 'たまねぎ', 'たまねぎ苗の予約セット')
ON CONFLICT (id) DO UPDATE SET
preset_name = EXCLUDED.preset_name,
description = EXCLUDED.description,
updated_at = NOW();

-- 商品作成（既存データと重複しないよう、高いIDを使用）
INSERT INTO products (id, name, category_id, price, visible, receipt_name) VALUES 
(3991, '極早生タマネギ苗　ハイパーリニア　50本', 48, 398, true, '極早生タマネギ苗　ハイパーリニア　50本'),
(3992, '極早生タマネギ苗　ハイパーリニア　50本', 48, 398, true, '極早生タマネギ苗　ハイパーリニア　50本'),
(3995, '中生タマネギ苗　OK黄　100本', 48, 598, true, '中生タマネギ苗　OK黄　100本')
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
price = EXCLUDED.price,
visible = EXCLUDED.visible,
updated_at = NOW();

-- フォーム設定作成
INSERT INTO form_settings (preset_id, show_price, require_phone, require_furigana, allow_note, is_enabled) VALUES 
(6, true, true, true, true, true)
ON CONFLICT DO NOTHING;

-- プリセット商品関連付け
INSERT INTO preset_products (preset_id, product_id, display_order, is_active) VALUES 
(6, 3991, 1, true),
(6, 3992, 2, true),
(6, 3995, 3, true)
ON CONFLICT (preset_id, product_id) DO UPDATE SET
display_order = EXCLUDED.display_order,
is_active = EXCLUDED.is_active,
updated_at = NOW();

-- 受け取り期間設定
INSERT INTO pickup_windows (preset_id, pickup_start, pickup_end, comment) VALUES 
(6, '2025-08-10T09:00:00.000Z', '2025-08-10T12:00:00.000Z', '午前中の受け取り'),
(6, '2025-08-10T13:00:00.000Z', '2025-08-10T17:00:00.000Z', '午後の受け取り'),
(6, '2025-08-11T09:00:00.000Z', '2025-08-11T12:00:00.000Z', '翌日午前の受け取り'),
(6, '2025-08-11T13:00:00.000Z', '2025-08-11T17:00:00.000Z', '翌日午後の受け取り')
ON CONFLICT DO NOTHING;

-- =====================================
-- 完了メッセージ
-- =====================================

COMMIT;

SELECT 'データベースの完全再構築が完了しました' as status;
SELECT 'プリセット6（たまねぎ）の設定が完了しました' as preset_status;

-- 確認クエリ
SELECT 
    pp.id as preset_id,
    pp.preset_name,
    COUNT(DISTINCT pr.product_id) as product_count,
    COUNT(DISTINCT fs.id) as form_settings_count,
    COUNT(DISTINCT pw.id) as pickup_windows_count
FROM product_presets pp
LEFT JOIN preset_products pr ON pp.id = pr.preset_id AND pr.is_active = true
LEFT JOIN form_settings fs ON pp.id = fs.preset_id AND fs.is_enabled = true
LEFT JOIN pickup_windows pw ON pp.id = pw.preset_id
WHERE pp.id = 6
GROUP BY pp.id, pp.preset_name;

-- =====================================
-- 実行手順
-- =====================================
-- 1. Supabaseダッシュボードにログイン
-- 2. SQL Editor に移動
-- 3. このスクリプト全体をコピー＆ペースト
-- 4. 「Run」ボタンを押して実行
-- 5. エラーがないことを確認
-- 6. 最後の確認クエリの結果をチェック
--    - preset_id: 6
--    - preset_name: たまねぎ
--    - product_count: 3
--    - form_settings_count: 1
--    - pickup_windows_count: 4
-- =====================================