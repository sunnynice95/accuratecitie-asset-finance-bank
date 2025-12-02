-- Fix security issue: Set immutable search_path on process_transfer function
-- This prevents potential privilege escalation attacks
CREATE OR REPLACE FUNCTION public.process_transfer(
  p_user_id UUID,
  p_from_account UUID,
  p_to_account_number TEXT,
  p_to_account_name TEXT,
  p_amount NUMERIC,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(success boolean, error text) AS
$$
DECLARE
  v_from_balance NUMERIC;
  v_to_account_id UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN QUERY SELECT false, 'Amount must be greater than 0';
    RETURN;
  END IF;

  -- Lock the sender account row
  SELECT balance INTO v_from_balance
  FROM public.accounts
  WHERE id = p_from_account
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'From account not found';
    RETURN;
  END IF;

  IF v_from_balance < p_amount THEN
    RETURN QUERY SELECT false, 'Insufficient funds';
    RETURN;
  END IF;

  -- Debit sender
  UPDATE public.accounts
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE id = p_from_account;

  -- Attempt to find internal recipient account and lock it
  SELECT id INTO v_to_account_id
  FROM public.accounts
  WHERE account_number = p_to_account_number
  FOR UPDATE;

  IF FOUND THEN
    -- Credit recipient
    UPDATE public.accounts
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE id = v_to_account_id;
  END IF;

  -- Insert transaction record with explicit NULL for ip_address and user_agent
  INSERT INTO public.transactions (
    user_id,
    from_account_id,
    to_account_number,
    to_account_name,
    amount,
    description,
    status,
    ip_address,
    user_agent,
    completed_at,
    created_at
  ) VALUES (
    p_user_id,
    p_from_account,
    p_to_account_number,
    p_to_account_name,
    p_amount,
    p_description,
    'completed',
    NULL,
    NULL,
    NOW(),
    NOW()
  );

  RETURN QUERY SELECT true, NULL::text;

EXCEPTION WHEN others THEN
  -- In case of any error, return a failure and include the message
  RETURN QUERY SELECT false, SQLERRM;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public;