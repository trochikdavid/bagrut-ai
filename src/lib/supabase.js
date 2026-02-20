import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Export for native fetch calls
export { supabaseUrl, supabaseAnonKey }

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
}

// Create client with placeholder values if not configured (will fail on actual operations)
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
)

// Native fetch helper to bypass Supabase client AbortError issues
export async function fetchFromSupabase(table, query = {}, token = null, timeoutMs = 8000) {
    if (!isSupabaseConfigured) return null

    const { select = '*', eq, single } = query
    let url = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}`

    if (eq) {
        const [column, value] = Object.entries(eq)[0]
        url += `&${column}=eq.${encodeURIComponent(value)}`
    }

    try {
        const headers = {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

        // Use provided token or fall back to anon key (auth needed for RLS)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        } else {
            headers['Authorization'] = `Bearer ${supabaseAnonKey}`
        }

        const response = await fetch(url, { headers, signal: controller.signal })
        clearTimeout(timeoutId)

        if (!response.ok) return null

        const data = await response.json()
        return single ? data[0] : data
    } catch (e) {
        if (e.name === 'AbortError') {
            throw e // Let the caller handle the timeout/retry logic
        }
        return null
    }
}
