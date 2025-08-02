-- =====================================
-- ベジライス予約システム - サンプルデータ投入スクリプト
-- =====================================

-- =====================================
-- 1. プリセットデータ
-- =====================================

INSERT INTO product_presets (id, name, description) VALUES
(1, '野菜セット', '新鮮な野菜のセット商品'),
(2, '果物セット', '季節の果物セット商品'),
(3, 'お米セット', 'お米と関連商品のセット'),
(4, '特別セット', '期間限定の特別商品セット')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- =====================================
-- 2. 商品データ
-- =====================================

-- 基本商品の挿入
INSERT INTO products (id, name, category_id, price, visible, receipt_name) VALUES
-- 野菜セット関連商品
(1, '種粕 20kg', 1, 2500, true, '種粕 20kg'),
(2, '園芸有機10号 20kg', 1, 3200, true, '園芸有機10号 20kg'),
(3, '有機化成3-10-10 20kg', 1, 2800, true, '有機化成3-10-10 20kg'),

-- 果物セット関連商品
(4, '種粕ペレット 20kg', 2, 2700, true, '種粕ペレット 20kg'),
(5, 'ナチュラル 20kg', 2, 3500, true, 'ナチュラル 20kg'),
(6, '土太郎 30L', 2, 1800, true, '土太郎 30L'),

-- お米セット関連商品
(7, 'そさい専用12-10-10 20kg', 3, 3000, true, 'そさい専用12-10-10 20kg'),
(8, '高度化成403 20kg', 3, 2900, true, '高度化成403 20kg'),
(9, '苦土入り化成4862 20kg', 3, 3100, true, '苦土入り化成4862 20kg'),

-- 特別セット商品
(10, 'プレミアム培養土 40L', 4, 4500, true, 'プレミアム培養土 40L'),
(11, '有機堆肥 30kg', 4, 2200, true, '有機堆肥 30kg'),
(12, '液体肥料セット', 4, 1500, true, '液体肥料セット')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category_id = EXCLUDED.category_id,
    price = EXCLUDED.price,
    visible = EXCLUDED.visible,
    receipt_name = EXCLUDED.receipt_name,
    updated_at = NOW();

-- バリエーション商品の例（価格違い）
INSERT INTO products (id, name, category_id, price, base_product_name, variation_name, variation_type, visible, receipt_name) VALUES
(13, '種粕 20kg（売出価格）', 1, 2200, '種粕 20kg', '売出価格', 'price', true, '種粕 20kg（売出）'),
(14, '園芸有機10号 20kg（大容量）', 1, 5800, '園芸有機10号', '40kg', 'size', true, '園芸有機10号 40kg'),
(15, 'ナチュラル 20kg（特価）', 2, 3200, 'ナチュラル 20kg', '特価', 'price', true, 'ナチュラル 20kg（特価）')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category_id = EXCLUDED.category_id,
    price = EXCLUDED.price,
    base_product_name = EXCLUDED.base_product_name,
    variation_name = EXCLUDED.variation_name,
    variation_type = EXCLUDED.variation_type,
    visible = EXCLUDED.visible,
    receipt_name = EXCLUDED.receipt_name,
    updated_at = NOW();

-- =====================================
-- 3. フォーム設定データ
-- =====================================

INSERT INTO form_settings (preset_id, show_price, require_address, enable_furigana, pickup_start, pickup_end, is_enabled) VALUES
(1, true, true, true, '2025-01-01 09:00:00+09', '2025-12-31 17:00:00+09', true),
(2, true, false, true, '2025-01-01 09:00:00+09', '2025-12-31 17:00:00+09', true),
(3, true, true, false, '2025-01-01 09:00:00+09', '2025-12-31 17:00:00+09', true),
(4, false, false, false, '2025-01-01 09:00:00+09', '2025-03-31 17:00:00+09', true)

ON CONFLICT (preset_id) DO UPDATE SET
    show_price = EXCLUDED.show_price,
    require_address = EXCLUDED.require_address,
    enable_furigana = EXCLUDED.enable_furigana,
    pickup_start = EXCLUDED.pickup_start,
    pickup_end = EXCLUDED.pickup_end,
    is_enabled = EXCLUDED.is_enabled,
    updated_at = NOW();

-- =====================================
-- 4. プリセット-商品関連付けデータ
-- =====================================

INSERT INTO preset_products (preset_id, product_id, display_order, is_active) VALUES
-- 野菜セット (preset_id = 1)
(1, 1, 1, true),   -- 種粕 20kg
(1, 13, 2, true),  -- 種粕 20kg（売出価格）
(1, 2, 3, true),   -- 園芸有機10号 20kg
(1, 14, 4, true),  -- 園芸有機10号 20kg（大容量）
(1, 3, 5, true),   -- 有機化成3-10-10 20kg

-- 果物セット (preset_id = 2)
(2, 4, 1, true),   -- 種粕ペレット 20kg
(2, 15, 2, true),  -- ナチュラル 20kg（特価）
(2, 5, 3, true),   -- ナチュラル 20kg
(2, 6, 4, true),   -- 土太郎 30L

-- お米セット (preset_id = 3)
(3, 7, 1, true),   -- そさい専用12-10-10 20kg
(3, 8, 2, true),   -- 高度化成403 20kg
(3, 9, 3, true),   -- 苦土入り化成4862 20kg

-- 特別セット (preset_id = 4)
(4, 10, 1, true),  -- プレミアム培養土 40L
(4, 11, 2, true),  -- 有機堆肥 30kg
(4, 12, 3, true),  -- 液体肥料セット
(4, 1, 4, true)    -- 種粕 20kg（特別セットにも含む）

ON CONFLICT (preset_id, product_id) DO UPDATE SET
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- =====================================
-- 5. 受け取り期間データ
-- =====================================

INSERT INTO pickup_windows (preset_id, pickup_start, pickup_end, comment) VALUES
(1, '2025-01-01 09:00:00+09', '2025-01-31 17:00:00+09', '1月の野菜セット受け取り期間'),
(1, '2025-02-01 09:00:00+09', '2025-02-28 17:00:00+09', '2月の野菜セット受け取り期間'),
(1, '2025-03-01 09:00:00+09', '2025-03-31 17:00:00+09', '3月の野菜セット受け取り期間'),

(2, '2025-01-01 09:00:00+09', '2025-01-31 17:00:00+09', '1月の果物セット受け取り期間'),
(2, '2025-02-01 09:00:00+09', '2025-02-28 17:00:00+09', '2月の果物セット受け取り期間'),

(3, '2025-01-01 09:00:00+09', '2025-01-31 17:00:00+09', '1月のお米セット受け取り期間'),
(3, '2025-02-01 09:00:00+09', '2025-02-28 17:00:00+09', '2月のお米セット受け取り期間'),
(3, '2025-03-01 09:00:00+09', '2025-03-31 17:00:00+09', '3月のお米セット受け取り期間'),

(4, '2025-01-01 09:00:00+09', '2025-03-31 17:00:00+09', '特別セット限定期間')

ON CONFLICT DO NOTHING;

-- =====================================
-- 6. サンプル予約データ（テスト用）
-- =====================================

INSERT INTO reservations (
    id, 
    user_id, 
    user_name, 
    phone_number, 
    product_preset_id, 
    product, 
    quantity, 
    total_amount, 
    pickup_date, 
    status
) VALUES
(
    'sample-reservation-001'::uuid,
    'U123456789abcdef',
    '田中太郎',
    '090-1234-5678',
    1,
    ARRAY['種粕 20kg', '園芸有機10号 20kg'],
    2,
    5700,
    '2025-01-15 14:00:00+09',
    'confirmed'
),
(
    'sample-reservation-002'::uuid,
    'U987654321fedcba',
    '佐藤花子',
    '080-9876-5432',
    2,
    ARRAY['ナチュラル 20kg（特価）', '土太郎 30L'],
    2,
    5000,
    '2025-01-20 10:00:00+09',
    'pending'
)

ON CONFLICT (id) DO NOTHING;

-- =====================================
-- 7. サンプル通知ログデータ
-- =====================================

INSERT INTO notification_logs (user_id, type, message) VALUES
('U123456789abcdef', 'confirmation', '{"type": "reservation_confirmed", "reservation_id": "sample-reservation-001", "message": "予約が確定しました"}'),
('U987654321fedcba', 'reminder', '{"type": "pickup_reminder", "reservation_id": "sample-reservation-002", "pickup_date": "2025-01-20", "message": "商品の受け取り日が近づいています"}')

ON CONFLICT DO NOTHING;

-- =====================================
-- 8. シーケンス調整
-- =====================================

-- Auto-increment IDの調整（既存データとの競合を避ける）
SELECT setval('product_presets_id_seq', (SELECT MAX(id) FROM product_presets) + 1);
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products) + 1);
SELECT setval('form_settings_id_seq', (SELECT MAX(id) FROM form_settings) + 1);
SELECT setval('preset_products_id_seq', (SELECT MAX(id) FROM preset_products) + 1);
SELECT setval('pickup_windows_id_seq', (SELECT MAX(id) FROM pickup_windows) + 1);

-- =====================================
-- 9. データ投入完了確認
-- =====================================

-- データ投入結果の確認
SELECT 'Sample data insertion completed' as status;

SELECT 
    'product_presets' as table_name, 
    COUNT(*) as record_count 
FROM product_presets
UNION ALL
SELECT 
    'products' as table_name, 
    COUNT(*) as record_count 
FROM products
UNION ALL
SELECT 
    'form_settings' as table_name, 
    COUNT(*) as record_count 
FROM form_settings
UNION ALL
SELECT 
    'preset_products' as table_name, 
    COUNT(*) as record_count 
FROM preset_products
UNION ALL
SELECT 
    'pickup_windows' as table_name, 
    COUNT(*) as record_count 
FROM pickup_windows
UNION ALL
SELECT 
    'reservations' as table_name, 
    COUNT(*) as record_count 
FROM reservations
UNION ALL
SELECT 
    'notification_logs' as table_name, 
    COUNT(*) as record_count 
FROM notification_logs
ORDER BY table_name;