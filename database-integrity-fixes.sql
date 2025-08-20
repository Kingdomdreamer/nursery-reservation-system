-- ===== データベース整合性修正スクリプト =====
-- 既存データベースの整合性問題を修正します
-- 実行前にデータのバックアップを推奨します

-- 1. 予約番号フィールドの追加（存在しない場合）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'reservation_number'
    ) THEN
        ALTER TABLE reservations ADD COLUMN reservation_number TEXT;
        
        -- 既存データに予約番号を設定
        UPDATE reservations 
        SET reservation_number = 'R' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 6, '0')
        WHERE reservation_number IS NULL;
        
        -- NOT NULL制約とUNIQUE制約の追加
        ALTER TABLE reservations ALTER COLUMN reservation_number SET NOT NULL;
        ALTER TABLE reservations ADD CONSTRAINT reservations_number_unique UNIQUE (reservation_number);
        
        -- インデックスの追加
        CREATE INDEX IF NOT EXISTS idx_reservations_number ON reservations(reservation_number);
    END IF;
END
$$;

-- 2. ReservationStatus制約の修正
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%status%' AND table_name = 'reservations'
    ) THEN
        -- 既存の制約を削除
        ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
    END IF;
    
    -- 新しい制約を追加
    ALTER TABLE reservations ADD CONSTRAINT reservations_status_check 
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));
END
$$;

-- 3. Gender制約の追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%gender%' AND table_name = 'reservations'
    ) THEN
        ALTER TABLE reservations ADD CONSTRAINT reservations_gender_check 
        CHECK (gender IN ('男性', '女性', 'その他') OR gender IS NULL);
    END IF;
END
$$;

-- 4. 履歴テーブルのGender制約
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%gender%' AND table_name = 'reservation_history'
    ) THEN
        ALTER TABLE reservation_history ADD CONSTRAINT reservation_history_gender_check 
        CHECK (gender IN ('男性', '女性', 'その他') OR gender IS NULL);
    END IF;
END
$$;

-- 5. 必要なインデックスの追加
CREATE INDEX IF NOT EXISTS idx_reservations_preset_status ON reservations(preset_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_reservations_phone ON reservations(phone_number, created_at);
CREATE INDEX IF NOT EXISTS idx_reservations_cancel_token ON reservations(cancel_token) WHERE cancel_token IS NOT NULL;

-- 6. データの一貫性チェック
DO $$
DECLARE
    inconsistent_count INTEGER;
BEGIN
    -- 無効なステータスのチェック
    SELECT COUNT(*) INTO inconsistent_count
    FROM reservations 
    WHERE status NOT IN ('pending', 'confirmed', 'cancelled', 'completed');
    
    IF inconsistent_count > 0 THEN
        RAISE WARNING 'Found % reservations with invalid status. Setting to pending.', inconsistent_count;
        UPDATE reservations SET status = 'pending' 
        WHERE status NOT IN ('pending', 'confirmed', 'cancelled', 'completed');
    END IF;
    
    -- 無効なGenderのチェック
    SELECT COUNT(*) INTO inconsistent_count
    FROM reservations 
    WHERE gender IS NOT NULL AND gender NOT IN ('男性', '女性', 'その他');
    
    IF inconsistent_count > 0 THEN
        RAISE WARNING 'Found % reservations with invalid gender. Setting to NULL.', inconsistent_count;
        UPDATE reservations SET gender = NULL 
        WHERE gender IS NOT NULL AND gender NOT IN ('男性', '女性', 'その他');
    END IF;
    
    -- 空の予約番号のチェック
    SELECT COUNT(*) INTO inconsistent_count
    FROM reservations 
    WHERE reservation_number IS NULL OR reservation_number = '';
    
    IF inconsistent_count > 0 THEN
        RAISE WARNING 'Found % reservations without reservation_number. Generating numbers.', inconsistent_count;
        UPDATE reservations 
        SET reservation_number = 'R' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(id::TEXT, 10, '0')
        WHERE reservation_number IS NULL OR reservation_number = '';
    END IF;
END
$$;

-- 7. 統計情報の更新
ANALYZE products;
ANALYZE product_presets;
ANALYZE preset_products;
ANALYZE form_settings;
ANALYZE reservations;
ANALYZE reservation_history;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'データベース整合性修正が完了しました。';
    RAISE NOTICE '修正されたテーブル: reservations, reservation_history';
    RAISE NOTICE '追加された制約: reservation_number UNIQUE, status CHECK, gender CHECK';
    RAISE NOTICE '追加されたインデックス: idx_reservations_number, その他';
END
$$;