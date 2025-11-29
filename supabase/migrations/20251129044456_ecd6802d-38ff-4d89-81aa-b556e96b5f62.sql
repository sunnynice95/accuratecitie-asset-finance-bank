-- Fix critical race condition vulnerability: Prevent negative account balances
-- This ensures the database rejects any concurrent transfer that would result in overdraft
ALTER TABLE public.accounts ADD CONSTRAINT positive_balance CHECK (balance >= 0);

-- Add explicit UPDATE policy on accounts to document security intent
-- This explicitly denies client-side balance updates (only edge function with service role can update)
CREATE POLICY "Deny client account updates" ON public.accounts
FOR UPDATE 
USING (false);

-- Add explicit UPDATE policy on transactions to document security intent
-- Only the edge function (with service role) should update transaction status
CREATE POLICY "Deny client transaction updates" ON public.transactions
FOR UPDATE 
USING (false);