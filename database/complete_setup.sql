-- =====================================================
-- 🌱 保育園・種苗店予約システム - 完全データベース構築SQL
-- =====================================================
-- 作成日: 2025年7月19日
-- バージョン: v1.4.0
-- 対象: Supabase PostgreSQL
-- =====================================================

-- 1. 既存テーブルの削除（依存関係順）
-- =====================================================

-- 子テーブルから順に削除
DROP TABLE IF EXISTS export_history CASCADE;
DROP TABLE IF EXISTS line_templates CASCADE;
DROP TABLE IF EXISTS pricing_display_settings CASCADE;
DROP TABLE IF EXISTS form_display_settings CASCADE;
DROP TABLE IF EXISTS form_products CASCADE;
DROP TABLE IF EXISTS form_fields CASCADE;
DROP TABLE IF EXISTS form_configurations CASCADE;
DROP TABLE IF EXISTS forms CASCADE;
DROP TABLE IF EXISTS reservation_items CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- 2. 拡張機能の有効化
-- =====================================================

-- UUID生成のための拡張機能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 全文検索のための拡張機能（オプション）
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 3. カスタム型の定義
-- =====================================================

-- 予約ステータス
CREATE TYPE reservation_status AS ENUM (
    'pending',      -- 保留中
    'confirmed',    -- 確定
    'ready',        -- 準備完了
    'completed',    -- 完了
    'cancelled'     -- キャンセル
);

-- 支払いステータス
CREATE TYPE payment_status AS ENUM (
    'unpaid',       -- 未払い
    'paid',         -- 支払い済み
    'partial',      -- 一部支払い
    'refunded'      -- 返金済み
);

-- 通知タイプ
CREATE TYPE notification_type AS ENUM (
    'reservation_created',      -- 予約作成
    'reservation_confirmed',    -- 予約確定
    'reservation_cancelled',    -- 予約キャンセル
    'system_update',           -- システム更新
    'maintenance',             -- メンテナンス
    'reminder'                 -- リマインダー
);

-- 通知優先度
CREATE TYPE notification_priority AS ENUM (
    'low',          -- 低
    'normal',       -- 通常
    'high',         -- 高
    'urgent'        -- 緊急
);

-- ユーザー役割
CREATE TYPE user_role AS ENUM (
    'admin',        -- 管理者
    'staff',        -- スタッフ
    'manager'       -- マネージャー
);

-- エクスポートステータス
CREATE TYPE export_status AS ENUM (
    'pending',      -- 保留中
    'processing',   -- 処理中
    'completed',    -- 完了
    'failed'        -- 失敗
);

-- 4. 基本テーブルの作成
-- =====================================================

-- 4.1 商品カテゴリテーブル
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_sort_order CHECK (sort_order >= 0),
    CONSTRAINT no_self_reference CHECK (id != parent_id)
);

-- 4.2 顧客テーブル
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    postal_code VARCHAR(8),
    address TEXT,
    line_user_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_phone CHECK (phone ~ '^[0-9-+()\\s]+$'),
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_postal_code CHECK (postal_code IS NULL OR postal_code ~ '^[0-9]{3}-[0-9]{4}$')
);

-- 4.3 商品テーブル
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_price CHECK (price >= 0),
    CONSTRAINT valid_min_quantity CHECK (min_order_quantity >= 1),
    CONSTRAINT valid_max_quantity CHECK (max_order_quantity IS NULL OR max_order_quantity >= min_order_quantity),
    CONSTRAINT valid_tax_type CHECK (tax_type IN ('inclusive', 'exclusive')),
    CONSTRAINT valid_display_order CHECK (display_order >= 0)
);

-- 4.4 ユーザープロファイルテーブル
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'admin',
    full_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(15),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT unique_user_id UNIQUE (user_id),
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
);

-- 5. 予約関連テーブル
-- =====================================================

-- 5.1 予約テーブル
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    reservation_date DATE NOT NULL,
    pickup_time_start TIME NOT NULL,
    pickup_time_end TIME NOT NULL,
    status reservation_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'unpaid',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    admin_notes TEXT,
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_amounts CHECK (
        total_amount >= 0 AND 
        discount_amount >= 0 AND 
        final_amount >= 0 AND
        final_amount = total_amount - discount_amount
    ),
    CONSTRAINT valid_pickup_time CHECK (pickup_time_end > pickup_time_start),
    CONSTRAINT valid_reservation_date CHECK (reservation_date >= CURRENT_DATE),
    CONSTRAINT valid_reservation_number CHECK (reservation_number ~ '^RES-[0-9]{8}-[0-9]{4}$')
);

-- 5.2 予約商品テーブル
CREATE TABLE reservation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    pickup_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_quantity CHECK (quantity > 0),
    CONSTRAINT valid_unit_price CHECK (unit_price >= 0),
    CONSTRAINT valid_subtotal CHECK (subtotal >= 0),
    CONSTRAINT calculated_subtotal CHECK (subtotal = quantity * unit_price)
);

-- 6. フォーム関連テーブル
-- =====================================================

-- 6.1 フォームテーブル
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_validity_period CHECK (
        (valid_from IS NULL AND valid_to IS NULL) OR
        (valid_from IS NOT NULL AND valid_to IS NOT NULL AND valid_to > valid_from)
    )
);

-- 6.2 フォーム設定テーブル
CREATE TABLE form_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_version CHECK (version >= 1),
    CONSTRAINT valid_form_fields CHECK (jsonb_typeof(form_fields) = 'array'),
    CONSTRAINT valid_settings CHECK (jsonb_typeof(settings) = 'object')
);

-- 6.3 フォームフィールドテーブル
CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    field_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(200) NOT NULL,
    field_options JSONB DEFAULT '[]',
    is_required BOOLEAN DEFAULT false,
    validation_rules JSONB DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_field_type CHECK (field_type IN (
        'text', 'email', 'phone', 'number', 'date', 'time', 'datetime',
        'select', 'radio', 'checkbox', 'textarea', 'file', 'hidden'
    )),
    CONSTRAINT valid_display_order CHECK (display_order >= 0),
    CONSTRAINT unique_field_name_per_form UNIQUE (form_id, field_name)
);

-- 6.4 フォーム商品関連テーブル
CREATE TABLE form_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    max_quantity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_display_order CHECK (display_order >= 0),
    CONSTRAINT valid_max_quantity CHECK (max_quantity IS NULL OR max_quantity > 0),
    CONSTRAINT unique_form_product UNIQUE (form_id, product_id)
);

-- 6.5 フォーム表示設定テーブル
CREATE TABLE form_display_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    show_prices BOOLEAN DEFAULT true,
    price_display_mode VARCHAR(20) DEFAULT 'full',
    show_categories BOOLEAN DEFAULT true,
    show_descriptions BOOLEAN DEFAULT true,
    custom_css TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_price_display_mode CHECK (price_display_mode IN ('full', 'summary', 'hidden', 'custom')),
    CONSTRAINT unique_form_display_settings UNIQUE (form_id)
);

-- 6.6 価格表示設定テーブル
CREATE TABLE pricing_display_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    show_item_prices BOOLEAN DEFAULT true,
    show_subtotals BOOLEAN DEFAULT true,
    show_total BOOLEAN DEFAULT true,
    show_tax_breakdown BOOLEAN DEFAULT false,
    price_format VARCHAR(20) DEFAULT 'currency',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_price_format CHECK (price_format IN ('currency', 'number', 'custom')),
    CONSTRAINT unique_form_pricing_settings UNIQUE (form_id)
);

-- 7. システム管理テーブル
-- =====================================================

-- 7.1 通知テーブル
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    priority notification_priority DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_action_url CHECK (action_url IS NULL OR action_url ~ '^https?://')
);

-- 7.2 システム設定テーブル
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT unique_setting UNIQUE (category, key),
    CONSTRAINT valid_value CHECK (jsonb_typeof(value) = 'object')
);

-- 7.3 LINEテンプレートテーブル
CREATE TABLE line_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_type VARCHAR(50) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    template_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_template_type CHECK (template_type IN (
        'confirmation', 'reminder', 'cancellation', 'welcome', 'custom'
    )),
    CONSTRAINT unique_template UNIQUE (template_type, template_name)
);

-- 7.4 エクスポート履歴テーブル
CREATE TABLE export_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    export_type VARCHAR(50) NOT NULL,
    exported_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    status export_status DEFAULT 'pending',
    download_url TEXT,
    exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- 制約
    CONSTRAINT valid_file_size CHECK (file_size IS NULL OR file_size >= 0),
    CONSTRAINT valid_export_type CHECK (export_type IN (
        'customers', 'products', 'reservations', 'forms', 'reports'
    )),
    CONSTRAINT valid_expiry CHECK (expires_at IS NULL OR expires_at > exported_at)
);

-- 8. インデックス作成
-- =====================================================

-- パフォーマンス最適化のためのインデックス

-- 顧客関連
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_line_user_id ON customers(line_user_id);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- 商品関連
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_name ON products USING GIN (to_tsvector('simple', name));
CREATE INDEX idx_products_price ON products(price);

-- 予約関連
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_customer ON reservations(customer_id);
CREATE INDEX idx_reservations_number ON reservations(reservation_number);
CREATE INDEX idx_reservations_pickup_time ON reservations(pickup_time_start, pickup_time_end);

-- 予約商品関連
CREATE INDEX idx_reservation_items_reservation ON reservation_items(reservation_id);
CREATE INDEX idx_reservation_items_product ON reservation_items(product_id);
CREATE INDEX idx_reservation_items_pickup_date ON reservation_items(pickup_date);

-- フォーム関連
CREATE INDEX idx_forms_active ON forms(is_active);
CREATE INDEX idx_forms_validity ON forms(valid_from, valid_to);
CREATE INDEX idx_form_fields_form ON form_fields(form_id);
CREATE INDEX idx_form_fields_type ON form_fields(field_type);

-- 通知関連
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- システム設定関連
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_active ON system_settings(is_active);

-- 9. 自動更新トリガー関数
-- =====================================================

-- updated_at自動更新のための関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにupdated_at自動更新トリガーを設定
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservation_items_updated_at BEFORE UPDATE ON reservation_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_configurations_updated_at BEFORE UPDATE ON form_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at BEFORE UPDATE ON form_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_products_updated_at BEFORE UPDATE ON form_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_display_settings_updated_at BEFORE UPDATE ON form_display_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_display_settings_updated_at BEFORE UPDATE ON pricing_display_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_line_templates_updated_at BEFORE UPDATE ON line_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Row Level Security (RLS) 設定
-- =====================================================

-- RLSを有効化
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_display_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_display_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- 管理者用ポリシー（全てのテーブルに対する全権限）
CREATE POLICY "管理者は全データにアクセス可能" ON customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager', 'staff')
            AND is_active = true
        )
    );

-- 他のテーブルにも同様のポリシーを適用
DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'products', 'product_categories', 'reservations', 'reservation_items',
        'forms', 'form_configurations', 'form_fields', 'form_products',
        'form_display_settings', 'pricing_display_settings', 'notifications',
        'system_settings', 'line_templates', 'user_profiles', 'export_history'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('
            CREATE POLICY "管理者は全データにアクセス可能" ON %I
                FOR ALL USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_id = auth.uid() 
                        AND role IN (''admin'', ''manager'', ''staff'')
                        AND is_active = true
                    )
                )
        ', table_name);
    END LOOP;
END $$;

-- 公開フォーム用ポリシー（匿名ユーザーがフォームを閲覧可能）
CREATE POLICY "公開フォーム閲覧" ON forms
    FOR SELECT USING (is_active = true AND (
        valid_from IS NULL OR valid_from <= NOW()
    ) AND (
        valid_to IS NULL OR valid_to >= NOW()
    ));

CREATE POLICY "公開フォーム設定閲覧" ON form_configurations
    FOR SELECT USING (
        is_active = true AND 
        EXISTS (
            SELECT 1 FROM forms 
            WHERE forms.id = form_configurations.form_id 
            AND forms.is_active = true
        )
    );

-- 11. 初期データ投入
-- =====================================================

-- 商品カテゴリの初期データ
INSERT INTO product_categories (id, name, description, sort_order) VALUES
    (uuid_generate_v4(), '種子', '野菜や花の種子', 1),
    (uuid_generate_v4(), '苗', 'トマト、キュウリなどの野菜の苗', 2),
    (uuid_generate_v4(), '花の苗', '季節の花や観賞用植物の苗', 3),
    (uuid_generate_v4(), 'ハーブ', '料理用ハーブや薬草の苗', 4),
    (uuid_generate_v4(), '肥料', '有機肥料、化学肥料', 5),
    (uuid_generate_v4(), '園芸用品', 'プランター、土、道具類', 6);

-- システム設定の初期データ
INSERT INTO system_settings (category, key, value, description) VALUES
    ('basic', 'site_name', '{"value": "ベジライス予約システム"}', 'サイト名'),
    ('basic', 'contact_email', '{"value": "info@vegirice.example.com"}', '連絡先メールアドレス'),
    ('basic', 'contact_phone', '{"value": "03-1234-5678"}', '連絡先電話番号'),
    ('business', 'business_hours', '{"start": "09:00", "end": "18:00"}', '営業時間'),
    ('business', 'business_days', '{"monday": true, "tuesday": true, "wednesday": false, "thursday": true, "friday": true, "saturday": true, "sunday": true}', '営業日'),
    ('business', 'reservation_advance_days', '{"value": 60}', '予約可能な先の日数'),
    ('business', 'time_slot_minutes', '{"value": 30}', '時間枠の分単位'),
    ('notification', 'email_enabled', '{"value": true}', 'メール通知有効'),
    ('notification', 'line_enabled', '{"value": true}', 'LINE通知有効'),
    ('notification', 'reminder_hours_before', '{"value": 24}', 'リマインダー送信時間（時間前）'),
    ('advanced', 'auto_confirm', '{"value": false}', '自動確定機能'),
    ('advanced', 'max_reservations_per_day', '{"value": 50}', '1日の最大予約数');

-- LINEテンプレートの初期データ
INSERT INTO line_templates (template_type, template_name, template_content) VALUES
    ('confirmation', '予約確定通知', 'ご予約が確定いたしました。\n\n予約番号: {reservation_number}\n受取日時: {pickup_datetime}\n商品: {products}\n\nお受取をお待ちしております。'),
    ('reminder', '受取リマインダー', '明日はお受取日です。\n\n予約番号: {reservation_number}\n受取日時: {pickup_datetime}\n\nお忘れなくお越しください。'),
    ('cancellation', 'キャンセル通知', 'ご予約をキャンセルいたしました。\n\n予約番号: {reservation_number}\n\nまたのご利用をお待ちしております。'),
    ('welcome', 'ウェルカムメッセージ', 'ベジライス予約システムへようこそ！\n\n商品のご予約はこちらから承っております。');

-- 12. ビュー作成
-- =====================================================

-- 予約詳細ビュー（よく使用される結合データ）
CREATE VIEW reservation_details AS
SELECT 
    r.id,
    r.reservation_number,
    r.reservation_date,
    r.pickup_time_start,
    r.pickup_time_end,
    r.status,
    r.payment_status,
    r.total_amount,
    r.final_amount,
    r.notes,
    r.created_at,
    c.full_name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    STRING_AGG(p.name, ', ') as product_names,
    SUM(ri.quantity) as total_quantity
FROM reservations r
JOIN customers c ON r.customer_id = c.id
LEFT JOIN reservation_items ri ON r.id = ri.reservation_id
LEFT JOIN products p ON ri.product_id = p.id
GROUP BY r.id, c.id;

-- 商品統計ビュー
CREATE VIEW product_statistics AS
SELECT 
    p.id,
    p.name,
    p.price,
    pc.name as category_name,
    COUNT(ri.id) as total_orders,
    COALESCE(SUM(ri.quantity), 0) as total_quantity_sold,
    COALESCE(SUM(ri.subtotal), 0) as total_revenue
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN reservation_items ri ON p.id = ri.product_id
LEFT JOIN reservations r ON ri.reservation_id = r.id AND r.status != 'cancelled'
GROUP BY p.id, pc.name;

-- 13. 関数作成
-- =====================================================

-- 予約番号生成関数
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TEXT AS $$
DECLARE
    today_str TEXT;
    sequence_num INTEGER;
    result TEXT;
BEGIN
    -- 今日の日付をYYYYMMDD形式で取得
    today_str := to_char(CURRENT_DATE, 'YYYYMMDD');
    
    -- 今日の予約数を取得して+1
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM reservations 
    WHERE reservation_number LIKE 'RES-' || today_str || '-%';
    
    -- 予約番号を生成
    result := 'RES-' || today_str || '-' || lpad(sequence_num::text, 4, '0');
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 最終金額計算関数
CREATE OR REPLACE FUNCTION calculate_final_amount(
    p_total_amount DECIMAL,
    p_discount_amount DECIMAL DEFAULT 0
)
RETURNS DECIMAL AS $$
BEGIN
    RETURN GREATEST(0, p_total_amount - p_discount_amount);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 🎉 データベース構築完了！
-- =====================================================

-- 構築結果の確認
SELECT 
    'テーブル作成完了' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- インデックス数の確認
SELECT 
    'インデックス作成完了' as status,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public';

-- 制約数の確認  
SELECT 
    '制約設定完了' as status,
    COUNT(*) as constraint_count
FROM information_schema.table_constraints 
WHERE table_schema = 'public';

COMMENT ON DATABASE postgres IS '🌱 ベジライス・保育園予約システム - 完全構築版 v1.4.0';