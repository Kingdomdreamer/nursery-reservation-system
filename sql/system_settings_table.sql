-- システム設定テーブル作成
CREATE TABLE IF NOT EXISTS public.system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 初期設定データの挿入
INSERT INTO public.system_settings (setting_key, setting_value) VALUES 
('general_settings', '{"site_name":"ベジライス予約システム","site_description":"LINE ミニアプリ対応の種苗店予約システム","contact_email":"contact@vegirice.com","contact_phone":"03-1234-5678"}'),
('notification_settings', '{"email_enabled":true,"line_enabled":true,"sms_enabled":false,"reminder_hours":24}'),
('business_settings', '{"business_hours_start":"09:00","business_hours_end":"18:00","business_days":["月","火","水","木","金","土"],"holiday_mode":false}'),
('advanced_settings', '{"auto_confirm_orders":false,"require_phone_verification":true,"max_reservation_days":30,"default_pickup_duration":60}')
ON CONFLICT (setting_key) DO NOTHING;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);

-- テーブルにコメントを追加
COMMENT ON TABLE public.system_settings IS 'システム設定を保存するテーブル';
COMMENT ON COLUMN public.system_settings.setting_key IS '設定キー';
COMMENT ON COLUMN public.system_settings.setting_value IS '設定値（JSONB形式）';
COMMENT ON COLUMN public.system_settings.created_at IS '作成日時';
COMMENT ON COLUMN public.system_settings.updated_at IS '更新日時';