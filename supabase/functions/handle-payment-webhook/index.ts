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

        // Extract fields based on Grow payload structure
        // User configured 'user_id' custom field in Grow.
        const { statusCode, cField1, description, payerEmail, identifyParam, transactionCode, user_id } = payload

        // 3. Verify Status
        // Grow direct webhook doesn't send 'statusCode' always. It sends 'transactionCode'.
        if (!transactionCode && String(statusCode) !== '2') {
            console.log(`Payment might not be successful. No transactionCode and statusCode is ${statusCode}`)
            return new Response(JSON.stringify({ message: 'Status code not approved', statusCode }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 4. Identify User
        // Priority: user_id (Custom Field) > identifyParam > cField1 > description
        const userId = user_id || identifyParam || cField1 || (description && description.includes('user_') ? description : null)

        console.log(`Processing approved payment for userId: ${userId} or email: ${payerEmail}`)

        if (!userId && !payerEmail) {
            // Check for manual email field before giving up
        }

        // Helper to find email in any field (handling Hebrew keys from Grow)
        const findEmailInPayload = (obj: any): string | null => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            for (const key in obj) {
                const value = obj[key]
                if (typeof value === 'string' && emailRegex.test(value)) {
                    // Return the first valid email found
                    return value
                }
            }
            return null
        }

        // Specific check for the Hebrew field name (if passed as is)
        const manualEmail = payload['ה-email איתו נרשמתם'] || findEmailInPayload(payload)
        const targetEmail = manualEmail || payerEmail

        if (!userId && !targetEmail) {
            return new Response(JSON.stringify({ error: 'User ID (cField1) or Email is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 4. Update Database
        // Strategy: 
        // A. Try ID from cField1 (Best)
        // B. Try Email from payerEmail (Fallback)

        let query = supabaseAdmin.from('profiles').update({ is_premium: true })
        let matched = false

        // Helper to validate UUID
        const isValidUUID = (uuid: string) => {
            const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            return regex.test(uuid)
        }

        let validUserId = null
        if (userId && isValidUUID(userId)) {
            validUserId = userId
        } else if (userId) {
            // "cField1" or "=user_id" are common misconfiguration values from Grow
            if (userId === 'cField1' || userId === '=user_id') {
                console.log(`Debug: identifyParam is '${userId}' (default/misconfig), ignoring.`)
            } else {
                console.warn(`Invalid UUID for userId: ${userId}`)
            }
        }

        if (validUserId) {
            console.log(`Updating via User ID: ${validUserId}`)
            query = query.eq('id', validUserId)
            matched = true
        } else if (targetEmail) {
            console.log(`Updating via Target Email (Manual/Payer): ${targetEmail}`)
            query = query.eq('email', targetEmail)
            matched = true
        } else {
            console.error('No identifier found in webhook (cField1/identifyParam invalid, Email missing)')
            return new Response(JSON.stringify({ error: 'No identifier found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
