// Run SQL migrations via direct PostgreSQL connection
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const dbPassword = process.env.SUPABASE_DB_PASSWORD

// Extract project ref from URL
const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectRef || !serviceRoleKey || !dbPassword) {
    console.error('❌ Missing environment variables!')
    console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_PASSWORD')
    process.exit(1)
}

// Build connection string
const connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

console.log('🔗 Connection string built successfully')
console.log(`📍 Project: ${projectRef}`)

// Output for use with psql or supabase CLI  
console.log('\n📋 To run migrations manually, use:')
console.log(`npx supabase db push --db-url "${connectionString}"`)

// Export for use in other scripts
export { connectionString, projectRef }
