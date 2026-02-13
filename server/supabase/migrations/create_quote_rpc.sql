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
  -- We split into two cases to allow identity column or defaults to work when quote_number is not provided.
  IF quote_json ? 'quote_number' AND (quote_json->>'quote_number') IS NOT NULL THEN
    INSERT INTO quotes (
      deal_id,
      status,
      currency_code,
      exchange_rate_snapshot,
      valid_until,
      version,
      quote_number,
      created_by
    ) VALUES (
      (quote_json->>'deal_id')::uuid,
      quote_json->>'status',
      quote_json->>'currency_code',
      (quote_json->>'exchange_rate_snapshot')::numeric,
      (quote_json->>'valid_until')::date,
      COALESCE((quote_json->>'version')::int, 1),
      (quote_json->>'quote_number')::integer,
      auth.uid()
    )
    RETURNING id INTO new_quote_id;
  ELSE
    INSERT INTO quotes (
      deal_id,
      status,
      currency_code,
      exchange_rate_snapshot,
      valid_until,
      version,
      created_by
    ) VALUES (
      (quote_json->>'deal_id')::uuid,
      quote_json->>'status',
      quote_json->>'currency_code',
      (quote_json->>'exchange_rate_snapshot')::numeric,
      (quote_json->>'valid_until')::date,
      COALESCE((quote_json->>'version')::int, 1),
      auth.uid()
    )
    RETURNING id INTO new_quote_id;
  END IF;

  -- 2. Insert Quote Items
  -- We treat items_json as a JSON array. 
  -- We assume items_json contains objects with keys matching quote_items columns.
  INSERT INTO quote_items (
    quote_id,
    description,
    quantity,
    unit_price,
    tax_rate
  )
  SELECT
    new_quote_id,
    x->>'description',
    (x->>'quantity')::numeric,
    (x->>'unit_price')::numeric,
    COALESCE((x->>'tax_rate')::numeric, 0)
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
