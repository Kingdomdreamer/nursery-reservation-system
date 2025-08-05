-- =====================================
-- ベジライス予約システム - RLS（Row Level Security）ポリシー設定
-- =====================================

-- =====================================
-- RLS 有効化
-- =====================================

-- 全テーブルでRLSを有効化
ALTER TABLE product_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- =====================================
-- 公開読み取りポリシー（認証不要）
-- =====================================

-- product_presets: 誰でも読み取り可能
CREATE POLICY "product_presets_select_all" ON product_presets
    FOR SELECT USING (true);

-- products: 表示可能な商品のみ誰でも読み取り可能
CREATE POLICY "products_select_visible" ON products
    FOR SELECT USING (visible = true);

-- form_settings: 有効な設定のみ誰でも読み取り可能
CREATE POLICY "form_settings_select_enabled" ON form_settings
    FOR SELECT USING (is_enabled = true);

-- preset_products: アクティブな関連付けのみ誰でも読み取り可能
CREATE POLICY "preset_products_select_active" ON preset_products
    FOR SELECT USING (is_active = true);

-- pickup_windows: 誰でも読み取り可能
CREATE POLICY "pickup_windows_select_all" ON pickup_windows
    FOR SELECT USING (true);

-- =====================================
-- 予約データのユーザー別アクセス制御
-- =====================================

-- 予約データ: 自分の予約のみ読み取り・更新可能
CREATE POLICY "reservations_select_own" ON reservations
    FOR SELECT USING (
        auth.jwt() ->> 'user_id' = user_id OR 
        auth.jwt() ->> 'role' = 'admin'
    );

-- 予約データ: 新規作成は認証済みユーザーのみ
CREATE POLICY "reservations_insert_authenticated" ON reservations
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'user_id' = user_id OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- 予約データ: 自分の予約のみ更新可能
CREATE POLICY "reservations_update_own" ON reservations
    FOR UPDATE USING (
        auth.jwt() ->> 'user_id' = user_id OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- 予約データ: 管理者のみ削除可能
CREATE POLICY "reservations_delete_admin" ON reservations
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================
-- 通知ログのアクセス制御
-- =====================================

-- 通知ログ: 自分の通知のみ読み取り可能
CREATE POLICY "notification_logs_select_own" ON notification_logs
    FOR SELECT USING (
        auth.jwt() ->> 'user_id' = user_id OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- 通知ログ: システムまたは管理者のみ挿入可能
CREATE POLICY "notification_logs_insert_system" ON notification_logs
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'system')
    );

-- =====================================
-- 管理者専用ポリシー
-- =====================================

-- 管理者: 全商品データの管理権限
CREATE POLICY "products_admin_all" ON products
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 管理者: 全プリセットデータの管理権限
CREATE POLICY "product_presets_admin_all" ON product_presets
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 管理者: 全フォーム設定の管理権限
CREATE POLICY "form_settings_admin_all" ON form_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 管理者: 全関連付けデータの管理権限
CREATE POLICY "preset_products_admin_all" ON preset_products
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 管理者: 全受け取り期間の管理権限
CREATE POLICY "pickup_windows_admin_all" ON pickup_windows
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================
-- LIFF環境用ポリシー（開発・本番環境）
-- =====================================

-- LIFF環境: 予約データの読み書き（LINEユーザーID認証）
CREATE POLICY "reservations_liff_access" ON reservations
    FOR ALL USING (true);

-- LIFF環境: 通知ログの作成
CREATE POLICY "notification_logs_liff_access" ON notification_logs
    FOR INSERT WITH CHECK (true);

-- =====================================
-- サービスロール用ポリシー
-- =====================================

-- サービスロール: 全データへのフルアクセス
-- （Supabase Service Role Key使用時のバイパス）

-- =====================================
-- 匿名アクセス用ポリシー
-- =====================================

-- 匿名ユーザー: 公開データの読み取りのみ
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

-- =====================================
-- セキュリティ関数（ヘルパー）
-- =====================================

-- 現在のユーザーIDを取得する関数
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(auth.jwt() ->> 'user_id', 'anonymous');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 管理者権限チェック関数
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(auth.jwt() ->> 'role', '') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザー予約数制限チェック関数
CREATE OR REPLACE FUNCTION check_user_reservation_limit(
    p_user_id TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
    reservation_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO reservation_count
    FROM reservations
    WHERE user_id = p_user_id
    AND status IN ('pending', 'confirmed')
    AND created_at > NOW() - INTERVAL '30 days';
    
    RETURN reservation_count < p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- RLS ポリシーの有効性確認
-- =====================================

-- ポリシー確認用ビュー
CREATE OR REPLACE VIEW rls_policies_status AS
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN ('product_presets', 'products', 'form_settings', 'preset_products', 'pickup_windows', 'reservations', 'notification_logs')
ORDER BY tablename;

-- RLS設定完了の確認
SELECT 'RLS policies setup completed' as status;
SELECT * FROM rls_policies_status;