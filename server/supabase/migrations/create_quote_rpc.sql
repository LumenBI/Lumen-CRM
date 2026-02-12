-- Create a function to handle the atomic creation of a quote and its items
CREATE OR REPLACE FUNCTION create_quote_rpc(
  quote_json jsonb,
  items_json jsonb
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  new_quote_id uuid;
  new_quote_record jsonb;
BEGIN
  -- 1. Insert the Quote Header based on the provided JSON
  INSERT INTO quotes (
    deal_id,
    status,
    currency_code,
    exchange_rate_snapshot,
    valid_until,
    version,
    quote_number -- Assuming this might be auto-generated or passed, if not passed, DB default handles it
  ) VALUES (
    (quote_json->>'deal_id')::uuid,
    quote_json->>'status',
    quote_json->>'currency_code',
    (quote_json->>'exchange_rate_snapshot')::numeric,
    (quote_json->>'valid_until')::timestamp,
    COALESCE((quote_json->>'version')::int, 1),
    quote_json->>'quote_number' -- Optional, depends on schema
  )
  RETURNING id INTO new_quote_id;

  -- 2. Insert Quote Items
  -- We treat items_json as a JSON array. 
  -- We assume items_json contains objects with keys matching quote_items columns.
  INSERT INTO quote_items (
    quote_id,
    description,
    quantity,
    unit_price,
    tax_rate,
    total -- specific logic might be needed if total is calculated, but usually it's quantity * unit_price
  )
  SELECT
    new_quote_id,
    x->>'description',
    (x->>'quantity')::numeric,
    (x->>'unit_price')::numeric,
    COALESCE((x->>'tax_rate')::numeric, 0),
    (x->>'quantity')::numeric * (x->>'unit_price')::numeric -- Simple calculation, or pass it if pre-calculated
  FROM jsonb_array_elements(items_json) AS x;

  -- 3. Return the newly created quote (as JSON) to the client
  SELECT to_jsonb(q) INTO new_quote_record
  FROM quotes q
  WHERE id = new_quote_id;

  RETURN new_quote_record;
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, the transaction is rolled back automatically by Postgres
    RAISE;
END;
$$;
