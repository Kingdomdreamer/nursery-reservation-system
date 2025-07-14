-- ─────────────────────────────────────────────────────────────
-- Nursery Reservation System – 完全版 SQL スクリプト
-- テーブル定義、マイグレーション、インデックス、トリガー、RLS
-- （サンプルデータは含まれていません）
-- ─────────────────────────────────────────────────────────────

-- 0) 拡張機能
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) 顧客テーブル
CREATE TABLE IF NOT EXISTS customers (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100)   NOT NULL,
  furigana    VARCHAR(100),
  email       VARCHAR(255),
  phone       VARCHAR(20)    NOT NULL,
  postal_code VARCHAR(8),
  prefecture  VARCHAR(20),
  city        VARCHAR(50),
  address     TEXT,
  birth_date  DATE,
  gender      VARCHAR(10),
  created_at  TIMESTAMPTZ    DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    DEFAULT NOW()
);

-- 2) 商品カテゴリテーブル
CREATE TABLE IF NOT EXISTS product_categories (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100)   NOT NULL,
  description   TEXT,
  display_order INTEGER        DEFAULT 0,
  is_active     BOOLEAN        DEFAULT true,
  created_at    TIMESTAMPTZ    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    DEFAULT NOW()
);

-- 3) 商品テーブル
CREATE TABLE IF NOT EXISTS products (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    UUID           REFERENCES product_categories(id) ON DELETE SET NULL,
  name           VARCHAR(200)   NOT NULL,
  description    TEXT,
  price          DECIMAL(10,2)  NOT NULL,
  variation_name VARCHAR(100),
  stock_quantity INTEGER,
  unit           VARCHAR(20)    DEFAULT '個',
  is_available   BOOLEAN        DEFAULT true,
  display_order  INTEGER        DEFAULT 0,
  image_url      TEXT,
  created_at     TIMESTAMPTZ    DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    DEFAULT NOW()
);

-- 4) 商品バリエーションテーブル
CREATE TABLE IF NOT EXISTS product_variations (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID           REFERENCES products(id) ON DELETE CASCADE,
  name           VARCHAR(100)   NOT NULL,
  price          DECIMAL(10,2)  NOT NULL,
  stock_quantity INTEGER        DEFAULT 0,
  display_order  INTEGER        DEFAULT 0,
  created_at     TIMESTAMPTZ    DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    DEFAULT NOW()
);

-- 5) フォーム設定テーブル
CREATE TABLE IF NOT EXISTS forms (
  id                   VARCHAR(100)   PRIMARY KEY,
  name                 VARCHAR(200)   NOT NULL,
  description          TEXT,
  show_progress        BOOLEAN        DEFAULT true,
  allow_edit           BOOLEAN        DEFAULT true,
  confirmation_message TEXT,
  business_name        VARCHAR(200),
  valid_from           TIMESTAMPTZ,
  valid_to             TIMESTAMPTZ,
  is_active            BOOLEAN        DEFAULT true,
  created_at           TIMESTAMPTZ    DEFAULT NOW(),
  updated_at           TIMESTAMPTZ    DEFAULT NOW()
);

-- 6) フォームフィールドテーブル
CREATE TABLE IF NOT EXISTS form_fields (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id       VARCHAR(100)  REFERENCES forms(id) ON DELETE CASCADE,
  field_id      VARCHAR(100)  NOT NULL,
  field_type    VARCHAR(50)   NOT NULL,
  label         VARCHAR(200)  NOT NULL,
  placeholder   TEXT,
  is_required   BOOLEAN       DEFAULT false,
  options       JSONB,
  description   TEXT,
  category      VARCHAR(50),
  is_enabled    BOOLEAN       DEFAULT true,
  display_order INTEGER       DEFAULT 0,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- 7) フォーム商品テーブル
CREATE TABLE IF NOT EXISTS form_products (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id        VARCHAR(100)   REFERENCES forms(id) ON DELETE CASCADE,
  product_id     UUID           REFERENCES products(id) ON DELETE CASCADE,
  selected_price DECIMAL(10,2),
  variation_name VARCHAR(100),
  display_order  INTEGER        DEFAULT 0,
  created_at     TIMESTAMPTZ    DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    DEFAULT NOW()
);

-- 8) 予約テーブル（form_id & form_data を含む）
CREATE TABLE IF NOT EXISTS reservations (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id          VARCHAR(100)   REFERENCES forms(id) ON DELETE SET NULL,
  customer_id      UUID           REFERENCES customers(id) ON DELETE SET NULL,
  form_data        JSONB          NOT NULL DEFAULT '{}'::JSONB,
  total_amount     DECIMAL(10,2)  DEFAULT 0,
  status           VARCHAR(20)    DEFAULT 'pending',
  reservation_date DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ    DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    DEFAULT NOW()
);

-- 9) 予約商品テーブル
CREATE TABLE IF NOT EXISTS reservation_items (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID           REFERENCES reservations(id) ON DELETE CASCADE,
  product_id     UUID           REFERENCES products(id) ON DELETE SET NULL,
  product_name   VARCHAR(200)   NOT NULL,
  variation_name VARCHAR(100),
  quantity       INTEGER        NOT NULL DEFAULT 1,
  unit_price     DECIMAL(10,2)  NOT NULL,
  total_price    DECIMAL(10,2)  NOT NULL,
  created_at     TIMESTAMPTZ    DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- マイグレーション：既存reservationsに不足カラムを追加
-- ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS reservations
  ADD COLUMN IF NOT EXISTS form_id   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS form_data JSONB         NOT NULL DEFAULT '{}'::JSONB;

-- ─────────────────────────────────────────────────────────────
-- インデックス
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_customers_phone                  ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email                  ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at             ON customers(created_at);

CREATE INDEX IF NOT EXISTS idx_products_category_id             ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available            ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_display_order           ON products(display_order);

CREATE INDEX IF NOT EXISTS idx_product_variations_product_id    ON product_variations(product_id);

CREATE INDEX IF NOT EXISTS idx_forms_is_active                  ON forms(is_active);
CREATE INDEX IF NOT EXISTS idx_forms_created_at                 ON forms(created_at);

CREATE INDEX IF NOT EXISTS idx_form_fields_form_id              ON form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_display_order        ON form_fields(display_order);

CREATE INDEX IF NOT EXISTS idx_form_products_form_id            ON form_products(form_id);
CREATE INDEX IF NOT EXISTS idx_form_products_product_id         ON form_products(product_id);

CREATE INDEX IF NOT EXISTS idx_reservations_form_id             ON reservations(form_id);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_id         ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status              ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at          ON reservations(created_at);
CREATE INDEX IF NOT EXISTS idx_reservations_reservation_date    ON reservations(reservation_date);

CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation_id ON reservation_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_items_product_id     ON reservation_items(product_id);

-- ─────────────────────────────────────────────────────────────
-- トリガー: updated_at 自動更新
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'customers','product_categories','products','product_variations',
      'forms','form_fields','form_products','reservations','reservation_items'
    ])
  LOOP
    IF to_regclass('public.'||tbl) IS NOT NULL THEN
      EXECUTE format($fmt$
        DROP TRIGGER IF EXISTS trg_%1$I_updated_at ON %1$I;
        CREATE TRIGGER trg_%1$I_updated_at
          BEFORE UPDATE ON %1$I
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      $fmt$, tbl);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- RLS ポリシー設定（存在チェック付き）
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'customers','product_categories','products','product_variations',
      'forms','form_fields','form_products','reservations','reservation_items'
    ])
  LOOP
    IF to_regclass('public.'||tbl) IS NOT NULL THEN
      EXECUTE format($fmt$
        ALTER TABLE %1$I ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS %1$I_policy ON %1$I;
        CREATE POLICY %1$I_policy ON %1$I FOR ALL USING (true);
      $fmt$, tbl);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 完了メッセージ
SELECT '✅ Nursery Reservation DB schema, migrations, triggers & RLS applied.' AS message;
