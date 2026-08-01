-- Kiosk walk-in orders: a customer standing at the counter screen who has no
-- phone, or won't hand one over for a sandwich.
--
-- Source of truth: docs/ORDERING-DATABASE.md. Run in the Supabase SQL editor
-- (or `supabase db push`) after 0003.
--
-- Phase 1 assumed every order had a phone, because every order came from one.
-- The kiosk breaks that assumption: it is the only surface where the customer
-- is physically present, which is exactly why it can take an order without a
-- number — staff call the name across the counter instead of texting it.
--
-- The trade is that a phoneless order sits outside every phone-keyed fraud
-- cap, so it gets its own caps below. See docs/ORDERING-FRAUD-PREVENTION.md.

-- 1 · Phone becomes optional, but ONLY for kiosk orders. Web and QR orders
--     are placed by someone who isn't here; the number is how we reach them,
--     and dropping the constraint outright would let a forged source field
--     turn into a forged anonymous web order.
alter table orders alter column phone drop not null;

alter table orders add constraint orders_phone_required_off_kiosk
  check (phone is not null or source = 'kiosk');

-- 2 · Caps for the phoneless path, in the settings table like every other
--     cap so /admin can tune them without a deploy.
--
--     allow_walkin_orders     kill switch: 0 turns the kiosk's "no phone"
--                             button off and every order needs a number again
--     max_open_walkin_orders  phoneless orders in flight at once, cafe-wide
--     max_walkin_per_hour     phoneless orders accepted per rolling hour
insert into settings (key, value) values
  ('allow_walkin_orders',       1),
  ('max_open_walkin_orders',    5),
  ('max_walkin_per_hour',      20)
on conflict (key) do nothing;

-- 3 · Both caps count phoneless orders by recency, so index for that.
create index if not exists orders_walkin_idx
  on orders (created_at)
  where phone is null;
