-- 価格表示設定テーブルの作成
-- 2025年7月18日作成

-- 1. pricing_display_settings テーブルを作成
CREATE TABLE IF NOT EXISTS pricing_display_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES form_configurations(id) ON DELETE CASCADE,
  show_item_prices BOOLEAN DEFAULT true,
  show_subtotal BOOLEAN DEFAULT true,
  show_total_amount BOOLEAN DEFAULT true,
  show_item_quantity BOOLEAN DEFAULT true,
  pricing_display_mode VARCHAR(20) DEFAULT 'full',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- 制約
  CONSTRAINT pricing_display_mode_check 
  CHECK (pricing_display_mode IN ('full', 'summary', 'hidden', 'custom')),
  
  -- 1つのフォームに対して1つの設定のみ
  CONSTRAINT unique_form_pricing_settings UNIQUE (form_id)
);

-- 2. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_pricing_display_settings_form_id 
ON pricing_display_settings(form_id);

-- 3. updated_at を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_pricing_display_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. トリガーを作成
DROP TRIGGER IF EXISTS update_pricing_display_settings_updated_at_trigger 
ON pricing_display_settings;

CREATE TRIGGER update_pricing_display_settings_updated_at_trigger
  BEFORE UPDATE ON pricing_display_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_display_settings_updated_at();

-- 5. RLS (Row Level Security) を有効化
ALTER TABLE pricing_display_settings ENABLE ROW LEVEL SECURITY;

-- 6. RLSポリシーを作成（認証済みユーザーのみアクセス可能）
CREATE POLICY "Users can view pricing display settings" 
ON pricing_display_settings
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert pricing display settings" 
ON pricing_display_settings
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update pricing display settings" 
ON pricing_display_settings
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete pricing display settings" 
ON pricing_display_settings
FOR DELETE USING (auth.role() = 'authenticated');

-- 7. コメントを追加
COMMENT ON TABLE pricing_display_settings IS 'フォームの価格表示設定';
COMMENT ON COLUMN pricing_display_settings.form_id IS '対象フォームのID';
COMMENT ON COLUMN pricing_display_settings.show_item_prices IS '商品単価の表示設定';
COMMENT ON COLUMN pricing_display_settings.show_subtotal IS '小計の表示設定';
COMMENT ON COLUMN pricing_display_settings.show_total_amount IS '合計金額の表示設定';
COMMENT ON COLUMN pricing_display_settings.show_item_quantity IS '商品数量の表示設定';
COMMENT ON COLUMN pricing_display_settings.pricing_display_mode IS '価格表示モード: full(全表示), summary(要約), hidden(非表示), custom(カスタム)';

-- 実行完了メッセージ
DO $$
BEGIN
  RAISE NOTICE 'pricing_display_settings テーブルが正常に作成されました。';
  RAISE NOTICE 'RLS (Row Level Security) が有効化されました。';
  RAISE NOTICE 'トリガーが設定されました。';
END $$;