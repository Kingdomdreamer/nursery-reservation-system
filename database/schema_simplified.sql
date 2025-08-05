-- =====================================
-- 簡素化されたデータベーススキーマ
-- 仕様設計問題分析_改善指示書.md に基づく改善版
-- =====================================

-- 1. 商品マスタ（簡素化）
CREATE TABLE IF NOT EXISTS products_new (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category_id INTEGER,
    price INTEGER NOT NULL,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. プリセット商品（明確化）
CREATE TABLE IF NOT EXISTS preset_products_new (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER NOT NULL REFERENCES product_presets(id),
    product_id INTEGER NOT NULL REFERENCES products_new(id),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(preset_id, product_id)
);

-- 3. 引き取り日程（分離）
CREATE TABLE IF NOT EXISTS pickup_schedules (
    id SERIAL PRIMARY KEY,
    preset_id INTEGER NOT NULL REFERENCES product_presets(id),
    pickup_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_products_new_category ON products_new(category_id);
CREATE INDEX IF NOT EXISTS idx_products_new_visible ON products_new(visible);
CREATE INDEX IF NOT EXISTS idx_preset_products_new_preset ON preset_products_new(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_products_new_product ON preset_products_new(product_id);
CREATE INDEX IF NOT EXISTS idx_preset_products_new_active ON preset_products_new(is_active);
CREATE INDEX IF NOT EXISTS idx_pickup_schedules_preset ON pickup_schedules(preset_id);
CREATE INDEX IF NOT EXISTS idx_pickup_schedules_date ON pickup_schedules(pickup_date);
CREATE INDEX IF NOT EXISTS idx_pickup_schedules_available ON pickup_schedules(is_available);

-- コメント追加
COMMENT ON TABLE products_new IS '商品マスターテーブル（簡素化版）';
COMMENT ON TABLE preset_products_new IS 'プリセット-商品関連付けテーブル（改善版）';
COMMENT ON TABLE pickup_schedules IS '引き取り日程テーブル（pickup_windowsから分離）';

COMMENT ON COLUMN products_new.visible IS '商品の表示/非表示フラグ';
COMMENT ON COLUMN preset_products_new.display_order IS 'プリセット内での表示順序';
COMMENT ON COLUMN preset_products_new.is_active IS 'プリセット商品の有効/無効フラグ';
COMMENT ON COLUMN pickup_schedules.is_available IS '引き取り日程の利用可能フラグ';