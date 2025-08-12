import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

// Singleton pattern to ensure we only create one client instance
let client: ReturnType<typeof createClientComponentClient<Database>> | undefined

export function createClient() {
  if (client) return client
  
  client = createClientComponentClient<Database>({
    options: {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    }
  })
  
  return client
}