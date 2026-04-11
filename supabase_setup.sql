-- ============================================================
-- GHAR KA KHANA — Complete Supabase Setup
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- 1. MEALS TABLE
create table if not exists meals (
  id bigint generated always as identity primary key,
  name text not null,
  type text default 'Vegetarian',
  description text,
  components text[],
  price numeric default 12,
  sold int default 0,
  special boolean default false,
  enabled boolean default true,
  created_at timestamptz default now()
);

-- 2. ORDERS TABLE
create table if not exists orders (
  id bigint generated always as identity primary key,
  meal_id bigint references meals(id),
  meal_name text,
  customer_name text not null,
  phone text not null,
  notes text,
  created_at timestamptz default now()
);

-- 3. SETTINGS TABLE
create table if not exists settings (
  id int primary key default 1,
  daily_limit int default 4,
  base_price numeric default 12,
  currency text default '£',
  updated_at timestamptz default now()
);

-- Insert default settings row
insert into settings (id, daily_limit, base_price, currency)
values (1, 4, 12, '£')
on conflict (id) do nothing;

-- 4. INCREMENT SOLD FUNCTION
-- This safely increments the sold count when an order is placed
create or replace function increment_sold(meal_id bigint)
returns void as $$
  update meals set sold = sold + 1 where id = meal_id;
$$ language sql;

-- 5. ROW LEVEL SECURITY
-- Allow anyone to read meals and settings (public menu)
alter table meals enable row level security;
alter table orders enable row level security;
alter table settings enable row level security;

-- Meals: anyone can read enabled meals
create policy "Public can view meals" on meals
  for select using (true);

-- Meals: anyone can insert/update/delete (controlled by admin password in app)
create policy "Anyone can manage meals" on meals
  for all using (true);

-- Orders: anyone can insert an order
create policy "Anyone can place orders" on orders
  for insert with check (true);

-- Orders: anyone can read orders (admin views them)
create policy "Anyone can view orders" on orders
  for select using (true);

-- Orders: allow delete for reset
create policy "Anyone can delete orders" on orders
  for delete using (true);

-- Settings: anyone can read and update
create policy "Anyone can view settings" on settings
  for select using (true);

create policy "Anyone can update settings" on settings
  for all using (true);

-- 6. SAMPLE MEALS (optional — delete these and add your own)
insert into meals (name, type, description, components, price, sold, special, enabled)
values
  (
    'Dal Makhani Thali',
    'Vegetarian',
    'Rich creamy black lentils slow-cooked overnight with butter and cream, served with fragrant basmati rice, seasonal sabzi, fresh kachumber salad and gulab jamun.',
    array['Rice', 'Dal Makhani', 'Aloo Gobhi', 'Kachumber Salad', 'Gulab Jamun'],
    12, 0, false, true
  ),
  (
    'Rajma Chawal Special',
    'Vegetarian',
    'Punjabi-style kidney beans in a robust tomato-onion masala, served with jeera rice, paneer bhurji, cucumber raita and a warm motichoor ladoo.',
    array['Jeera Rice', 'Rajma', 'Paneer Bhurji', 'Cucumber Raita', 'Motichoor Ladoo'],
    12, 0, false, true
  ),
  (
    'Palak Paneer Bowl',
    'Vegetarian',
    'Velvety spinach curry with soft paneer cubes, paired with plain rice, mixed vegetable sabzi, boondi raita and a piece of besan barfi.',
    array['Plain Rice', 'Palak Paneer', 'Mix Veg', 'Boondi Raita', 'Besan Barfi'],
    12, 0, false, true
  );

-- ============================================================
-- DONE! Your database is ready.
-- ============================================================
