-- =====================================
-- ベジライス予約システム - インデックス作成スクリプト
-- =====================================

-- =====================================
-- パフォーマンス最適化インデックス
-- =====================================

-- products テーブル
CREATE INDEX IF NOT EXISTS idx_products_visible ON products(visible);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);

-- preset_products テーブル（関連付けクエリ最適化）
CREATE INDEX IF NOT EXISTS idx_preset_products_preset_id ON preset_products(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_products_product_id ON preset_products(product_id);
CREATE INDEX IF NOT EXISTS idx_preset_products_display_order ON preset_products(display_order);
CREATE INDEX IF NOT EXISTS idx_preset_products_is_active ON preset_products(is_active);
CREATE INDEX IF NOT EXISTS idx_preset_products_preset_active ON preset_products(preset_id, is_active);

-- form_settings テーブル
CREATE INDEX IF NOT EXISTS idx_form_settings_preset_id ON form_settings(preset_id);
CREATE INDEX IF NOT EXISTS idx_form_settings_is_enabled ON form_settings(is_enabled);
CREATE INDEX IF NOT EXISTS idx_form_settings_preset_enabled ON form_settings(preset_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_form_settings_valid_until ON form_settings(valid_until);

-- pickup_windows テーブル
CREATE INDEX IF NOT EXISTS idx_pickup_windows_product_id ON pickup_windows(product_id);
CREATE INDEX IF NOT EXISTS idx_pickup_windows_preset_id ON pickup_windows(preset_id);
CREATE INDEX IF NOT EXISTS idx_pickup_windows_pickup_start ON pickup_windows(pickup_start);
CREATE INDEX IF NOT EXISTS idx_pickup_windows_pickup_end ON pickup_windows(pickup_end);
CREATE INDEX IF NOT EXISTS idx_pickup_windows_date_range ON pickup_windows(pickup_start, pickup_end);

-- reservations テーブル（高頻度クエリ最適化）
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_pickup_date ON reservations(pickup_date);
CREATE INDEX IF NOT EXISTS idx_reservations_product_preset_id ON reservations(product_preset_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);
CREATE INDEX IF NOT EXISTS idx_reservations_phone_number ON reservations(phone_number);

-- 複合インデックス（よく使われるクエリパターン用）
CREATE INDEX IF NOT EXISTS idx_reservations_preset_status ON reservations(product_preset_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_user_status ON reservations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_date_status ON reservations(pickup_date, status);

-- notification_logs テーブル
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_type ON notification_logs(user_id, type);

-- product_presets テーブル
CREATE INDEX IF NOT EXISTS idx_product_presets_name ON product_presets(name);
CREATE INDEX IF NOT EXISTS idx_product_presets_created_at ON product_presets(created_at);

-- =====================================
-- 全文検索インデックス（商品検索用）
-- =====================================

-- 商品名の全文検索インデックス
CREATE INDEX IF NOT EXISTS idx_products_name_gin ON products USING gin(to_tsvector('japanese', name));
CREATE INDEX IF NOT EXISTS idx_products_receipt_name_gin ON products USING gin(to_tsvector('japanese', receipt_name));

-- 顧客名検索用
CREATE INDEX IF NOT EXISTS idx_reservations_user_name_gin ON reservations USING gin(to_tsvector('japanese', user_name));

-- =====================================
-- 部分インデックス（条件付きインデックス）
-- =====================================

-- 有効な商品のみのインデックス
CREATE INDEX IF NOT EXISTS idx_products_visible_only ON products(id, name, price) WHERE visible = true;

-- 有効なプリセット商品関連付けのみ
CREATE INDEX IF NOT EXISTS idx_preset_products_active_only ON preset_products(preset_id, product_id, display_order) WHERE is_active = true;

-- 有効なフォーム設定のみ
CREATE INDEX IF NOT EXISTS idx_form_settings_enabled_only ON form_settings(preset_id) WHERE is_enabled = true;

-- アクティブな予約のみ
CREATE INDEX IF NOT EXISTS idx_reservations_active_only ON reservations(user_id, pickup_date, total_amount) WHERE status IN ('pending', 'confirmed');

-- =====================================
-- JSONB インデックス（通知メッセージ用）
-- =====================================

-- 通知メッセージ内容のGINインデックス
CREATE INDEX IF NOT EXISTS idx_notification_logs_message_gin ON notification_logs USING gin(message);

-- 特定のメッセージタイプ検索用
CREATE INDEX IF NOT EXISTS idx_notification_logs_message_type ON notification_logs USING gin((message->>'type'));

-- =====================================
-- 統計情報更新
-- =====================================

-- インデックス作成後の統計情報更新
ANALYZE product_presets;
ANALYZE products;
ANALYZE form_settings;
ANALYZE preset_products;
ANALYZE pickup_windows;
ANALYZE reservations;
ANALYZE notification_logs;