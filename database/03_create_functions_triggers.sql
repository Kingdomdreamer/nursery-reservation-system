-- =====================================
-- ベジライス予約システム - 関数・トリガー作成スクリプト
-- =====================================

-- =====================================
-- 共通関数
-- =====================================

-- updated_at 自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- UUID生成関数（互換性用）
CREATE OR REPLACE FUNCTION generate_uuid()
RETURNS UUID AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ language 'plpgsql';

-- =====================================
-- 自動更新トリガー
-- =====================================

-- product_presets テーブル
DROP TRIGGER IF EXISTS update_product_presets_updated_at ON product_presets;
CREATE TRIGGER update_product_presets_updated_at
    BEFORE UPDATE ON product_presets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- products テーブル
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- form_settings テーブル
DROP TRIGGER IF EXISTS update_form_settings_updated_at ON form_settings;
CREATE TRIGGER update_form_settings_updated_at
    BEFORE UPDATE ON form_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- preset_products テーブル
DROP TRIGGER IF EXISTS update_preset_products_updated_at ON preset_products;
CREATE TRIGGER update_preset_products_updated_at
    BEFORE UPDATE ON preset_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- pickup_windows テーブル
DROP TRIGGER IF EXISTS update_pickup_windows_updated_at ON pickup_windows;
CREATE TRIGGER update_pickup_windows_updated_at
    BEFORE UPDATE ON pickup_windows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- reservations テーブル
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- バリデーション関数
-- =====================================

-- 電話番号バリデーション関数
CREATE OR REPLACE FUNCTION validate_phone_number(phone_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- 日本の電話番号形式をチェック
    RETURN phone_number ~ '^(0\d{1,4}-\d{1,4}-\d{3,4}|\d{10,11})$';
END;
$$ language 'plpgsql';

-- 郵便番号バリデーション関数
CREATE OR REPLACE FUNCTION validate_zip_code(zip_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- 日本の郵便番号形式をチェック（123-4567 or 1234567）
    RETURN zip_code ~ '^(\d{3}-\d{4}|\d{7})$';
END;
$$ language 'plpgsql';

-- 価格バリデーション関数
CREATE OR REPLACE FUNCTION validate_price(price INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- 価格は0以上999999999以下
    RETURN price >= 0 AND price <= 999999999;
END;
$$ language 'plpgsql';

-- =====================================
-- ビジネスロジック関数
-- =====================================

-- 商品の税込価格計算関数
CREATE OR REPLACE FUNCTION calculate_tax_included_price(
    base_price INTEGER,
    tax_rate DECIMAL(5,2) DEFAULT 10.00,
    tax_type VARCHAR(20) DEFAULT 'exclusive'
)
RETURNS INTEGER AS $$
BEGIN
    IF tax_type = 'inclusive' THEN
        RETURN base_price;
    ELSE
        RETURN FLOOR(base_price * (1 + tax_rate / 100));
    END IF;
END;
$$ language 'plpgsql';

-- 予約の合計金額計算関数
CREATE OR REPLACE FUNCTION calculate_reservation_total(
    reservation_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    total INTEGER := 0;
BEGIN
    SELECT COALESCE(total_amount, 0) INTO total
    FROM reservations 
    WHERE id = reservation_id;
    
    RETURN total;
END;
$$ language 'plpgsql';

-- プリセットの商品数取得関数
CREATE OR REPLACE FUNCTION get_preset_product_count(
    preset_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    count INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO count
    FROM preset_products pp
    JOIN products p ON pp.product_id = p.id
    WHERE pp.preset_id = preset_id 
    AND pp.is_active = true 
    AND p.visible = true;
    
    RETURN count;
END;
$$ language 'plpgsql';

-- =====================================
-- 統計・集計関数
-- =====================================

-- 月別予約統計関数
CREATE OR REPLACE FUNCTION get_monthly_reservation_stats(
    target_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
    target_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW())::INTEGER
)
RETURNS TABLE (
    total_reservations BIGINT,
    total_amount BIGINT,
    avg_amount NUMERIC,
    unique_customers BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_reservations,
        COALESCE(SUM(r.total_amount), 0) as total_amount,
        COALESCE(AVG(r.total_amount), 0) as avg_amount,
        COUNT(DISTINCT r.user_id) as unique_customers
    FROM reservations r
    WHERE EXTRACT(YEAR FROM r.created_at) = target_year
    AND EXTRACT(MONTH FROM r.created_at) = target_month
    AND r.status IN ('confirmed', 'completed');
END;
$$ language 'plpgsql';

-- プリセット別売上統計関数
CREATE OR REPLACE FUNCTION get_preset_sales_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    preset_id INTEGER,
    preset_name TEXT,
    reservation_count BIGINT,
    total_sales BIGINT,
    avg_sales NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.id as preset_id,
        pp.name as preset_name,
        COUNT(r.id) as reservation_count,
        COALESCE(SUM(r.total_amount), 0) as total_sales,
        COALESCE(AVG(r.total_amount), 0) as avg_sales
    FROM product_presets pp
    LEFT JOIN reservations r ON pp.id = r.product_preset_id
        AND r.created_at::DATE BETWEEN start_date AND end_date
        AND r.status IN ('confirmed', 'completed')
    GROUP BY pp.id, pp.name
    ORDER BY total_sales DESC;
END;
$$ language 'plpgsql';

-- =====================================
-- 通知関連関数
-- =====================================

-- 通知ログ作成関数
CREATE OR REPLACE FUNCTION create_notification_log(
    p_user_id TEXT,
    p_type TEXT,
    p_message JSONB
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO notification_logs (user_id, type, message)
    VALUES (p_user_id, p_type, p_message)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ language 'plpgsql';

-- =====================================
-- データクリーンアップ関数
-- =====================================

-- 古い通知ログ削除関数（30日以上前）
CREATE OR REPLACE FUNCTION cleanup_old_notification_logs(
    retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notification_logs 
    WHERE sent_at < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- 無効な商品データクリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_inactive_preset_products()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- is_active = false の関連付けを削除
    DELETE FROM preset_products 
    WHERE is_active = false 
    AND updated_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- =====================================
-- 権限・セキュリティ関数
-- =====================================

-- ユーザー予約権限チェック関数
CREATE OR REPLACE FUNCTION check_user_reservation_permission(
    p_user_id TEXT,
    p_reservation_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    is_owner BOOLEAN := false;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM reservations 
        WHERE id = p_reservation_id 
        AND user_id = p_user_id
    ) INTO is_owner;
    
    RETURN is_owner;
END;
$$ language 'plpgsql';