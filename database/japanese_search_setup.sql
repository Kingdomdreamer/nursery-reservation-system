-- =====================================================
-- 🇯🇵 日本語全文検索設定（オプション）
-- =====================================================
-- PostgreSQLで日本語全文検索を有効にするための追加スクリプト
-- 基本セットアップ後に必要に応じて実行してください

-- 1. 日本語全文検索の確認
-- =====================================================

-- 利用可能なテキスト検索設定を確認
SELECT cfgname, cfgowner, cfgnamespace 
FROM pg_ts_config 
ORDER BY cfgname;

-- 現在の設定を確認
SHOW default_text_search_config;

-- 2. 日本語設定が利用可能な場合の設定
-- =====================================================

-- 日本語設定が存在するかチェック
DO $$
BEGIN
    -- 日本語設定が存在する場合のインデックス作成
    IF EXISTS (
        SELECT 1 FROM pg_ts_config WHERE cfgname = 'japanese'
    ) THEN
        -- 既存のsimpleインデックスを削除
        DROP INDEX IF EXISTS idx_products_name;
        
        -- 日本語対応インデックスを作成
        CREATE INDEX idx_products_name ON products 
        USING GIN (to_tsvector('japanese', name));
        
        RAISE NOTICE '日本語全文検索インデックスを作成しました';
    ELSE
        RAISE NOTICE '日本語テキスト検索設定が見つかりません。simpleを使用します。';
    END IF;
END $$;

-- 3. 代替案：trigram（類似検索）インデックス
-- =====================================================

-- pg_trgm拡張が利用可能な場合
DO $$
BEGIN
    -- pg_trgm拡張の確認と作成
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
    ) THEN
        CREATE EXTENSION pg_trgm;
        RAISE NOTICE 'pg_trgm拡張を有効化しました';
    END IF;
    
    -- trigramインデックスの作成（部分一致検索用）
    CREATE INDEX IF NOT EXISTS idx_products_name_trigram 
    ON products USING GIN (name gin_trgm_ops);
    
    RAISE NOTICE 'trigramインデックスを作成しました（部分一致検索用）';
    
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'pg_trgm拡張の作成権限がありません';
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_trgm拡張の設定中にエラーが発生しました: %', SQLERRM;
END $$;

-- 4. 検索関数の作成
-- =====================================================

-- 商品名検索関数（様々な検索方式に対応）
CREATE OR REPLACE FUNCTION search_products(search_term TEXT)
RETURNS TABLE (
    id UUID,
    name VARCHAR(200),
    description TEXT,
    price DECIMAL(10,2),
    category_name VARCHAR(100),
    rank REAL
) AS $$
BEGIN
    -- 日本語全文検索が利用可能な場合
    IF EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'japanese') THEN
        RETURN QUERY
        SELECT 
            p.id,
            p.name,
            p.description,
            p.price,
            pc.name as category_name,
            ts_rank(to_tsvector('japanese', p.name || ' ' || COALESCE(p.description, '')), 
                    plainto_tsquery('japanese', search_term)) as rank
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE to_tsvector('japanese', p.name || ' ' || COALESCE(p.description, '')) 
              @@ plainto_tsquery('japanese', search_term)
        AND p.is_available = true
        ORDER BY rank DESC, p.name;
        
    -- pg_trgmが利用可能な場合
    ELSIF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        RETURN QUERY
        SELECT 
            p.id,
            p.name,
            p.description,
            p.price,
            pc.name as category_name,
            similarity(p.name, search_term) as rank
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE p.name % search_term 
           OR p.name ILIKE '%' || search_term || '%'
        AND p.is_available = true
        ORDER BY rank DESC, p.name;
        
    -- フォールバック：LIKE検索
    ELSE
        RETURN QUERY
        SELECT 
            p.id,
            p.name,
            p.description,
            p.price,
            pc.name as category_name,
            CASE 
                WHEN p.name ILIKE search_term || '%' THEN 1.0
                WHEN p.name ILIKE '%' || search_term || '%' THEN 0.5
                ELSE 0.1
            END as rank
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE p.name ILIKE '%' || search_term || '%'
           OR p.description ILIKE '%' || search_term || '%'
        AND p.is_available = true
        ORDER BY rank DESC, p.name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. 使用例とテスト
-- =====================================================

-- 検索関数のテスト
-- SELECT * FROM search_products('トマト');
-- SELECT * FROM search_products('苗');

-- 直接検索のテスト例
/*
-- 1. 全文検索（日本語設定がある場合）
SELECT name, ts_rank(to_tsvector('japanese', name), plainto_tsquery('japanese', 'トマト')) as rank
FROM products 
WHERE to_tsvector('japanese', name) @@ plainto_tsquery('japanese', 'トマト')
ORDER BY rank DESC;

-- 2. LIKE検索（フォールバック）
SELECT name 
FROM products 
WHERE name ILIKE '%トマト%' 
ORDER BY name;

-- 3. trigram検索（部分一致）
SELECT name, similarity(name, 'トマト') as sim
FROM products 
WHERE name % 'トマト'
ORDER BY sim DESC;
*/

-- 6. パフォーマンス確認
-- =====================================================

-- インデックス使用状況の確認
CREATE OR REPLACE FUNCTION check_search_performance()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
BEGIN
    -- 利用可能な検索方式を確認
    IF EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'japanese') THEN
        result := result || '✅ 日本語全文検索が利用可能' || E'\n';
    ELSE
        result := result || '❌ 日本語全文検索は利用不可' || E'\n';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        result := result || '✅ trigram検索が利用可能' || E'\n';
    ELSE
        result := result || '❌ trigram検索は利用不可' || E'\n';
    END IF;
    
    -- インデックス存在確認
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_name') THEN
        result := result || '✅ 商品名インデックスが存在' || E'\n';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_name_trigram') THEN
        result := result || '✅ trigram商品名インデックスが存在' || E'\n';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- パフォーマンス確認の実行
SELECT check_search_performance();

-- =====================================================
-- 📝 使用ガイド
-- =====================================================

/*
このスクリプトは基本セットアップ後に実行してください。

【検索方式の優先順位】
1. 日本語全文検索（最も高精度・高速）
2. trigram検索（部分一致・類似検索）
3. LIKE検索（フォールバック・最も互換性が高い）

【アプリケーション側での使用例】
// TypeScript/JavaScript
const searchProducts = async (searchTerm: string) => {
  const { data } = await supabase
    .rpc('search_products', { search_term: searchTerm });
  return data;
};

【推奨設定】
- 本番環境：日本語全文検索 + trigram検索
- 開発環境：trigram検索またはLIKE検索
- テスト環境：LIKE検索（最小構成）
*/