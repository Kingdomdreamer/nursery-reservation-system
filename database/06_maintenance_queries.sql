-- =====================================
-- ベジライス予約システム - メンテナンス・管理用クエリ集
-- =====================================

-- =====================================
-- 1. データ確認クエリ
-- =====================================

-- 全テーブルのレコード数確認
SELECT 
    schemaname,
    tablename,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes,
    n_live_tup as current_records
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- プリセット別商品数確認
SELECT 
    pp.id,
    pp.name as preset_name,
    COUNT(pr.id) as product_count,
    COUNT(CASE WHEN pr.is_active THEN 1 END) as active_products,
    COUNT(CASE WHEN p.visible THEN 1 END) as visible_products
FROM product_presets pp
LEFT JOIN preset_products pr ON pp.id = pr.preset_id
LEFT JOIN products p ON pr.product_id = p.id
GROUP BY pp.id, pp.name
ORDER BY pp.id;

-- 商品の重複確認
SELECT 
    name,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as product_ids,
    STRING_AGG(price::text, ', ') as prices
FROM products 
WHERE visible = true
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- フォーム設定の確認
SELECT 
    fs.preset_id,
    pp.name as preset_name,
    fs.show_price,
    fs.require_address,
    fs.enable_furigana,
    fs.is_enabled,
    fs.pickup_start,
    fs.pickup_end
FROM form_settings fs
JOIN product_presets pp ON fs.preset_id = pp.id
ORDER BY fs.preset_id;

-- =====================================
-- 2. 統計・分析クエリ
-- =====================================

-- 月別予約統計
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_reservations,
    COUNT(DISTINCT user_id) as unique_customers,
    SUM(total_amount) as total_sales,
    AVG(total_amount) as avg_order_value,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_reservations,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reservations
FROM reservations
WHERE created_at >= DATE_TRUNC('year', NOW())
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

-- プリセット別売上分析
SELECT 
    pp.name as preset_name,
    COUNT(r.id) as reservation_count,
    SUM(r.total_amount) as total_sales,
    AVG(r.total_amount) as avg_sales,
    MIN(r.total_amount) as min_sales,
    MAX(r.total_amount) as max_sales
FROM product_presets pp
LEFT JOIN reservations r ON pp.id = r.product_preset_id
WHERE r.status IN ('confirmed', 'completed')
GROUP BY pp.id, pp.name
ORDER BY total_sales DESC NULLS LAST;

-- 人気商品ランキング（予約に含まれた商品名での集計）
WITH product_mentions AS (
    SELECT 
        UNNEST(product) as product_name,
        COUNT(*) as mention_count
    FROM reservations
    WHERE status IN ('confirmed', 'completed')
    GROUP BY UNNEST(product)
)
SELECT 
    product_name,
    mention_count,
    ROUND(100.0 * mention_count / SUM(mention_count) OVER(), 2) as percentage
FROM product_mentions
ORDER BY mention_count DESC
LIMIT 10;

-- 通知送信統計
SELECT 
    type,
    COUNT(*) as total_sent,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    DATE_TRUNC('day', sent_at) as send_date
FROM notification_logs
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY type, DATE_TRUNC('day', sent_at)
ORDER BY send_date DESC, type;

-- =====================================
-- 3. データクリーンアップクエリ
-- =====================================

-- 重複商品の特定と整理
WITH duplicate_products AS (
    SELECT 
        name,
        MIN(id) as keep_id,
        ARRAY_AGG(id ORDER BY id) as all_ids
    FROM products 
    WHERE visible = true
    GROUP BY name 
    HAVING COUNT(*) > 1
)
SELECT 
    'UPDATE preset_products SET product_id = ' || keep_id || 
    ' WHERE product_id IN (' || ARRAY_TO_STRING(all_ids[2:], ',') || ');' as update_query,
    'DELETE FROM products WHERE id IN (' || 
    ARRAY_TO_STRING(all_ids[2:], ',') || ');' as delete_query
FROM duplicate_products;

-- 非アクティブなデータの確認
SELECT 'Inactive preset_products' as category, COUNT(*) as count
FROM preset_products WHERE is_active = false
UNION ALL
SELECT 'Invisible products' as category, COUNT(*) as count
FROM products WHERE visible = false
UNION ALL
SELECT 'Disabled form_settings' as category, COUNT(*) as count
FROM form_settings WHERE is_enabled = false
UNION ALL
SELECT 'Old reservations (>1 year)' as category, COUNT(*) as count
FROM reservations WHERE created_at < NOW() - INTERVAL '1 year';

-- 古い通知ログのクリーンアップ（実行前確認）
SELECT 
    'Notification logs older than 30 days' as description,
    COUNT(*) as records_to_delete,
    MIN(sent_at) as oldest_record,
    MAX(sent_at) as newest_record
FROM notification_logs 
WHERE sent_at < NOW() - INTERVAL '30 days';

-- =====================================
-- 4. パフォーマンス確認クエリ
-- =====================================

-- インデックス使用状況
SELECT 
    t.schemaname,
    t.tablename,
    i.indexname,
    i.idx_scan as index_scans,
    i.idx_tup_read as tuples_read,
    i.idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN i.idx_scan = 0 THEN 'Never used'
        WHEN i.idx_scan < 100 THEN 'Low usage'
        WHEN i.idx_scan < 1000 THEN 'Medium usage'
        ELSE 'High usage'
    END as usage_level
FROM pg_stat_user_indexes i
JOIN pg_stat_user_tables t ON i.relid = t.relid
WHERE t.schemaname = 'public'
ORDER BY i.idx_scan DESC;

-- テーブルサイズとディスク使用量
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - 
                   pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- スロークエリの確認（統計リセット後の監視用）
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    ROUND(100.0 * total_time / SUM(total_time) OVER(), 2) as percentage
FROM pg_stat_statements 
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_time DESC 
LIMIT 10;

-- =====================================
-- 5. セキュリティ確認クエリ
-- =====================================

-- RLS ポリシーの確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- テーブルの権限確認
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
ORDER BY table_name, grantee;

-- =====================================
-- 6. バックアップ・復旧用クエリ
-- =====================================

-- 重要設定データのエクスポート
SELECT 'product_presets', array_to_json(array_agg(row_to_json(product_presets.*))) 
FROM product_presets
UNION ALL
SELECT 'form_settings', array_to_json(array_agg(row_to_json(form_settings.*))) 
FROM form_settings
UNION ALL
SELECT 'preset_products', array_to_json(array_agg(row_to_json(preset_products.*))) 
FROM preset_products WHERE is_active = true;

-- システム設定の確認
SELECT 
    name,
    setting,
    unit,
    category,
    short_desc
FROM pg_settings 
WHERE name IN (
    'shared_preload_libraries',
    'max_connections',
    'shared_buffers',
    'effective_cache_size',
    'maintenance_work_mem',
    'checkpoint_completion_target',
    'wal_buffers',
    'default_statistics_target'
)
ORDER BY category, name;

-- =====================================
-- 7. 開発・デバッグ用クエリ
-- =====================================

-- 最近の予約データ（デバッグ用）
SELECT 
    r.id,
    r.user_name,
    r.phone_number,
    pp.name as preset_name,
    r.product,
    r.total_amount,
    r.status,
    r.created_at
FROM reservations r
JOIN product_presets pp ON r.product_preset_id = pp.id
ORDER BY r.created_at DESC
LIMIT 10;

-- プリセット商品の完全リスト（フィルタリング確認用）
SELECT 
    pp.name as preset_name,
    p.name as product_name,
    p.price,
    pr.display_order,
    pr.is_active,
    p.visible
FROM product_presets pp
JOIN preset_products pr ON pp.id = pr.preset_id
JOIN products p ON pr.product_id = p.id
ORDER BY pp.id, pr.display_order;

-- フォーム設定の詳細確認
SELECT 
    pp.name as preset_name,
    fs.*
FROM form_settings fs
JOIN product_presets pp ON fs.preset_id = pp.id
WHERE fs.is_enabled = true
ORDER BY fs.preset_id;