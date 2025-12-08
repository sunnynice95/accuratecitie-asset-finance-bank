-- Drop and recreate the process_transfer function with security fixes
CREATE OR REPLACE FUNCTION public.process_transfer(
  p_user_id uuid, 
  p_from_account uuid, 
  p_to_account_number text, 
  p_to_account_name text, 
  p_amount numeric, 
  p_description text DEFAULT NULL::text
)
RETURNS TABLE(success boolean, error text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_from_balance NUMERIC;
  v_to_account_id UUID;
  v_rate_limit_count INTEGER;
BEGIN
  -- ==========================================
  -- 1. INPUT VALIDATION (Defense in Depth)
  -- ==========================================
  
  -- Validate amount
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN QUERY SELECT false, 'Amount must be greater than 0';
    RETURN;
  END IF;
  
  IF p_amount > 1000000 THEN
    RETURN QUERY SELECT false, 'Amount exceeds maximum transfer limit';
    RETURN;
  END IF;

  -- Validate account number format (5-20 digits only)
  IF p_to_account_number IS NULL OR 
     LENGTH(p_to_account_number) < 5 OR 
     LENGTH(p_to_account_number) > 20 OR
     p_to_account_number !~ '^[0-9]+$' THEN
    RETURN QUERY SELECT false, 'Invalid account number format';
    RETURN;
  END IF;

  -- Validate recipient name (2-100 chars, trimmed)
  IF p_to_account_name IS NULL OR 
     LENGTH(TRIM(p_to_account_name)) < 2 OR 
     LENGTH(p_to_account_name) > 100 THEN
    RETURN QUERY SELECT false, 'Invalid recipient name';
    RETURN;
  END IF;

  -- Validate description length if provided
  IF p_description IS NOT NULL AND LENGTH(p_description) > 500 THEN
    RETURN QUERY SELECT false, 'Description too long';
    RETURN;
  END IF;

  -- ==========================================
  -- 2. IDOR FIX: ACCOUNT OWNERSHIP VERIFICATION
  -- ==========================================
  
  IF NOT EXISTS (
    SELECT 1 FROM public.accounts 
    WHERE id = p_from_account AND user_id = p_user_id
  ) THEN
    RETURN QUERY SELECT false, 'Account not found or access denied';
    RETURN;
  END IF;

  -- ==========================================
  -- 3. RATE LIMITING ENFORCEMENT
  -- ==========================================
  
  -- Clean up old rate limit entries and check current count
  DELETE FROM public.transfer_rate_limits 
  WHERE user_id = p_user_id AND window_start < NOW() - INTERVAL '1 hour';
  
  SELECT COALESCE(SUM(attempt_count), 0) INTO v_rate_limit_count
  FROM public.transfer_rate_limits
  WHERE user_id = p_user_id AND window_start > NOW() - INTERVAL '1 hour';
  
  IF v_rate_limit_count >= 10 THEN
    RETURN QUERY SELECT false, 'Transfer limit exceeded. Maximum 10 transfers per hour.';
    RETURN;
  END IF;
  
  -- Increment rate limit counter
  INSERT INTO public.transfer_rate_limits (user_id, attempt_count, window_start)
  VALUES (p_user_id, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET attempt_count = transfer_rate_limits.attempt_count + 1;

  -- ==========================================
  -- 4. TRANSFER LOGIC (Original)
  -- ==========================================

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

  -- Insert transaction record
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
  RETURN QUERY SELECT false, SQLERRM;
END;
$function$;

-- Add unique constraint on user_id for rate limits if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transfer_rate_limits_user_id_key'
  ) THEN
    ALTER TABLE public.transfer_rate_limits 
    ADD CONSTRAINT transfer_rate_limits_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION WHEN others THEN
  NULL; -- Constraint may already exist
END $$;