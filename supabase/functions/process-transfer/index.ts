/**
 * Edge Function: process-transfer
 * - Validates input and caller.
 * - Calls the DB RPC `process_transfer` to perform an atomic transfer.
 *
 * Environment expectations:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (or other key with permission to run the RPC / SECURITY DEFINER)
 *
 * Authentication:
 * - Expects Authorization: Bearer <access_token> header from the caller.
 * - Uses supabase.auth.getUser(token) to resolve the user id.
 *
 * Adjust the auth resolution to match your deployment (if you use a different auth flow).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE URL or SERVICE_ROLE_KEY environment variables.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransferRequest {
  fromAccountId: string;
  toAccountNumber: string;
  toIban?: string | null;
  toSwiftBic?: string | null;
  toAccountName: string;
  amount: number;
  description?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : "";

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Missing Authorization token" }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Resolve the user from the token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("auth.getUser error:", userError);
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json() as TransferRequest;

    if (!body || !body.fromAccountId || !body.toAccountNumber || !body.amount || body.amount <= 0) {
      return new Response(JSON.stringify({ success: false, error: "Invalid input" }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call the RPC to perform atomic transfer
    const { data, error: rpcError } = await supabase.rpc("process_transfer", {
      p_user_id: user.id,
      p_from_account: body.fromAccountId,
      p_to_account_number: body.toAccountNumber,
      p_to_account_name: body.toAccountName,
      p_amount: body.amount,
      p_description: body.description ?? null,
    });

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return new Response(JSON.stringify({ success: false, error: rpcError.message }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // rpc returns an array of rows; take first
    const result = Array.isArray(data) && data.length > 0 ? data[0] : data;

    if (!result || result.success === false) {
      return new Response(
        JSON.stringify({ success: false, error: result?.error || "Transfer failed" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});