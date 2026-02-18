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

        // 2. Parse Body
        const body = await req.json()

        console.log('Received webhook payload:', JSON.stringify(body))

        // Existing logic for Webhook (Make/Meshulam direct)
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

        // 4. Update Database
        // Strategy: 
        // A. Try ID from cField1 (Best)
        // B. Try Email from payerEmail (Fallback)

        let query = supabaseAdmin.from('profiles').update({ is_premium: true })
        let matched = false

        if (userId) {
            console.log(`Updating via User ID: ${userId}`)
            query = query.eq('id', userId)
            matched = true
        } else if (payerEmail) {
            console.log(`Updating via Payer Email: ${payerEmail}`)
            query = query.eq('email', payerEmail)
            matched = true
        } else {
            console.error('No identifier found in webhook (cField1 missing, payerEmail empty)')
            return new Response(JSON.stringify({ error: 'No identifier found (cField1 missing, payerEmail empty)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const { error: updateError, count } = await query.select()

        if (updateError) {
            console.error('Error updating profile:', updateError)
            return new Response(JSON.stringify({ error: 'Database update failed', details: updateError }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // If we tried email matching but found no user (maybe email mismatch), log warning
        if (matched && count === 0) {
            console.warn(`No user found with ${userId ? 'ID ' + userId : 'Email ' + payerEmail}`)
            // We return 200 to Meshulam/Make so they don't retry, but we log it internally
            return new Response(JSON.stringify({ warning: 'Payment received but user not found (email mismatch?)' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
