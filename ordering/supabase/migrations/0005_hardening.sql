-- Hardening pass: close the walk-in cap race, and make verification codes
-- resistant to brute force.
--
-- Source of truth: docs/ORDERING-FRAUD-PREVENTION.md. Run in the Supabase SQL
-- editor (or `supabase db push`) after 0004.

-- 1 · VERIFICATION CODES ------------------------------------------------
--
-- A 6-digit code is 1,000,000 possibilities, which sounds like plenty until
-- you notice nothing counted wrong guesses. POST /api/orders compared the
-- submitted code with a conditional UPDATE and, on a miss, simply said "that
-- didn't match" — so an attacker who knew a customer's number could sit in a
-- loop against a 5-minute window. Worse, /api/verify/start allowed three
-- sends per hour and left all three live at once, tripling the number of
-- codes that would satisfy any single guess.
--
-- attempts is incremented on every failed comparison and checked before the
-- next one; the API layer spends the code (used = true) only once every other
-- gate has passed.
alter table verification_codes
  add column if not exists attempts integer not null default 0;

-- Rate-limiting by source address needs the address. Nullable: a request that
-- arrives without a usable forwarded-for header is still allowed through, it
-- just cannot be counted per-IP.
alter table verification_codes
  add column if not exists request_ip text;

create index if not exists verification_codes_phone_live_idx
  on verification_codes (phone, created_at desc)
  where used = false;

create index if not exists verification_codes_ip_recent_idx
  on verification_codes (request_ip, created_at desc)
  where request_ip is not null;

-- Global SMS budget, in the settings table like every other cap so /admin can
-- tune it without a deploy. The per-phone limit of 3/hour is no defence
-- against an attacker who simply uses a different number every time.
insert into settings (key, value) values
  ('max_sms_per_hour_global', 60),
  ('max_sms_per_hour_per_ip',  6),
  ('max_code_attempts',        5)
on conflict (key) do nothing;


-- 2 · WALK-IN CAPS, ENFORCED IN THE TRANSACTION -------------------------
--
-- The API route counted open walk-ins and walk-ins-this-hour in two separate
-- round trips and then inserted. Nothing serialized that, so N concurrent
-- requests all read the same pre-insert counts, all decided they were under
-- the cap, and all inserted. The caps bounded a *sequential* attacker and
-- nothing else — which is the opposite of the threat, since forging walk-ins
-- is trivially parallel.
--
-- Both counts now happen inside place_order, under a transaction-scoped
-- advisory lock, in the same transaction as the insert. Concurrent callers
-- queue on the lock and each sees the previous one's row.
--
-- The route keeps its own pre-checks: they fail fast with a friendly message
-- and save a round trip. They are no longer what enforces anything.

create or replace function place_order(
  p_customer_name        text,
  p_phone                text,
  p_status               text,
  p_total_cents          integer,
  p_source               text,
  p_items                jsonb,
  p_max_open_walkins     integer default null,
  p_max_walkins_per_hour integer default null
) returns table (order_id uuid, order_number integer)
language plpgsql as $$
declare
  v_number integer;
  v_id     uuid;
  v_open   integer;
  v_recent integer;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order must contain at least one item';
  end if;

  -- Phoneless orders sit outside every phone-keyed cap, so they get these.
  if p_phone is null then
    -- Transaction-scoped: released automatically on commit or rollback, so a
    -- failed insert can never strand it. Every walk-in insert contends on the
    -- same key, which is what makes the counts below trustworthy.
    perform pg_advisory_xact_lock(hashtext('breakroom:walkin_caps'));

    if p_max_open_walkins is not null then
      select count(*) into v_open
      from orders
      where phone is null
        and status in ('new', 'call_to_confirm', 'accepted', 'ready');

      if v_open >= p_max_open_walkins then
        raise exception 'walkin_cap_open' using errcode = 'P0001';
      end if;
    end if;

    if p_max_walkins_per_hour is not null then
      select count(*) into v_recent
      from orders
      where phone is null
        and created_at > now() - interval '1 hour';

      if v_recent >= p_max_walkins_per_hour then
        raise exception 'walkin_cap_rate' using errcode = 'P0001';
      end if;
    end if;
  end if;

  v_number := next_order_number();

  insert into orders (order_number, customer_name, phone, status, total_cents, source)
  values (v_number, p_customer_name, p_phone, p_status, p_total_cents, p_source)
  returning id into v_id;

  insert into order_items
    (order_id, menu_item_id, item_name, variant_label, addons, price_cents, quantity, notes)
  select
    v_id,
    (i->>'menu_item_id')::uuid,
    i->>'item_name',
    coalesce(i->>'variant_label', ''),
    coalesce(i->'addons', '[]'::jsonb),
    (i->>'price_cents')::integer,
    (i->>'quantity')::integer,
    coalesce(i->>'notes', '')
  from jsonb_array_elements(p_items) as i;

  return query select v_id, v_number;
end $$;

-- The 6-argument signature from 0003 is gone; drop it so nothing can call the
-- unguarded version by accident.
drop function if exists place_order(text, text, text, integer, text, jsonb);

revoke execute on function
  place_order(text, text, text, integer, text, jsonb, integer, integer)
  from public, anon, authenticated;

-- The open-walk-in count filters on status as well as phone.
create index if not exists orders_walkin_open_idx
  on orders (status)
  where phone is null;

-- PostgREST caches the function signatures it will expose. Supabase normally
-- reloads on DDL, but ask explicitly so the new 8-argument place_order is
-- callable the moment this migration finishes rather than whenever the cache
-- next turns over.
notify pgrst, 'reload schema';
