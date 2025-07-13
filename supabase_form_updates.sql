-- 1) id を UUID から TEXT に変更
ALTER TABLE form_configurations
  -- まず主キー制約を外す
  DROP CONSTRAINT IF EXISTS form_configurations_pkey,
  -- id カラムを TEXT 型に
  ALTER COLUMN id TYPE TEXT USING id::TEXT,
  -- TEXT になった id カラムに再び主キーを設定
  ADD PRIMARY KEY (id);

-- 2) valid_from / valid_to / is_active カラムの追加
ALTER TABLE form_configurations 
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valid_to   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN DEFAULT true;

-- NULL だった既存レコードの is_active を true に
UPDATE form_configurations
  SET is_active = true
  WHERE is_active IS NULL;

-- 各カラムにコメント
COMMENT ON COLUMN form_configurations.valid_from IS 'フォーム受付開始日時';
COMMENT ON COLUMN form_configurations.valid_to   IS 'フォーム受付終了日時';
COMMENT ON COLUMN form_configurations.is_active  IS 'フォームの有効/無効状態';

-- 3) フォーム有効性チェック関数
CREATE OR REPLACE FUNCTION is_form_accessible(form_id TEXT)
  RETURNS BOOLEAN AS $$
DECLARE
  rec RECORD;
BEGIN
  SELECT is_active, valid_from, valid_to
    INTO rec
    FROM form_configurations
   WHERE id = form_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  ELSIF NOT rec.is_active THEN
    RETURN FALSE;
  ELSIF rec.valid_from IS NOT NULL AND now() < rec.valid_from THEN
    RETURN FALSE;
  ELSIF rec.valid_to   IS NOT NULL AND now() > rec.valid_to   THEN
    RETURN FALSE;
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 4) RLSポリシーの再設定
DROP POLICY IF EXISTS "フォーム設定は認証されたユーザーが作成可能" ON form_configurations;
DROP POLICY IF EXISTS "フォーム設定は誰でも参照可能"       ON form_configurations;

CREATE POLICY "フォーム設定は認証されたユーザーが管理可能"
  ON form_configurations FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "有効なフォーム設定は誰でも参照可能"
  ON form_configurations FOR SELECT
  USING (is_form_accessible(id));

-- 5) パフォーマンス用インデックス
CREATE INDEX IF NOT EXISTS idx_form_configurations_active_dates
  ON form_configurations(is_active, valid_from, valid_to);

-- 6) デモ用フォーム設定を「reservation-form」というスラッグIDでUPSERT
INSERT INTO form_configurations (
    id,
    name,
    description,
    form_fields,
    settings,
    is_active,
    valid_from,
    valid_to,
    version,
    created_at,
    updated_at
) VALUES (
    'reservation-form',  -- ← TEXT 型なのでスラッグをそのままIDに
    '商品予約フォーム',
    '片桐商店 ベジライスの商品予約を承ります',
    jsonb_build_object(
      'fields', jsonb_build_array(
        jsonb_build_object('id','customer_name',      'type','text',     'label','氏名',             'required',true,  'enabled',true),
        jsonb_build_object('id','customer_furigana',  'type','text',     'label','フリガナ',         'required',false, 'enabled',true),
        jsonb_build_object('id','customer_phone',     'type','tel',      'label','電話番号',         'required',true,  'enabled',true),
        jsonb_build_object('id','customer_postal_code','type','text',    'label','郵便番号',         'required',false, 'enabled',false),
        jsonb_build_object('id','customer_address',   'type','textarea', 'label','住所',             'required',false, 'enabled',false),
        jsonb_build_object('id','customer_birth_date','type','date',     'label','生年月日',         'required',false, 'enabled',false),
        jsonb_build_object('id','customer_gender',    'type','radio',    'label','性別',             'required',false, 'enabled',false),
        jsonb_build_object('id','reservation_date',   'type','date',     'label','受取希望日',       'required',true,  'enabled',true),
        jsonb_build_object('id','special_requests',   'type','textarea', 'label','ご要望・備考',     'required',false, 'enabled',true)
      )
    ),
    jsonb_build_object(
      'showProgress', true,
      'allowEdit',    true,
      'confirmationMessage','ご予約ありがとうございました。確認のお電話をさせていただきます。',
      'businessName',      '片桐商店 ベジライス'
    ),
    true, NULL, NULL,
    1,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description,
    form_fields = EXCLUDED.form_fields,
    settings    = EXCLUDED.settings,
    is_active   = EXCLUDED.is_active,
    updated_at  = NOW();
