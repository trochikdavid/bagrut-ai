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

        // 1. Parse Body immediately to log it (Debugging)
        const body = await req.json()
        console.log('DEBUG: Received incoming request body:', JSON.stringify(body))
        console.log('DEBUG: Received headers:', JSON.stringify(Object.fromEntries(req.headers.entries())))

        // 2. Verify Secret
        // Grow sends the secret in the body as 'webhookKey'
        const incomingSecret = body.webhookKey
        const EXPECTED_SECRET = Deno.env.get('PAYMENT_WEBHOOK_SECRET')

        if (!incomingSecret || incomingSecret !== EXPECTED_SECRET) {
            console.error('Unauthorized attempt. Invalid webhookKey.')
            return new Response(JSON.stringify({ error: 'Unauthorized', debug_note: 'Secret mismatch' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Existing logic for Webhook (Make/Meshulam direct)
        const { data } = body
        // If data is missing, use body directly (direct webhook case)
        const payload = data || body

        // Extract fields based on Grow payload structure seen in logs
        // Payload example: { "identifyParam": "...", "transactionCode": "...", ... }
        const { statusCode, cField1, description, payerEmail, identifyParam, transactionCode } = payload

        // 3. Verify Status
        // Grow direct webhook doesn't send 'statusCode'. It sends 'transactionCode'.
        // If we received this webhook (Transaction Approved type), it is a success.
        // We just check if transactionCode exists to be sure it's valid.
        if (!transactionCode && String(statusCode) !== '2') {
            console.log(`Payment might not be successful. No transactionCode and statusCode is ${statusCode}`)
            return new Response(JSON.stringify({ message: 'Status code not approved', statusCode }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 4. Identify User
        // Grow uses 'identifyParam' if configured. 
        // We also check cField1 (Make wrapper) or description fallback.
        const userId = identifyParam || cField1 || (description && description.includes('user_') ? description : null)

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
