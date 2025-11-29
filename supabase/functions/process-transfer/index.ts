import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_TRANSFERS_PER_WINDOW = 10;

interface TransferRequest {
  fromAccountId: string;
  toAccountNumber: string;
  toAccountName: string;
  amount: number;
  description?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { fromAccountId, toAccountNumber, toAccountName, amount, description }: TransferRequest = await req.json();

    // Input validation
    if (!fromAccountId || !toAccountNumber || !toAccountName || !amount) {
      throw new Error('Missing required fields');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    if (amount > 1000000) {
      throw new Error('Amount exceeds maximum transfer limit');
    }

    if (toAccountNumber.length < 5 || toAccountNumber.length > 20) {
      throw new Error('Invalid account number format');
    }

    console.log(`[Transfer] User ${user.id} initiating transfer of $${amount} from ${fromAccountId} to ${toAccountNumber}`);

    // Check rate limiting
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW);
    
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('transfer_rate_limits')
      .select('*')
      .eq('user_id', user.id)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1);

    if (rateLimitError) {
      console.error('[Rate Limit] Error checking rate limit:', rateLimitError);
      throw new Error('Rate limit check failed');
    }

    let attemptCount = 1;
    if (rateLimitData && rateLimitData.length > 0) {
      attemptCount = rateLimitData[0].attempt_count + 1;
      
      if (attemptCount > MAX_TRANSFERS_PER_WINDOW) {
        console.warn(`[Rate Limit] User ${user.id} exceeded rate limit (${attemptCount} attempts)`);
        throw new Error(`Rate limit exceeded. Maximum ${MAX_TRANSFERS_PER_WINDOW} transfers per hour.`);
      }

      // Update rate limit count
      await supabase
        .from('transfer_rate_limits')
        .update({ attempt_count: attemptCount })
        .eq('id', rateLimitData[0].id);
    } else {
      // Create new rate limit entry
      await supabase
        .from('transfer_rate_limits')
        .insert({
          user_id: user.id,
          attempt_count: 1,
          window_start: new Date().toISOString()
        });
    }

    console.log(`[Rate Limit] User ${user.id} - Attempt ${attemptCount}/${MAX_TRANSFERS_PER_WINDOW}`);

    // Verify source account ownership and balance
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', fromAccountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      console.error('[Account] Account not found or unauthorized:', accountError);
      throw new Error('Source account not found or unauthorized');
    }

    if (parseFloat(account.balance) < amount) {
      console.warn(`[Balance] Insufficient funds. Available: ${account.balance}, Required: ${amount}`);
      throw new Error('Insufficient funds');
    }

    // Get request metadata for audit trail
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        from_account_id: fromAccountId,
        to_account_number: toAccountNumber,
        to_account_name: toAccountName,
        amount,
        description,
        status: 'pending',
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('[Transaction] Error creating transaction:', transactionError);
      throw new Error('Failed to create transaction');
    }

    console.log(`[Transaction] Created transaction ${transaction.id}`);

    // Update account balance
    const newBalance = parseFloat(account.balance) - amount;
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', fromAccountId);

    if (updateError) {
      console.error('[Balance] Error updating balance:', updateError);
      
      // Mark transaction as failed
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id);

      throw new Error('Failed to process transfer');
    }

    // Mark transaction as completed
    const { error: completeError } = await supabase
      .from('transactions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    if (completeError) {
      console.error('[Transaction] Error completing transaction:', completeError);
    }

    console.log(`[Success] Transfer completed. New balance: $${newBalance}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactionId: transaction.id,
        newBalance,
        message: 'Transfer completed successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('[Error] Transfer failed:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Transfer failed',
        success: false
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});