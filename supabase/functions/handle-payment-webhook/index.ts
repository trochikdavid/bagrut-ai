import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        // 1. Verify Secret
        // specific header 'x-webhook-secret' or inside body
        const secret = req.headers.get('x-webhook-secret')
        const EXPECTED_SECRET = Deno.env.get('PAYMENT_WEBHOOK_SECRET')

        // If secret env var is not set, we default to a hardcoded placeholder or fail? 
        // Better to fail safe.
        if (!EXPECTED_SECRET) {
            console.error('PAYMENT_WEBHOOK_SECRET is not set in Edge Function secrets.')
            return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (secret !== EXPECTED_SECRET) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 2. Parse Body from Make (Meshulam wrapper)
        // Expected structure: { "status": "...", "data": { "statusCode": "2", "cField1": "userId", ... } }
        const body = await req.json()
        console.log('Received webhook payload:', JSON.stringify(body))

        const { data } = body

        // If data is missing, maybe it's a direct flat payload? Check both.
        const payload = data || body

        const { statusCode, cField1, description, payerEmail } = payload

        // 3. Verify Status
        // Meshulam successful payment statusCode is usually '000' or '2' depending on the API/IPN version?
        // User provided logic: "Validate statusCode = 2"
        if (String(statusCode) !== '2') {
            console.log(`Payment not successful (statusCode: ${statusCode}). logic: approved only if 2.`)
            // We return 200 OK to acknowledge receipt, but don't update user premium status?
            // Or maybe we treat it as an error?
            // Usually webhooks should return 200 if received, even if business logic ignores it.
            return new Response(JSON.stringify({ message: 'Status code not approved', statusCode }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 4. Identify User
        // Primary: cField1 (where we put userId)
        // Secondary: Extract from description?
        // Tertiary: payerEmail
        const userId = cField1 || (description && description.includes('user_') ? description : null) // rudimentary check

        console.log(`Processing approved payment for userId: ${userId} or email: ${payerEmail}`)

        if (!userId && !payerEmail) {
            return new Response(JSON.stringify({ error: 'User ID (cField1) or Payer Email is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 5. Update User Profile
        let query = supabaseAdmin.from('profiles').update({ is_premium: true })

        if (userId) {
            query = query.eq('id', userId)
        } else {
            // Fallback to payerEmail if userId is missing. Note: payerEmail might actally be empty in the payload example provided by user!
            if (!payerEmail) {
                return new Response(JSON.stringify({ error: 'No identifier found (cField1 missing, payerEmail empty)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            query = query.eq('email', payerEmail)
        }

        const { data: updatedUser, error } = await query.select()

        if (error || !updatedUser || updatedUser.length === 0) {
            console.error('Update failed:', error || 'User not found')
            // Might want to return 404/500 so Make retries? Or 200 to stop retrying?
            // If user not found, retrying won't help unless race condition.
            return new Response(JSON.stringify({ error: 'User update failed or user not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'User updated successfully',
            user: updatedUser[0]
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
