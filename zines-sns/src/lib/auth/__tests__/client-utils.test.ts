import { getAuthErrorKey, signInWithEmail, signUpWithEmail, signInWithOAuth } from '../client-utils'
import { createClient } from '@/lib/supabase/client'
import { AuthError } from '@supabase/supabase-js'

// Mock Supabase client
jest.mock('@/lib/supabase/client')

// Mock window.location.origin for auth redirects
beforeAll(() => {
  // @ts-ignore
  delete window.location
  // @ts-ignore
  window.location = { origin: 'http://localhost:3000' }
})

describe('Auth Client Utilities', () => {
  const mockSupabase = {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('getAuthErrorKey', () => {
    it('maps known error messages to translation keys', () => {
      const errorMappings = [
        { message: 'Invalid login credentials', expected: 'auth.errors.invalidCredentials' },
        { message: 'User already registered', expected: 'auth.errors.userAlreadyExists' },
        { message: 'Email not confirmed', expected: 'auth.errors.emailNotConfirmed' },
        { message: 'Password should be at least 6 characters', expected: 'auth.validation.passwordMinLength' },
        { message: 'Password should be at least 8 characters', expected: 'auth.validation.passwordMinLength' },
        { message: 'Invalid email', expected: 'auth.validation.emailInvalid' },
        { message: 'User not found', expected: 'auth.errors.userNotFound' },
        { message: 'Invalid refresh token', expected: 'auth.errors.sessionExpired' },
        { message: 'OAuth error', expected: 'auth.errors.oauthError' },
      ]

      errorMappings.forEach(({ message, expected }) => {
        const error = new AuthError(message)
        expect(getAuthErrorKey(error)).toBe(expected)
      })
    })

    it('returns unexpected error key for unknown errors', () => {
      const error = new Error('Unknown error')
      expect(getAuthErrorKey(error)).toBe('auth.errors.unexpected')
    })

    it('handles non-error inputs', () => {
      expect(getAuthErrorKey(null)).toBe('auth.errors.unexpected')
      expect(getAuthErrorKey(undefined)).toBe('auth.errors.unexpected')
      expect(getAuthErrorKey('string error')).toBe('auth.errors.unexpected')
    })
  })

  describe('signInWithEmail', () => {
    it('returns success data when sign in succeeds', async () => {
      const mockData = { user: { id: '123' }, session: {} }
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await signInWithEmail('test@example.com', 'password')

      expect(result).toEqual({ data: mockData, error: null })
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      })
    })

    it('returns error key when sign in fails', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: new AuthError('Invalid login credentials')
      })

      const result = await signInWithEmail('test@example.com', 'wrong')

      expect(result).toEqual({ 
        data: null, 
        error: 'auth.errors.invalidCredentials' 
      })
    })

    it('handles missing supabase client', async () => {
      ;(createClient as jest.Mock).mockReturnValue(null)

      const result = await signInWithEmail('test@example.com', 'password')

      expect(result).toEqual({ 
        data: null, 
        error: 'auth.errors.unexpected' 
      })
    })
  })

  describe('signUpWithEmail', () => {
    it('returns success data when sign up succeeds', async () => {
      const mockData = { user: { id: '123' }, session: null }
      mockSupabase.auth.signUp.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await signUpWithEmail('new@example.com', 'password123')

      expect(result).toEqual({ data: mockData, error: null })
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback')
        }
      })
    })

    it('returns error key when email already exists', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: new AuthError('User already registered')
      })

      const result = await signUpWithEmail('existing@example.com', 'password123')

      expect(result).toEqual({ 
        data: null, 
        error: 'auth.errors.userAlreadyExists' 
      })
    })

    it('returns error key for password validation', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: new AuthError('Password should be at least 8 characters')
      })

      const result = await signUpWithEmail('new@example.com', 'short')

      expect(result).toEqual({ 
        data: null, 
        error: 'auth.validation.passwordMinLength' 
      })
    })
  })

  describe('signInWithOAuth', () => {
    it('initiates OAuth flow successfully', async () => {
      const mockData = { provider: 'google', url: 'https://auth.url' }
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await signInWithOAuth('google')

      expect(result).toEqual({ data: mockData, error: null })
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
    })

    it('returns error key when OAuth fails', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: new AuthError('OAuth error')
      })

      const result = await signInWithOAuth('github')

      expect(result).toEqual({ 
        data: null, 
        error: 'auth.errors.oauthError' 
      })
    })
  })
})