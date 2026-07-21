-- Atomic order placement.
--
-- supabase-js can't wrap two inserts in one transaction, so the "insert order
-- + snapshotted items in one transaction" requirement from
-- docs/ORDERING-IMPLEMENTATION.md lives here. Called only by API routes via
-- the service role; execute is revoked from every client role.
--
-- p_items shape (already validated + priced server-side in the API route):
--   [{"menu_item_id": "...", "item_name": "...", "variant_label": "",
--     "addons": [{"label": "...", "price_cents": 0}], "price_cents": 0,
--     "quantity": 1, "notes": ""}]

create or replace function place_order(
  p_customer_name text,
  p_phone         text,
  p_status        text,
  p_total_cents   integer,
  p_source        text,
  p_items         jsonb
) returns table (order_id uuid, order_number integer)
language plpgsql as $$
declare
  v_number integer;
  v_id     uuid;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order must contain at least one item';
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

revoke execute on function place_order(text, text, text, integer, text, jsonb)
  from public, anon, authenticated;
