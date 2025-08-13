import { AuthProvider } from './AuthProvider'
import { createServerClient } from '@/lib/supabase/server'

export async function AuthProviderWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const supabase = createServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  return (
    <AuthProvider initialSession={session}>
      {children}
    </AuthProvider>
  )
}