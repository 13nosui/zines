import { serverAuthGuard } from '../server-guards'
import { useClientAuthGuard } from '../client-guards'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/client'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}))

// Mock Supabase clients
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn()
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}))

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset window.location for client tests
    delete (window as any).location
    window.location = { 
      pathname: '/test-path',
      origin: 'http://localhost:3000',
      href: '',
      search: ''
    } as any
  })

  describe('serverAuthGuard', () => {
    it('should return session when authenticated', async () => {
      const mockSession = { user: { id: '123', email: 'test@example.com' } }
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null
          })
        }
      }
      ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

      const result = await serverAuthGuard()

      expect(result).toEqual(mockSession)
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should redirect to sign-in when not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null
          })
        }
      }
      ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

      await serverAuthGuard()

      expect(redirect).toHaveBeenCalledWith('http://localhost:3000/auth/sign-in')
    })

    it('should redirect with returnTo parameter when provided', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null
          })
        }
      }
      ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

      await serverAuthGuard({ returnTo: '/create' })

      expect(redirect).toHaveBeenCalledWith('http://localhost:3000/auth/sign-in?returnTo=%2Fcreate')
    })

    it('should redirect to custom path when redirectTo is provided', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null
          })
        }
      }
      ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

      await serverAuthGuard({ redirectTo: '/custom-auth' })

      expect(redirect).toHaveBeenCalledWith('http://localhost:3000/custom-auth')
    })

    it('should handle auth errors by redirecting', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: new Error('Auth error')
          })
        }
      }
      ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

      await serverAuthGuard()

      expect(redirect).toHaveBeenCalledWith('http://localhost:3000/auth/sign-in')
    })
  })

  describe('useClientAuthGuard', () => {
    let mockSupabase: any

    beforeEach(() => {
      mockSupabase = {
        auth: {
          getSession: jest.fn()
        }
      }
      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    })

    describe('checkAuth', () => {
      it('should return session when authenticated', async () => {
        const mockSession = { user: { id: '123', email: 'test@example.com' } }
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: mockSession },
          error: null
        })

        const { checkAuth } = useClientAuthGuard()
        const result = await checkAuth()

        expect(result).toEqual(mockSession)
        expect(window.location.href).toBe('')
      })

      it('should redirect to sign-in when not authenticated', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: null
        })

        const { checkAuth } = useClientAuthGuard()
        await checkAuth()

        expect(window.location.href).toBe('http://localhost:3000/auth/sign-in?returnTo=%2Ftest-path')
      })

      it('should not include returnTo for root path', async () => {
        window.location.pathname = '/'
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: null
        })

        const { checkAuth } = useClientAuthGuard()
        await checkAuth()

        expect(window.location.href).toBe('http://localhost:3000/auth/sign-in')
      })

      it('should use custom redirectTo and returnTo when provided', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: null
        })

        const { checkAuth } = useClientAuthGuard()
        await checkAuth({ redirectTo: '/custom-auth', returnTo: '/custom-return' })

        expect(window.location.href).toBe('http://localhost:3000/custom-auth?returnTo=%2Fcustom-return')
      })
    })

    describe('isAuthenticated', () => {
      it('should return true when session exists', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: { user: { id: '123' } } },
          error: null
        })

        const { isAuthenticated } = useClientAuthGuard()
        const result = await isAuthenticated()

        expect(result).toBe(true)
      })

      it('should return false when no session', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: null
        })

        const { isAuthenticated } = useClientAuthGuard()
        const result = await isAuthenticated()

        expect(result).toBe(false)
      })
    })

    describe('redirectIfAuthenticated', () => {
      it('should redirect to home when authenticated', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: { user: { id: '123' } } },
          error: null
        })

        const { redirectIfAuthenticated } = useClientAuthGuard()
        await redirectIfAuthenticated()

        expect(window.location.href).toBe('/')
      })

      it('should redirect to returnTo param when authenticated and param exists', async () => {
        window.location.search = '?returnTo=/dashboard'
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: { user: { id: '123' } } },
          error: null
        })

        const { redirectIfAuthenticated } = useClientAuthGuard()
        await redirectIfAuthenticated()

        expect(window.location.href).toBe('/dashboard')
      })

      it('should redirect to custom path when provided', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: { user: { id: '123' } } },
          error: null
        })

        const { redirectIfAuthenticated } = useClientAuthGuard()
        await redirectIfAuthenticated('/custom-redirect')

        expect(window.location.href).toBe('/custom-redirect')
      })

      it('should not redirect when not authenticated', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: null
        })

        const { redirectIfAuthenticated } = useClientAuthGuard()
        await redirectIfAuthenticated()

        expect(window.location.href).toBe('')
      })
    })
  })
})