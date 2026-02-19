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

        // Extract fields
        const { statusCode, payerEmail, transactionCode } = payload

        // 3. Verify Status
        if (!transactionCode && String(statusCode) !== '2') {
            console.log(`Payment might not be successful. No transactionCode and statusCode is ${statusCode}`)
            return new Response(JSON.stringify({ message: 'Status code not approved', statusCode }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 4. Identify User via Payer Email
        console.log(`Processing approved payment for email: ${payerEmail}`)

        if (!payerEmail) {
            console.error('No payerEmail found in webhook (Apple Pay or missing field).')
            return new Response(JSON.stringify({ error: 'Payer Email is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 5. Update Database
        const { error: updateError, count } = await supabaseAdmin
            .from('profiles')
            .update({ is_premium: true })
            .eq('email', payerEmail)
            .select()

        if (updateError) {
            console.error('Error updating profile:', updateError)
            return new Response(JSON.stringify({ error: 'Database update failed', details: updateError }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (count === 0) {
            console.warn(`No user found with Email ${payerEmail}`)
            return new Response(JSON.stringify({ warning: 'Payment received but user not found (email mismatch?)' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        console.log(`Successfully upgraded user with email: ${payerEmail}`)

        return new Response(JSON.stringify({
            success: true,
            message: 'User updated successfully',
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
