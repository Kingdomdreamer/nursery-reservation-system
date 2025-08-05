-- =====================================
-- ベジライス予約システム - テーブル作成スクリプト
-- =====================================

-- 1. プリセット管理テーブル
CREATE TABLE IF NOT EXISTS product_presets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 商品マスターテーブル
CREATE TABLE IF NOT EXISTS products (
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

-- 3. フォーム設定テーブル
CREATE TABLE IF NOT EXISTS form_settings (
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

-- 4. プリセット-商品関連付けテーブル
CREATE TABLE IF NOT EXISTS preset_products (
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

-- 5. 受け取り期間テーブル
CREATE TABLE IF NOT EXISTS pickup_windows (
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

-- 6. 予約テーブル
CREATE TABLE IF NOT EXISTS reservations (
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

-- 7. 通知ログテーブル
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    message JSONB,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- コメント追加
-- =====================================

COMMENT ON TABLE product_presets IS '商品プリセット管理テーブル（野菜セット、果物セット等）';
COMMENT ON TABLE products IS '商品マスターテーブル（POS連携対応）';
COMMENT ON TABLE form_settings IS 'プリセット別フォーム設定テーブル';
COMMENT ON TABLE preset_products IS 'プリセット-商品関連付けテーブル（多対多関係）';
COMMENT ON TABLE pickup_windows IS '商品・プリセット別受け取り期間設定テーブル';
COMMENT ON TABLE reservations IS '顧客予約データテーブル';
COMMENT ON TABLE notification_logs IS 'LINE通知履歴テーブル';

-- 主要カラムのコメント
COMMENT ON COLUMN products.variation_type IS '商品バリエーション種類: price, size, weight, other';
COMMENT ON COLUMN products.tax_type IS '税込・税抜設定: inclusive, exclusive';
COMMENT ON COLUMN products.price_type IS '価格タイプ: fixed, department, weight';
COMMENT ON COLUMN products.unit_type IS '販売単位: piece, kg, g';
COMMENT ON COLUMN reservations.status IS '予約ステータス: pending, confirmed, completed, cancelled';
COMMENT ON COLUMN notification_logs.type IS '通知タイプ: confirmation, reminder, cancellation';