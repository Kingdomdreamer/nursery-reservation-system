-- 種苗店予約システム - データベーススキーマ更新SQL
-- Generated based on system specifications and current table structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types for status fields
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'ready', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'partial', 'refunded');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'delivered');
CREATE TYPE change_type AS ENUM ('manual', 'reservation', 'return', 'adjustment');
CREATE TYPE notification_type AS ENUM ('confirmation', 'reminder', 'status_update');
CREATE TYPE template_type AS ENUM ('confirmation', 'reminder', 'status_update', 'welcome');
CREATE TYPE contact_method AS ENUM ('email', 'phone', 'line');
CREATE TYPE field_type AS ENUM ('text', 'email', 'phone', 'date', 'time', 'select', 'multiselect', 'textarea', 'checkbox', 'radio', 'number');

-- Update existing tables to match specifications

-- Update customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS prefecture VARCHAR(50),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS preferred_contact_method contact_method DEFAULT 'email';

-- Update products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS min_order_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_order_quantity INTEGER,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS seasonal_availability JSONB;

-- Update reservations table
-- First, handle the status column type change with existing data
ALTER TABLE reservations 
ALTER COLUMN status DROP DEFAULT,
ALTER COLUMN status TYPE reservation_status USING status::reservation_status,
ALTER COLUMN status SET DEFAULT 'pending'::reservation_status;

-- Handle payment_status column type change
ALTER TABLE reservations 
ALTER COLUMN payment_status DROP DEFAULT,
ALTER COLUMN payment_status TYPE payment_status USING payment_status::payment_status,
ALTER COLUMN payment_status SET DEFAULT 'unpaid'::payment_status;

-- Add discount_amount column
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

-- Update form_configurations table
-- First, drop any existing policies that depend on the id column
DROP POLICY IF EXISTS "有効なフォーム設定は誰でも参照可能" ON form_configurations;
DROP POLICY IF EXISTS "active_forms_public_read" ON form_configurations;
DROP POLICY IF EXISTS "public_read_active_forms" ON form_configurations;

-- Then change the column type
ALTER TABLE form_configurations 
ALTER COLUMN id TYPE TEXT;

-- Recreate the policy after column type change
CREATE POLICY "public_read_active_forms" ON form_configurations 
FOR SELECT TO anon, authenticated 
USING (is_active = true AND (valid_from IS NULL OR valid_from <= now()) AND (valid_to IS NULL OR valid_to >= now()));

-- Update form_fields table
-- Handle field_type column type change
ALTER TABLE form_fields 
ALTER COLUMN field_type DROP DEFAULT,
ALTER COLUMN field_type TYPE field_type USING field_type::field_type,
ALTER COLUMN field_type SET DEFAULT 'text'::field_type;

-- Add new columns
ALTER TABLE form_fields 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;

-- Update notification_history table
-- Handle status column type change
ALTER TABLE notification_history 
ALTER COLUMN status DROP DEFAULT,
ALTER COLUMN status TYPE notification_status USING status::notification_status,
ALTER COLUMN status SET DEFAULT 'pending'::notification_status;

-- Handle notification_type column type change
ALTER TABLE notification_history 
ALTER COLUMN notification_type DROP DEFAULT,
ALTER COLUMN notification_type TYPE notification_type USING notification_type::notification_type,
ALTER COLUMN notification_type SET DEFAULT 'confirmation'::notification_type;

-- Update line_templates table
-- Handle template_type column type change
ALTER TABLE line_templates 
ALTER COLUMN template_type DROP DEFAULT,
ALTER COLUMN template_type TYPE template_type USING template_type::template_type,
ALTER COLUMN template_type SET DEFAULT 'confirmation'::template_type;

-- Update stock_history table
-- Handle change_type column type change
ALTER TABLE stock_history 
ALTER COLUMN change_type DROP DEFAULT,
ALTER COLUMN change_type TYPE change_type USING change_type::change_type,
ALTER COLUMN change_type SET DEFAULT 'manual'::change_type;

-- Create missing indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_line_user_id ON customers(line_user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_reservation_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_form_id ON reservations(form_id);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation_id ON reservation_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_items_product_id ON reservation_items(product_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_form_products_form_id ON form_products(form_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_reservation_id ON notification_history(reservation_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_business_calendar_date ON business_calendar(date);
CREATE INDEX IF NOT EXISTS idx_system_settings_setting_key ON system_settings(setting_key);

-- Add foreign key constraints
ALTER TABLE products 
ADD CONSTRAINT fk_products_category_id 
FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL;

ALTER TABLE reservations 
ADD CONSTRAINT fk_reservations_customer_id 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

ALTER TABLE reservation_items 
ADD CONSTRAINT fk_reservation_items_reservation_id 
FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_reservation_items_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE form_products 
ADD CONSTRAINT fk_form_products_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE notification_history 
ADD CONSTRAINT fk_notification_history_reservation_id 
FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_notification_history_template_id 
FOREIGN KEY (template_id) REFERENCES line_templates(id) ON DELETE SET NULL;

ALTER TABLE stock_history 
ADD CONSTRAINT fk_stock_history_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_stock_history_admin_user_id 
FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL;

ALTER TABLE product_variations 
ADD CONSTRAINT fk_product_variations_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Add check constraints
ALTER TABLE products 
ADD CONSTRAINT chk_products_price_positive CHECK (price >= 0),
ADD CONSTRAINT chk_products_stock_non_negative CHECK (stock_quantity >= 0),
ADD CONSTRAINT chk_products_min_order_positive CHECK (min_order_quantity > 0),
ADD CONSTRAINT chk_products_max_order_valid CHECK (max_order_quantity IS NULL OR max_order_quantity >= min_order_quantity);

ALTER TABLE reservations 
ADD CONSTRAINT chk_reservations_amounts_non_negative CHECK (
    total_amount >= 0 AND 
    discount_amount >= 0 AND 
    final_amount >= 0
),
ADD CONSTRAINT chk_reservations_pickup_time_valid CHECK (
    pickup_time_start IS NULL OR 
    pickup_time_end IS NULL OR 
    pickup_time_start <= pickup_time_end
);

ALTER TABLE reservation_items 
ADD CONSTRAINT chk_reservation_items_quantity_positive CHECK (quantity > 0),
ADD CONSTRAINT chk_reservation_items_prices_non_negative CHECK (
    unit_price >= 0 AND 
    subtotal >= 0
);

ALTER TABLE product_variations 
ADD CONSTRAINT chk_product_variations_price_non_negative CHECK (price >= 0),
ADD CONSTRAINT chk_product_variations_stock_non_negative CHECK (stock_quantity >= 0);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at column (drop existing ones first)
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
DROP TRIGGER IF EXISTS update_reservation_items_updated_at ON reservation_items;
DROP TRIGGER IF EXISTS update_product_categories_updated_at ON product_categories;
DROP TRIGGER IF EXISTS update_product_variations_updated_at ON product_variations;
DROP TRIGGER IF EXISTS update_form_configurations_updated_at ON form_configurations;
DROP TRIGGER IF EXISTS update_form_fields_updated_at ON form_fields;
DROP TRIGGER IF EXISTS update_form_products_updated_at ON form_products;
DROP TRIGGER IF EXISTS update_forms_updated_at ON forms;
DROP TRIGGER IF EXISTS update_line_templates_updated_at ON line_templates;
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
DROP TRIGGER IF EXISTS update_business_calendar_updated_at ON business_calendar;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservation_items_updated_at BEFORE UPDATE ON reservation_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variations_updated_at BEFORE UPDATE ON product_variations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_configurations_updated_at BEFORE UPDATE ON form_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_fields_updated_at BEFORE UPDATE ON form_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_products_updated_at BEFORE UPDATE ON form_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_line_templates_updated_at BEFORE UPDATE ON line_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_calendar_updated_at BEFORE UPDATE ON business_calendar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraints for ON CONFLICT to work
ALTER TABLE product_categories ADD CONSTRAINT unique_product_category_name UNIQUE (name);
ALTER TABLE system_settings ADD CONSTRAINT unique_system_setting_key UNIQUE (setting_key);

-- Insert default data
INSERT INTO product_categories (id, name, description, display_order, is_active) VALUES 
(uuid_generate_v4(), '種子', '野菜・花の種子', 1, true),
(uuid_generate_v4(), '苗', '野菜・花の苗', 2, true),
(uuid_generate_v4(), '用土', '培養土・肥料', 3, true),
(uuid_generate_v4(), '資材', '園芸用資材', 4, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO system_settings (id, setting_key, setting_value, description, is_public) VALUES 
(uuid_generate_v4(), 'business_hours', '{"start": "09:00", "end": "17:00"}', '営業時間設定', true),
(uuid_generate_v4(), 'pickup_time_slots', '["09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"]', '受取時間スロット', true),
(uuid_generate_v4(), 'notification_settings', '{"email_enabled": true, "line_enabled": true, "sms_enabled": false}', '通知設定', false),
(uuid_generate_v4(), 'reservation_settings', '{"max_days_ahead": 30, "min_hours_ahead": 24}', '予約設定', true)
ON CONFLICT (setting_key) DO NOTHING;

-- RLS (Row Level Security) policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_configurations ENABLE ROW LEVEL SECURITY;

-- Admin access policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS admin_all_access ON customers;
DROP POLICY IF EXISTS admin_all_access ON products;
DROP POLICY IF EXISTS admin_all_access ON reservations;
DROP POLICY IF EXISTS admin_all_access ON reservation_items;
DROP POLICY IF EXISTS admin_all_access ON admin_users;

CREATE POLICY admin_customers_access ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY admin_products_access ON products FOR ALL TO authenticated USING (true);
CREATE POLICY admin_reservations_access ON reservations FOR ALL TO authenticated USING (true);
CREATE POLICY admin_reservation_items_access ON reservation_items FOR ALL TO authenticated USING (true);
CREATE POLICY admin_users_access ON admin_users FOR ALL TO authenticated USING (true);

-- Public read access for products
DROP POLICY IF EXISTS public_read_products ON products;
CREATE POLICY public_read_products ON products FOR SELECT TO anon USING (is_available = true);

-- Public insert access for reservations (customer can create)
DROP POLICY IF EXISTS public_insert_reservations ON reservations;
DROP POLICY IF EXISTS public_insert_customers ON customers;
DROP POLICY IF EXISTS public_insert_reservation_items ON reservation_items;

CREATE POLICY public_insert_reservations ON reservations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY public_insert_customers ON customers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY public_insert_reservation_items ON reservation_items FOR INSERT TO anon WITH CHECK (true);

COMMENT ON DATABASE postgres IS '種苗店予約システム - Database Schema Updated';