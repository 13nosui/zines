import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

// Create the intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true
})

export async function middleware(req: NextRequest) {
  // First handle i18n routing
  const pathname = req.nextUrl.pathname
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = req.headers.get('accept-language')?.split(',')[0]?.split('-')[0] || defaultLocale
    const validLocale = locales.includes(locale as any) ? locale : defaultLocale
    
    return NextResponse.redirect(
      new URL(`/${validLocale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, req.url)
    )
  }

  // Create a response object that we'll modify
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Create Supabase client with modern SSR approach
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.delete(name)
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.delete(name)
        },
      },
    }
  )

  // Get session
  const { data: { session }, error } = await supabase.auth.getSession()

  // Handle auth errors
  if (error) {
    console.error('Middleware auth error:', error)
  }

  // Extract the locale from the pathname
  const pathParts = pathname.split('/')
  const locale = pathParts[1]
  const pathWithoutLocale = '/' + pathParts.slice(2).join('/')

  // Auth routes should be accessible without authentication
  const isAuthRoute = pathWithoutLocale.startsWith('/auth/')
  const isPublicRoute = pathWithoutLocale === '/' || 
                       pathWithoutLocale.startsWith('/public/')
  
  // Protected routes that require authentication
  const isProtectedRoute = pathWithoutLocale === '/create' || 
                          pathWithoutLocale === '/me' ||
                          pathWithoutLocale.startsWith('/create/') ||
                          pathWithoutLocale.startsWith('/me/')
  
  // If user is not authenticated and trying to access protected routes
  if (!session && isProtectedRoute) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = `/${locale}/auth/sign-in`
    // Use returnTo parameter as requested
    redirectUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If user is authenticated and trying to access auth routes, redirect to home or returnTo
  if (session && isAuthRoute && !pathWithoutLocale.includes('/callback')) {
    const returnTo = req.nextUrl.searchParams.get('returnTo') || `/${locale}`
    return NextResponse.redirect(new URL(returnTo, req.url))
  }

  // Set secure headers for authenticated sessions
  if (session) {
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }
  
  return response
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