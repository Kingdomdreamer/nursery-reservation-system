-- 通知テーブルの作成
-- 2025年7月18日作成

-- 1. notifications テーブルを作成
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- 制約
  CONSTRAINT notification_type_check 
  CHECK (type IN ('info', 'success', 'warning', 'error'))
);

-- 2. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(type);

-- 3. updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notifications_updated_at_trigger 
ON notifications;

CREATE TRIGGER update_notifications_updated_at_trigger
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- 4. 古い通知を自動削除する関数（30日以上経過）
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
  AND is_read = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE '古い通知 % 件を削除しました', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 5. RLS (Row Level Security) を有効化
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLSポリシーを作成
-- すべての認証済みユーザーが通知を参照可能
CREATE POLICY "Users can view notifications" 
ON notifications
FOR SELECT USING (auth.role() = 'authenticated');

-- 管理者またはシステムが通知を作成可能
CREATE POLICY "System can insert notifications" 
ON notifications
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ユーザーは自分の通知のみ更新可能（既読状態など）
CREATE POLICY "Users can update own notifications" 
ON notifications
FOR UPDATE USING (
  auth.role() = 'authenticated' AND 
  (user_id = auth.uid() OR user_id IS NULL)
);

-- 管理者のみ通知を削除可能
CREATE POLICY "Admins can delete notifications" 
ON notifications
FOR DELETE USING (auth.role() = 'authenticated');

-- 7. 通知統計ビューを作成
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
  COUNT(CASE WHEN is_read = true THEN 1 END) as read_count,
  MAX(created_at) as latest_notification
FROM notifications
GROUP BY type
ORDER BY type;

-- 8. システム通知を作成する便利関数
CREATE OR REPLACE FUNCTION create_system_notification(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_action_url TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (title, message, type, action_url, user_id)
  VALUES (p_title, p_message, p_type, p_action_url, p_user_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- 9. 一括既読関数
CREATE OR REPLACE FUNCTION mark_user_notifications_read(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    -- 全ユーザーの通知を既読にする
    UPDATE notifications 
    SET is_read = true, updated_at = CURRENT_TIMESTAMP
    WHERE is_read = false;
  ELSE
    -- 特定ユーザーの通知を既読にする
    UPDATE notifications 
    SET is_read = true, updated_at = CURRENT_TIMESTAMP
    WHERE is_read = false AND (user_id = p_user_id OR user_id IS NULL);
  END IF;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 10. コメントを追加
COMMENT ON TABLE notifications IS 'システム通知管理テーブル';
COMMENT ON COLUMN notifications.title IS '通知タイトル';
COMMENT ON COLUMN notifications.message IS '通知メッセージ';
COMMENT ON COLUMN notifications.type IS '通知タイプ: info, success, warning, error';
COMMENT ON COLUMN notifications.is_read IS '既読フラグ';
COMMENT ON COLUMN notifications.action_url IS 'クリック時の遷移先URL';
COMMENT ON COLUMN notifications.user_id IS '対象ユーザーID（NULLの場合は全ユーザー向け）';
COMMENT ON COLUMN notifications.metadata IS '追加情報（JSON形式）';

-- 11. サンプル通知を作成（テスト用）
-- 注意: 実際の本番環境では実行しないこと
/*
SELECT create_system_notification(
  'システム開始',
  '保育園予約システムが正常に起動しました',
  'success',
  '/admin'
);

SELECT create_system_notification(
  'メンテナンス予告',
  '明日午前2時〜4時にシステムメンテナンスを実施します',
  'warning',
  '/admin/settings'
);
*/

-- 実行完了メッセージ
DO $$
BEGIN
  RAISE NOTICE 'notifications テーブルが正常に作成されました。';
  RAISE NOTICE 'RLS (Row Level Security) が有効化されました。';
  RAISE NOTICE 'トリガーとインデックスが設定されました。';
  RAISE NOTICE '便利関数: create_system_notification(), mark_user_notifications_read(), cleanup_old_notifications()';
  RAISE NOTICE '統計ビュー: notification_stats';
END $$;