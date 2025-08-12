import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create Supabase client with enhanced options
  const supabase = createMiddlewareClient({ 
    req, 
    res,
    options: {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  })
  
  // Get session and refresh if needed
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  // Handle auth errors
  if (error) {
    console.error('Middleware auth error:', error)
  }

  // Refresh session if it exists to keep it alive
  if (session) {
    await supabase.auth.refreshSession()
  }

  // Auth routes should be accessible without authentication
  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth/')
  const isPublicRoute = req.nextUrl.pathname === '/' || 
                       req.nextUrl.pathname.startsWith('/public/')
  
  // Protected routes that require authentication
  const isProtectedRoute = req.nextUrl.pathname === '/create' || 
                          req.nextUrl.pathname === '/me' ||
                          req.nextUrl.pathname.startsWith('/create/') ||
                          req.nextUrl.pathname.startsWith('/me/')
  
  // If user is not authenticated and trying to access protected routes
  if (!session && (isProtectedRoute || (!isAuthRoute && !isPublicRoute))) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/sign-in'
    // Use returnTo parameter as requested
    redirectUrl.searchParams.set('returnTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If user is authenticated and trying to access auth routes, redirect to home or returnTo
  if (session && isAuthRoute && !req.nextUrl.pathname.includes('/callback')) {
    const returnTo = req.nextUrl.searchParams.get('returnTo') || '/'
    return NextResponse.redirect(new URL(returnTo, req.url))
  }

  // Set secure cookie options for session
  if (session) {
    // Set custom headers for enhanced security
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-XSS-Protection', '1; mode=block')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }
  
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}