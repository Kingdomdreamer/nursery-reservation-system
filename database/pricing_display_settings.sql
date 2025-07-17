-- フォーム作成時の合計・小計表示設定機能追加SQL
-- 2025年7月16日作成
-- 2025年7月17日修正: 外部キー制約エラーを修正（forms.idの型をTEXTに変更）

-- 1. forms テーブルに表示設定フィールドを追加
ALTER TABLE forms 
ADD COLUMN show_item_prices BOOLEAN DEFAULT true,
ADD COLUMN show_subtotal BOOLEAN DEFAULT true,
ADD COLUMN show_total_amount BOOLEAN DEFAULT true,
ADD COLUMN show_item_quantity BOOLEAN DEFAULT true,
ADD COLUMN pricing_display_mode VARCHAR(20) DEFAULT 'full';

-- 2. pricing_display_mode の制約を追加
ALTER TABLE forms 
ADD CONSTRAINT pricing_display_mode_check 
CHECK (pricing_display_mode IN ('full', 'summary', 'hidden', 'custom'));

-- 3. 表示設定フィールドにコメントを追加
COMMENT ON COLUMN forms.show_item_prices IS '商品単価の表示設定';
COMMENT ON COLUMN forms.show_subtotal IS '小計の表示設定';
COMMENT ON COLUMN forms.show_total_amount IS '合計金額の表示設定';
COMMENT ON COLUMN forms.show_item_quantity IS '商品数量の表示設定';
COMMENT ON COLUMN forms.pricing_display_mode IS '価格表示モード: full(全表示), summary(要約), hidden(非表示), custom(カスタム)';

-- 4. 既存のフォームデータを更新（デフォルト値を適用）
UPDATE forms 
SET 
  show_item_prices = true,
  show_subtotal = true,
  show_total_amount = true,
  show_item_quantity = true,
  pricing_display_mode = 'full'
WHERE 
  show_item_prices IS NULL 
  OR show_subtotal IS NULL 
  OR show_total_amount IS NULL 
  OR show_item_quantity IS NULL
  OR pricing_display_mode IS NULL;

-- 5. フォーム設定の履歴を記録するテーブルを作成（将来の履歴管理用）
CREATE TABLE IF NOT EXISTS form_display_settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  show_item_prices BOOLEAN NOT NULL,
  show_subtotal BOOLEAN NOT NULL,
  show_total_amount BOOLEAN NOT NULL,
  show_item_quantity BOOLEAN NOT NULL,
  pricing_display_mode VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  change_reason TEXT
);

-- 6. 履歴テーブルのインデックスを追加
CREATE INDEX idx_form_display_settings_history_form_id ON form_display_settings_history(form_id);
CREATE INDEX idx_form_display_settings_history_changed_at ON form_display_settings_history(changed_at);

-- 7. 履歴記録用のトリガー関数を作成
CREATE OR REPLACE FUNCTION log_form_display_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- 価格表示設定が変更された場合のみ履歴を記録
  IF (OLD.show_item_prices != NEW.show_item_prices OR 
      OLD.show_subtotal != NEW.show_subtotal OR 
      OLD.show_total_amount != NEW.show_total_amount OR 
      OLD.show_item_quantity != NEW.show_item_quantity OR 
      OLD.pricing_display_mode != NEW.pricing_display_mode) THEN
    
    INSERT INTO form_display_settings_history (
      form_id,
      show_item_prices,
      show_subtotal,
      show_total_amount,
      show_item_quantity,
      pricing_display_mode,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      NEW.show_item_prices,
      NEW.show_subtotal,
      NEW.show_total_amount,
      NEW.show_item_quantity,
      NEW.pricing_display_mode,
      auth.uid(),
      'Form display settings updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. トリガーを作成
CREATE TRIGGER form_display_settings_change_trigger
  AFTER UPDATE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION log_form_display_settings_changes();

-- 9. RLS (Row Level Security) ポリシーを追加
ALTER TABLE form_display_settings_history ENABLE ROW LEVEL SECURITY;

-- 履歴の参照権限（認証済みユーザーのみ）
CREATE POLICY "Users can view form display settings history" ON form_display_settings_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- 履歴の追加権限（システムによる自動追加のみ）
CREATE POLICY "System can insert form display settings history" ON form_display_settings_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 10. 管理者用のビューを作成
CREATE OR REPLACE VIEW form_display_settings_summary AS
SELECT 
  f.id,
  f.name,
  f.show_item_prices,
  f.show_subtotal,
  f.show_total_amount,
  f.show_item_quantity,
  f.pricing_display_mode,
  f.created_at,
  f.updated_at,
  -- 最新の変更履歴
  (SELECT changed_at FROM form_display_settings_history 
   WHERE form_id = f.id ORDER BY changed_at DESC LIMIT 1) as last_settings_change
FROM forms f
WHERE f.is_active = true;

-- 11. 価格表示設定の統計情報を取得する関数
CREATE OR REPLACE FUNCTION get_pricing_display_stats()
RETURNS TABLE (
  total_forms INTEGER,
  forms_with_prices INTEGER,
  forms_with_subtotal INTEGER,
  forms_with_total INTEGER,
  forms_with_quantity INTEGER,
  full_display_forms INTEGER,
  summary_display_forms INTEGER,
  hidden_display_forms INTEGER,
  custom_display_forms INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_forms,
    COUNT(CASE WHEN show_item_prices = true THEN 1 END)::INTEGER as forms_with_prices,
    COUNT(CASE WHEN show_subtotal = true THEN 1 END)::INTEGER as forms_with_subtotal,
    COUNT(CASE WHEN show_total_amount = true THEN 1 END)::INTEGER as forms_with_total,
    COUNT(CASE WHEN show_item_quantity = true THEN 1 END)::INTEGER as forms_with_quantity,
    COUNT(CASE WHEN pricing_display_mode = 'full' THEN 1 END)::INTEGER as full_display_forms,
    COUNT(CASE WHEN pricing_display_mode = 'summary' THEN 1 END)::INTEGER as summary_display_forms,
    COUNT(CASE WHEN pricing_display_mode = 'hidden' THEN 1 END)::INTEGER as hidden_display_forms,
    COUNT(CASE WHEN pricing_display_mode = 'custom' THEN 1 END)::INTEGER as custom_display_forms
  FROM forms 
  WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 12. サンプルデータの挿入（テスト用）
-- 注意: 実際の本番環境では実行しないこと
/*
INSERT INTO forms (id, name, show_item_prices, show_subtotal, show_total_amount, show_item_quantity, pricing_display_mode)
VALUES 
  (gen_random_uuid(), 'テスト用フォーム1', true, true, true, true, 'full'),
  (gen_random_uuid(), 'テスト用フォーム2', true, false, true, true, 'summary'),
  (gen_random_uuid(), 'テスト用フォーム3', false, false, false, false, 'hidden');
*/

-- 13. 動作確認用のクエリ
-- 以下のクエリで設定が正しく適用されているかを確認できます
/*
-- 全フォームの価格表示設定を確認
SELECT id, name, show_item_prices, show_subtotal, show_total_amount, show_item_quantity, pricing_display_mode 
FROM forms 
ORDER BY created_at DESC;

-- 価格表示設定の統計情報を確認
SELECT * FROM get_pricing_display_stats();

-- 最新の変更履歴を確認
SELECT * FROM form_display_settings_history ORDER BY changed_at DESC LIMIT 10;
*/

-- 実行完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '価格表示設定機能のデータベース拡張が完了しました。';
  RAISE NOTICE '追加されたフィールド: show_item_prices, show_subtotal, show_total_amount, show_item_quantity, pricing_display_mode';
  RAISE NOTICE '履歴管理テーブル: form_display_settings_history';
  RAISE NOTICE '管理者用ビュー: form_display_settings_summary';
  RAISE NOTICE '統計情報関数: get_pricing_display_stats()';
  RAISE NOTICE '修正内容: forms.idの型にあわせてform_display_settings_history.form_idをTEXT型に変更';
END $$;