import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cachedAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  cachedAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
  return cachedAdmin
}



