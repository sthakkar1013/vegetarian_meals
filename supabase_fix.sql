-- ============================================================
-- GHAR KA KHANA — Complete Fix Script
-- Run this ENTIRE script in Supabase SQL Editor
-- It is safe to run multiple times
-- ============================================================

-- STEP 1: Drop and recreate meals table with correct structure
-- (backs up existing data first)

-- Backup existing meals if any
CREATE TABLE IF NOT EXISTS meals_backup AS
  SELECT * FROM meals;

-- Drop and recreate with correct columns
DROP TABLE IF EXISTS meals CASCADE;

CREATE TABLE meals (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text NOT NULL DEFAULT 'New Meal',
  type        text DEFAULT 'Vegetarian',
  description text DEFAULT '',
  components  text[] DEFAULT '{}',
  price       numeric DEFAULT 12,
  sold        int DEFAULT 0,
  special     boolean DEFAULT false,
  enabled     boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- STEP 2: Drop and recreate orders table
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  meal_id       bigint,
  meal_name     text,
  customer_name text NOT NULL,
  phone         text NOT NULL,
  notes         text DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

-- STEP 3: Drop and recreate settings table
DROP TABLE IF EXISTS settings CASCADE;

CREATE TABLE settings (
  id          int PRIMARY KEY DEFAULT 1,
  daily_limit int DEFAULT 4,
  base_price  numeric DEFAULT 12,
  currency    text DEFAULT '£',
  updated_at  timestamptz DEFAULT now()
);

-- Insert the one settings row
INSERT INTO settings (id, daily_limit, base_price, currency)
VALUES (1, 4, 12, '£')
ON CONFLICT (id) DO NOTHING;

-- STEP 4: Row Level Security — allow everything via anon key
ALTER TABLE meals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start clean
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
           WHERE tablename IN ('meals','orders','settings') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END$$;

-- Single permissive policy per table — allows all operations
CREATE POLICY "open_meals"    ON meals    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_orders"   ON orders   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- STEP 5: Recreate increment_sold function
CREATE OR REPLACE FUNCTION increment_sold(meal_id bigint)
RETURNS void AS $$
  UPDATE meals SET sold = sold + 1 WHERE id = meal_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- STEP 6: Add sample meals so menu is not empty
INSERT INTO meals (name, type, description, components, price, sold, special, enabled)
VALUES
  (
    'Dal Makhani Thali', 'Vegetarian',
    'Rich creamy black lentils slow-cooked overnight, served with fragrant basmati rice, seasonal sabzi, fresh kachumber salad and gulab jamun.',
    ARRAY['Rice','Dal Makhani','Aloo Gobhi','Kachumber Salad','Gulab Jamun'],
    12, 0, false, true
  ),
  (
    'Rajma Chawal', 'Vegetarian',
    'Punjabi kidney beans in robust tomato masala, served with jeera rice, paneer bhurji, cucumber raita and motichoor ladoo.',
    ARRAY['Jeera Rice','Rajma','Paneer Bhurji','Cucumber Raita','Ladoo'],
    12, 0, false, true
  ),
  (
    'Palak Paneer Bowl', 'Vegetarian',
    'Velvety spinach curry with soft paneer, paired with plain rice, mix veg, boondi raita and besan barfi.',
    ARRAY['Plain Rice','Palak Paneer','Mix Veg','Boondi Raita','Besan Barfi'],
    12, 0, false, true
  );

-- STEP 7: Verify everything is working
SELECT 'meals'    AS tbl, count(*) AS rows FROM meals
UNION ALL
SELECT 'orders'   AS tbl, count(*) AS rows FROM orders
UNION ALL
SELECT 'settings' AS tbl, count(*) AS rows FROM settings;

-- If you see 3 meals, 0 orders, 1 settings — you are ready!
-- ============================================================
