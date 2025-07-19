-- ==============================================
-- 🌱 保育園・種苗店予約システム – 完全再構築SQL (仕様書 v1.4.0 準拠)
-- ==============================================

-- 0. 拡張機能
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid() 用

-- 1. customers (顧客)
DROP TABLE IF EXISTS customers CASCADE;
CREATE TABLE customers (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    VARCHAR(100) NOT NULL,
  phone        VARCHAR(15)  NOT NULL,
  email        VARCHAR(255),
  postal_code  VARCHAR(8),
  address      TEXT,
  line_user_id VARCHAR(50),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);  -- :contentReference[oaicite:0]{index=0} L5-L17

-- 2. product_categories (商品カテゴリ)
DROP TABLE IF EXISTS product_categories CASCADE;
CREATE TABLE product_categories (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id  UUID    REFERENCES product_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);  -- :contentReference[oaicite:1]{index=1} L42-L53

-- 3. products (商品)
DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products (
  id                 UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name               VARCHAR(200) NOT NULL,
  description        TEXT,
  price              DECIMAL(10,2) NOT NULL DEFAULT 0,
  category_id        UUID    REFERENCES product_categories(id),
  unit               VARCHAR(20),
  min_order_quantity INTEGER DEFAULT 1,
  max_order_quantity INTEGER,
  variation_name     VARCHAR(100),
  image_url          TEXT,
  barcode            VARCHAR(50),
  tax_type           VARCHAR(20) DEFAULT 'inclusive',
  is_available       BOOLEAN DEFAULT true,
  display_order      INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);  -- :contentReference[oaicite:2]{index=2} L19-L27

-- 4. reservations (予約)
DROP TABLE IF EXISTS reservations CASCADE;
CREATE TABLE reservations (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_number   VARCHAR(20) NOT NULL UNIQUE,
  customer_id          UUID    NOT NULL REFERENCES customers(id),
  reservation_date     DATE    NOT NULL,
  pickup_time_start    TIME    NOT NULL,
  pickup_time_end      TIME    NOT NULL,
  status               VARCHAR(20) DEFAULT 'pending',
  payment_status       VARCHAR(20) DEFAULT 'unpaid',
  total_amount         DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount      DECIMAL(10,2) DEFAULT 0,
  final_amount         DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes                TEXT,
  admin_notes          TEXT,
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at     TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);  -- :contentReference[oaicite:3]{index=3} L3-L11

-- 5. reservation_items (予約商品)
DROP TABLE IF EXISTS reservation_items CASCADE;
CREATE TABLE reservation_items (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID    NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  product_id     UUID    NOT NULL REFERENCES products(id),
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  unit_price     DECIMAL(10,2) NOT NULL,
  subtotal       DECIMAL(10,2) NOT NULL,
  pickup_date    DATE    NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);  -- :contentReference[oaicite:4]{index=4} L24-L32

-- 6. forms (フォーム)
DROP TABLE IF EXISTS forms CASCADE;
CREATE TABLE forms (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  description TEXT,
  is_active  BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ,
  valid_to   TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);  -- :contentReference[oaicite:5]{index=5} L39-L47

-- 7. form_configurations (フォーム設定)
DROP TABLE IF EXISTS form_configurations CASCADE;
CREATE TABLE form_configurations (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id     UUID    NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  form_fields JSONB   NOT NULL DEFAULT '[]',
  settings    JSONB   DEFAULT '{}',
  is_active   BOOLEAN DEFAULT true,
  valid_from  TIMESTAMPTZ,
  valid_to    TIMESTAMPTZ,
  version     INTEGER DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);  -- :contentReference[oaicite:6]{index=6} L55-L63

-- 8. form_fields (フォームフィールド)
DROP TABLE IF EXISTS form_fields CASCADE;
CREATE TABLE form_fields (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id          UUID    NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  field_type       VARCHAR(50)  NOT NULL,
  field_name       VARCHAR(100) NOT NULL,
  field_label      VARCHAR(200) NOT NULL,
  field_options    JSONB   DEFAULT '[]',
  is_required      BOOLEAN DEFAULT false,
  validation_rules JSONB   DEFAULT '{}',
  display_order    INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);  -- :contentReference[oaicite:7]{index=7} L73-L81

-- 9. form_products (フォーム商品関連)
DROP TABLE IF EXISTS form_products CASCADE;
CREATE TABLE form_products (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id       UUID    NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  product_id    UUID    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_required   BOOLEAN DEFAULT false,
  max_quantity  INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);  -- :contentReference[oaicite:8]{index=8} L3-L11

-- 10. form_display_settings (フォーム表示設定)
DROP TABLE IF EXISTS form_display_settings CASCADE;
CREATE TABLE form_display_settings (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id             UUID    NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  show_prices         BOOLEAN DEFAULT true,
  price_display_mode  VARCHAR(20) DEFAULT 'full',
  show_categories     BOOLEAN DEFAULT true,
  show_descriptions   BOOLEAN DEFAULT true,
  custom_css          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);  -- :contentReference[oaicite:9]{index=9} L15-L23

-- 11. pricing_display_settings (価格表示設定)
DROP TABLE IF EXISTS pricing_display_settings CASCADE;
CREATE TABLE pricing_display_settings (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id              UUID    NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  show_item_prices     BOOLEAN DEFAULT true,
  show_subtotals       BOOLEAN DEFAULT true,
  show_total           BOOLEAN DEFAULT true,
  show_tax_breakdown   BOOLEAN DEFAULT false,
  price_format         VARCHAR(20) DEFAULT 'currency',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);  -- :contentReference[oaicite:10]{index=10} L30-L38

-- 12. notifications (通知)
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID    REFERENCES user_profiles(id),
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT    NOT NULL,
  action_url TEXT,
  is_read    BOOLEAN DEFAULT false,
  priority   VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);  -- :contentReference[oaicite:11]{index=11} L45-L53

-- 13. system_settings (システム設定)
DROP TABLE IF EXISTS system_settings CASCADE;
CREATE TABLE system_settings (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  category    VARCHAR(50) NOT NULL,
  key         VARCHAR(100) NOT NULL,
  value       JSONB   NOT NULL DEFAULT '{}',
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, key)
);  -- :contentReference[oaicite:12]{index=12} L3-L12

-- 14. user_profiles (ユーザープロファイル)
DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE TABLE user_profiles (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID    NOT NULL REFERENCES auth.users(id),
  role          VARCHAR(20) DEFAULT 'admin',
  full_name     VARCHAR(100),
  email         VARCHAR(255),
  phone         VARCHAR(15),
  is_active     BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);  -- :contentReference[oaicite:13]{index=13} L16-L24

-- 15. line_templates (LINEテンプレート)
DROP TABLE IF EXISTS line_templates CASCADE;
CREATE TABLE line_templates (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type    VARCHAR(50) NOT NULL,
  template_name    VARCHAR(100) NOT NULL,
  template_content TEXT    NOT NULL,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);  -- :contentReference[oaicite:14]{index=14} L32-L42

-- 16. export_history (エクスポート履歴)
DROP TABLE IF EXISTS export_history CASCADE;
CREATE TABLE export_history (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type  VARCHAR(50) NOT NULL,
  exported_by  UUID    REFERENCES user_profiles(id),
  file_name    VARCHAR(255),
  file_size    INTEGER,
  status       VARCHAR(20) DEFAULT 'pending',
  download_url TEXT,
  exported_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ
);  -- :contentReference[oaicite:15]{index=15} L3-L7

-- 17. パフォーマンスインデックス
CREATE INDEX idx_reservations_date             ON reservations(reservation_date);
CREATE INDEX idx_reservations_status           ON reservations(status);
CREATE INDEX idx_reservations_customer         ON reservations(customer_id);
CREATE INDEX idx_customers_phone               ON customers(phone);
CREATE INDEX idx_customers_line_user_id        ON customers(line_user_id);
CREATE INDEX idx_products_category             ON products(category_id);
CREATE INDEX idx_products_available            ON products(is_available);
CREATE INDEX idx_reservation_items_reservation ON reservation_items(reservation_id);
CREATE INDEX idx_reservation_items_product     ON reservation_items(product_id);
CREATE INDEX idx_notifications_user_read       ON notifications(user_id, is_read);
CREATE INDEX idx_forms_active                  ON forms(is_active);  -- :contentReference[oaicite:16]{index=16} L35-L43
