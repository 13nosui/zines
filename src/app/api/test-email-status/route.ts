import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Get the current user (if any)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Check if we can access auth admin (this will fail without service role key)
    let authSettings = null
    try {
      // This would require service role key to actually get email settings
      authSettings = 'Unable to fetch (requires service role key)'
    } catch (e) {
      authSettings = 'Not accessible from client'
    }
    
    return NextResponse.json({
      status: 'Email Configuration Check',
      timestamp: new Date().toISOString(),
      environment: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Missing',
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'Not set (using default)',
      },
      currentUser: user ? {
        id: user.id,
        email: user.email,
        emailConfirmedAt: user.email_confirmed_at,
        lastSignInAt: user.last_sign_in_at,
      } : 'No user logged in',
      authSettings,
      recommendations: [
        '1. Check Supabase Dashboard → Authentication → Email Templates',
        '2. Ensure "Enable email confirmations" is ON',
        '3. Configure SMTP settings in Project Settings → Authentication → SMTP Settings',
        '4. For testing, use Supabase\'s built-in email (3 emails/hour limit)',
        '5. For production, configure custom SMTP (SendGrid, Mailgun, etc.)',
      ],
      commonIssues: [
        'Free tier: Limited to 3 emails per hour with built-in SMTP',
        'No SMTP configured: Emails won\'t send without SMTP setup',
        'Email in spam: Check spam/junk folders',
        'Rate limiting: Too many signup attempts can trigger limits',
      ]
    })
  } catch (error) {
    console.error('Error checking email status:', error)
    return NextResponse.json({ 
      error: 'Failed to check email status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}