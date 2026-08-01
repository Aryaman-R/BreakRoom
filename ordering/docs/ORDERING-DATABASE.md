# Ordering System — Database

> Scope reminder: this is the **pickup-ordering system's** database only. Run this SQL in the Supabase SQL editor (or save it as a migration). It is the complete Phase 1 schema.

The same SQL is checked in under `supabase/migrations/`, split by when it landed. **A database created before the kiosk walk-in work also needs `0004_kiosk_walkin.sql`** — the schema below already includes it.

## Tables

```sql
-- MENU ------------------------------------------------------------
-- variants: optional REQUIRED single choice that SETS the unit price
--           (wing count, yakisoba protein, 12oz/16oz). Absolute prices.
--           null = item just uses price_cents.
-- addons:   optional multi-select priced extras ADDED to the unit price
--           (boba toppings, avocado, bacon, combo upgrades).
-- notes_prompt: hint shown above the notes box for non-price choices
--           (bread, sauce, sweetness, ice, side picks).
create table menu_items (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text not null default '',
  price_cents  integer not null check (price_cents >= 0),
  category     text not null default 'Other',
  variants     jsonb,            -- e.g. [{"label":"8 pc","price_cents":1299}, ...]
  addons       jsonb,            -- e.g. [{"label":"Boba","price_cents":50}, ...]
  notes_prompt text not null default '',
  available    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ORDERS ----------------------------------------------------------
-- phone: E.164, and null ONLY for a kiosk walk-in — the one surface where
--        the customer is standing in front of us, so staff call the name
--        instead of texting it. The check constraint is what keeps a forged
--        source field from turning into an anonymous web order.
create table orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  integer not null,             -- resets daily, shown as "#47"
  order_date    date not null default current_date,
  customer_name text not null,
  phone         text,                         -- E.164; null = kiosk walk-in
  status        text not null default 'new'
                check (status in ('new','call_to_confirm','accepted',
                                  'ready','picked_up','no_show','cancelled')),
  total_cents   integer not null,             -- recomputed server-side, never client
  source        text not null default 'web'
                check (source in ('web','qr','kiosk')),
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  ready_at      timestamptz,
  unique (order_date, order_number),
  constraint orders_phone_required_off_kiosk
    check (phone is not null or source = 'kiosk')
);

-- ORDER ITEMS (everything snapshotted at purchase) ----------------
create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  menu_item_id  uuid references menu_items(id),
  item_name     text not null,
  variant_label text not null default '',     -- e.g. "8 pc", "16oz"
  addons        jsonb not null default '[]',  -- chosen [{"label","price_cents"}]
  price_cents   integer not null,             -- final UNIT price incl. variant + addons
  quantity      integer not null check (quantity > 0),
  notes         text not null default ''
);

-- PHONE VERIFICATION ----------------------------------------------
create table verification_codes (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null,
  code       text not null,                   -- 6 digits
  expires_at timestamptz not null,            -- created_at + 5 min
  used       boolean not null default false,
  created_at timestamptz not null default now()
);

-- BLOCKLIST -------------------------------------------------------
create table blocked_phones (
  phone      text primary key,
  reason     text not null default '',
  created_at timestamptz not null default now()
);

-- SETTINGS: fraud caps + ordering hours (edited from /admin) ------
create table settings (
  key   text primary key,
  value integer not null
);

insert into settings (key, value) values
  ('call_to_confirm_threshold_cents', 5000),   -- $50: above → staff call first
  ('hard_cap_cents',                 15000),   -- $150: above → rejected
  ('max_qty_per_item',                   5),
  ('max_open_orders_per_phone',          1),
  ('max_orders_per_phone_per_day',       3),
  -- Breakroom hours: every day 9:30 AM – 3:30 PM Pacific.
  -- Minutes from midnight, America/Los_Angeles.
  ('ordering_open_minutes',            570),   -- 9:30 AM
  ('ordering_close_minutes',           930),   -- 3:30 PM
  ('last_order_buffer_minutes',         20),   -- online orders stop 3:10 PM
  -- Kiosk walk-ins (no phone number). The per-phone caps above cannot see
  -- these orders, so they get cafe-wide caps of their own.
  ('allow_walkin_orders',                1),   -- 0 = kiosk must have a number too
  ('max_open_walkin_orders',             5),   -- in flight at once, cafe-wide
  ('max_walkin_per_hour',               20);   -- accepted per rolling hour

-- DAILY ORDER NUMBERS ---------------------------------------------
create table daily_counters (
  counter_date date primary key,
  last_number  integer not null default 0
);

create or replace function next_order_number() returns integer
language plpgsql as $$
declare n integer;
begin
  insert into daily_counters (counter_date, last_number)
  values (current_date, 1)
  on conflict (counter_date)
  do update set last_number = daily_counters.last_number + 1
  returning last_number into n;
  return n;
end $$;
```

## Row Level Security

All writes flow through server API routes using the service role key (which bypasses RLS), so **no client role gets any write policy — ever**.

```sql
alter table menu_items         enable row level security;
alter table orders             enable row level security;
alter table order_items        enable row level security;
alter table verification_codes enable row level security;
alter table blocked_phones     enable row level security;
alter table settings           enable row level security;
alter table daily_counters     enable row level security;

-- customers: see available menu items only
create policy public_menu_read on menu_items
  for select to anon using (available = true);

-- staff: read everything they need
create policy staff_menu_read   on menu_items  for select to authenticated using (true);
create policy staff_orders_read on orders      for select to authenticated using (true);
create policy staff_items_read  on order_items for select to authenticated using (true);

-- verification_codes, blocked_phones, settings, daily_counters:
-- RLS on, NO policies → invisible to every client role. Server-only.
```

## Realtime

```sql
alter publication supabase_realtime add table orders;
```

The staff screen (authenticated) receives insert/update events, filtered by its select policy. The customer status page does **not** use realtime — it polls a sanitized API endpoint, which avoids granting anonymous clients any select policy on `orders`.

## Indexes

```sql
create index orders_status_idx      on orders (status);
create index orders_phone_idx       on orders (phone, created_at);
create index orders_walkin_idx      on orders (created_at) where phone is null;
create index orders_date_idx        on orders (order_date);
create index codes_phone_idx        on verification_codes (phone, created_at);
create index order_items_order_idx  on order_items (order_id);
```

## Seed menu — real Breakroom items

A representative subset with real prices from breakroombothell.com/menu; the owner completes and corrects the rest in `/admin`.

```sql
-- Sandwiches (combos as add-ons; bread/cheese in notes)
insert into menu_items (name, price_cents, category, addons, notes_prompt, sort_order) values
 ('Grilled Cheese', 699,  'Sandwiches',
   '[{"label":"Combo: drink","price_cents":150},{"label":"Combo: drink & fries","price_cents":449}]',
   'Cheese: Swiss, cheddar, provolone, or American · Bread: wheat, sourdough, or white', 1),
 ('BLT', 1099, 'Sandwiches',
   '[{"label":"Combo: drink","price_cents":150},{"label":"Combo: drink & fries","price_cents":449}]',
   'Bread: wheat, sourdough, or white', 2),
 ('Turkey', 1099, 'Sandwiches',
   '[{"label":"Combo: drink","price_cents":150},{"label":"Combo: drink & fries","price_cents":449}]',
   'Bread: wheat, sourdough, or white', 3),
 ('Club', 1299, 'Sandwiches',
   '[{"label":"Combo: drink","price_cents":150},{"label":"Combo: drink & fries","price_cents":449}]',
   'Bread: wheat, sourdough, or white', 4);

-- Rice bowls (side picks in notes)
insert into menu_items (name, price_cents, category, notes_prompt, sort_order) values
 ('Chicken Curry Bowl',   1499, 'Rice Bowls', 'Pick 2 sides: kimchi, green salad, japchae, mac salad', 1),
 ('Orange Chicken Bowl',  1649, 'Rice Bowls', 'Pick 2 sides: kimchi, green salad, japchae, mac salad', 2),
 ('Chicken Katsu Bowl',   1699, 'Rice Bowls', 'Pick 2 sides: kimchi, green salad, japchae, mac salad', 3),
 ('Butter Chicken Bowl',  1699, 'Rice Bowls', 'Pick 2 sides: kimchi, green salad, japchae, mac salad', 4),
 ('Beef Bulgogi Bowl',    1749, 'Rice Bowls', 'Pick 2 sides: kimchi, green salad, japchae, mac salad', 5);

-- Wings & yakisoba (count / protein are price-setting variants)
insert into menu_items (name, price_cents, category, variants, notes_prompt, sort_order) values
 ('Fried Chicken Wings', 899, 'Wings & Yakisoba',
   '[{"label":"4 pc","price_cents":899},{"label":"8 pc","price_cents":1299},{"label":"12 pc","price_cents":1799}]',
   'Sauce: plain, BBQ, Korean, or sweet chili', 1),
 ('Yakisoba', 1399, 'Wings & Yakisoba',
   '[{"label":"Veggie","price_cents":1399}]',
   -- site lists $13.99–$16.99 by protein; add chicken/beef/shrimp/tofu/pork
   -- variants with exact prices in /admin.
   '', 2);

-- Burgers
insert into menu_items (name, price_cents, category, addons, sort_order) values
 ('Cheeseburger', 1099, 'Burgers',
   '[{"label":"Avocado","price_cents":100},{"label":"Bacon","price_cents":199}]', 1),
 ('Korean Chicken Burger', 1199, 'Burgers',
   '[{"label":"Avocado","price_cents":100},{"label":"Bacon","price_cents":199}]', 2),
 ('California Burger', 1299, 'Burgers',
   '[{"label":"Bacon","price_cents":199}]', 3);

-- Sides
insert into menu_items (name, price_cents, category, sort_order) values
 ('French Fries',      499, 'Sides', 1),
 ('Chicken Gyoza (6)', 599, 'Sides', 2),
 ('Pork Egg Roll',     299, 'Sides', 3);

-- Bubble tea (all $6.99; toppings are add-ons; sweetness/ice in notes)
insert into menu_items (name, price_cents, category, addons, notes_prompt, sort_order)
select name, 699, 'Bubble Tea',
 '[{"label":"Boba","price_cents":50},{"label":"Popping boba","price_cents":50},{"label":"Rainbow jelly","price_cents":50},{"label":"Lychee jelly","price_cents":50}]'::jsonb,
 'Sweetness & ice — e.g. 50% sweet, less ice', row_number() over ()
from unnest(array['Milk Tea','Taro','Thai Milk Tea','Matcha','Brown Sugar Milk','Mango Slush']) as name;

-- Coffee & espresso (12oz/16oz variants; alt milk add-on)
insert into menu_items (name, price_cents, category, variants, addons, sort_order) values
 ('Americano', 299, 'Coffee & Espresso',
   '[{"label":"12oz","price_cents":299},{"label":"16oz","price_cents":325}]',
   '[{"label":"Oat milk","price_cents":75},{"label":"Almond milk","price_cents":75}]', 1),
 ('Latte', 449, 'Coffee & Espresso',
   '[{"label":"12oz","price_cents":449},{"label":"16oz","price_cents":499}]',
   '[{"label":"Oat milk","price_cents":75},{"label":"Almond milk","price_cents":75}]', 2),
 ('Mocha', 499, 'Coffee & Espresso',
   '[{"label":"12oz","price_cents":499},{"label":"16oz","price_cents":549}]',
   '[{"label":"Oat milk","price_cents":75},{"label":"Almond milk","price_cents":75}]', 3),
 ('Chai Latte', 449, 'Coffee & Espresso',
   '[{"label":"12oz","price_cents":449},{"label":"16oz","price_cents":499}]',
   '[{"label":"Oat milk","price_cents":75},{"label":"Almond milk","price_cents":75}]', 4);

-- Tea
insert into menu_items (name, price_cents, category, sort_order) values
 ('Chamomile',     249, 'Tea', 1),
 ('Indian Masala', 399, 'Tea', 2);
```

## Field notes

- **Variant and add-on pricing lives in the database**, so the API can validate every submitted choice by label and price entirely server-side. If an item has `variants`, a valid `variant_label` is **required** and sets the unit price; add-on deltas stack on top.
- **`order_items` snapshots `item_name`, `variant_label`, `addons`, and the computed `price_cents`** so menu edits never rewrite order history. `menu_item_id` is a nullable reference kept for stats.
- **Non-price choices (bread, sauce, sweetness, ice, side picks) deliberately stay in `notes`**, guided by `notes_prompt`. The cashier reads them while re-keying — the same way they read a DoorDash ticket. If this ever outgrows notes, the upgrade path is real modifier tables (see ORDERING-ROADMAP.md), not more jsonb.
- **`(order_date, order_number)` unique pair** gives friendly daily numbers (#1, #2, …) while UUIDs remain the real identifiers.
- **`next_order_number()`** is an atomic upsert — safe under concurrent orders.
- **Hours settings** are minutes-from-midnight in `America/Los_Angeles`. With the 20-minute buffer, the last online order lands 3:10 PM so the kitchen isn't handed a ticket at close.
- Two `no_show` orders for the same phone triggers an insert into `blocked_phones` (logic lives in the PATCH route, not a trigger, so the admin can see and reverse it).
- **`orders.phone` is nullable, but only for `source = 'kiosk'`**, enforced by a check constraint rather than by trust in the API. A null phone means a walk-in standing at the counter screen: no verification code was sent, no "order ready" text will go out, and no per-phone cap or blocklist entry can apply to it. The staff screen labels these orders so nobody waits on a text that isn't coming, and `GET /api/orders/[id]` exposes the fact as a `walk_in` boolean — never the number itself. Caps that do apply are cafe-wide and listed in ORDERING-FRAUD-PREVENTION.md.
