-- Ordering system — Phase 1 schema.
-- Source of truth: docs/ORDERING-DATABASE.md (applied verbatim).
-- Run in the Supabase SQL editor, or `supabase db push` if using the CLI.

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
create table orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  integer not null,             -- resets daily, shown as "#47"
  order_date    date not null default current_date,
  customer_name text not null,
  phone         text not null,                -- E.164
  status        text not null default 'new'
                check (status in ('new','call_to_confirm','accepted',
                                  'ready','picked_up','no_show','cancelled')),
  total_cents   integer not null,             -- recomputed server-side, never client
  source        text not null default 'web'
                check (source in ('web','qr','kiosk')),
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  ready_at      timestamptz,
  unique (order_date, order_number)
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
  ('last_order_buffer_minutes',         20);   -- online orders stop 3:10 PM

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

-- ROW LEVEL SECURITY ----------------------------------------------
-- All writes flow through server API routes using the service role key
-- (which bypasses RLS), so no client role gets any write policy — ever.

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

-- Order numbering is server business — clients can't call it.
revoke execute on function next_order_number() from public, anon, authenticated;

-- REALTIME --------------------------------------------------------
-- Staff screen (authenticated) receives insert/update events, filtered by
-- its select policy. The customer status page polls instead.
alter publication supabase_realtime add table orders;

-- INDEXES ---------------------------------------------------------
create index orders_status_idx      on orders (status);
create index orders_phone_idx       on orders (phone, created_at);
create index orders_date_idx        on orders (order_date);
create index codes_phone_idx        on verification_codes (phone, created_at);
create index order_items_order_idx  on order_items (order_id);
