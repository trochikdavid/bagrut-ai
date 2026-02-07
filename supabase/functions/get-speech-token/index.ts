
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Configure CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// CACHING: Store the token in global memory (persists between requests in the same instance)
let cachedToken: string | null = null;
let tokenExpiration: number = 0;

// SAFETY MARGIN: Consider token expired 5 minutes before actual expiration
// Azure tokens are valid for 10 minutes. We refresh after 5.
const TOKEN_SAFETY_MARGIN_MS = 5 * 60 * 1000;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Check if we have a valid cached token
    const now = Date.now();

    if (cachedToken && tokenExpiration > (now + TOKEN_SAFETY_MARGIN_MS)) {
      console.log("Returning cached Speech token");
      return new Response(
        JSON.stringify({
          token: cachedToken,
          region: Deno.env.get('AZURE_SPEECH_REGION'),
          expiresAt: tokenExpiration
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Fetch new token from Azure
    console.log("Fetching new Speech token from Azure...");

    const speechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const speechRegion = Deno.env.get('AZURE_SPEECH_REGION');

    if (!speechKey || !speechRegion) {
      throw new Error('Azure Speech configuration missing');
    }

    const response = await fetch(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure API Error: ${response.status} ${errorText}`);
    }

    const token = await response.text();

    // 3. Update Cache
    cachedToken = token;
    // Azure tokens are valid for 10 minutes.
    // We set our expiration to now + 10 mins.
    // The check above will force refresh when 5 mins are left.
    tokenExpiration = now + (10 * 60 * 1000);

    return new Response(
      JSON.stringify({
        token,
        region: speechRegion,
        expiresAt: tokenExpiration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Error getting speech token:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
