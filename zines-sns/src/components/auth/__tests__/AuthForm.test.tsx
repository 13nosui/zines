import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthForm from '../AuthForm'
import * as authUtils from '@/lib/auth/client-utils'

// Mock the auth utilities
jest.mock('@/lib/auth/client-utils')

// Get the mocked functions
const mockRouter = useRouter as jest.Mock
const mockSearchParams = useSearchParams as jest.Mock

describe('AuthForm', () => {
  const mockPush = jest.fn()
  const mockGet = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Update the mock return values
    mockRouter.mockReturnValue({
      push: mockPush,
      prefetch: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      refresh: jest.fn(),
    })
    
    mockSearchParams.mockReturnValue({
      get: mockGet,
    })
  })

  describe('Sign In Mode', () => {
    it('renders sign in form correctly', () => {
      render(<AuthForm mode="sign-in" />)
      
      expect(screen.getByText('auth.signInTitle')).toBeInTheDocument()
      expect(screen.getByLabelText('auth.email')).toBeInTheDocument()
      expect(screen.getByLabelText('auth.password')).toBeInTheDocument()
      expect(screen.getByText('auth.forgotPassword')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'auth.signIn' })).toBeInTheDocument()
    })

    it('displays validation errors for empty fields', async () => {
      const user = userEvent.setup()
      render(<AuthForm mode="sign-in" />)
      
      const submitButton = screen.getByRole('button', { name: 'auth.signIn' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('auth.validation.emailRequired')).toBeInTheDocument()
        expect(screen.getByText('auth.validation.passwordRequired')).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      render(<AuthForm mode="sign-in" />)
      
      const emailInput = screen.getByLabelText('auth.email')
      await user.type(emailInput, 'invalid-email')
      await user.tab() // Trigger blur
      
      await waitFor(() => {
        expect(screen.getByText('auth.validation.emailInvalid')).toBeInTheDocument()
      })
    })

    it('does not validate password length in sign-in mode', async () => {
      const user = userEvent.setup()
      render(<AuthForm mode="sign-in" />)
      
      const passwordInput = screen.getByLabelText('auth.password')
      await user.type(passwordInput, 'short')
      await user.tab() // Trigger blur
      
      await waitFor(() => {
        expect(screen.queryByText(/auth.validation.passwordMinLength/)).not.toBeInTheDocument()
      })
    })

    it('shows loading state when submitting', async () => {
      const user = userEvent.setup()
      ;(authUtils.signInWithEmail as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: {}, error: null }), 100))
      )
      
      render(<AuthForm mode="sign-in" />)
      
      const emailInput = screen.getByLabelText('auth.email')
      const passwordInput = screen.getByLabelText('auth.password')
      const submitButton = screen.getByRole('button', { name: 'auth.signIn' })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      expect(screen.getByText('common.loading')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('handles successful sign in with redirect', async () => {
      const user = userEvent.setup()
      mockGet.mockReturnValue('/dashboard')
      ;(authUtils.signInWithEmail as jest.Mock).mockResolvedValue({ 
        data: { user: { id: '123' } }, 
        error: null 
      })
      
      render(<AuthForm mode="sign-in" />)
      
      const emailInput = screen.getByLabelText('auth.email')
      const passwordInput = screen.getByLabelText('auth.password')
      const submitButton = screen.getByRole('button', { name: 'auth.signIn' })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('displays localized error messages on sign in failure', async () => {
      const user = userEvent.setup()
      ;(authUtils.signInWithEmail as jest.Mock).mockResolvedValue({ 
        data: null, 
        error: 'auth.errors.invalidCredentials'
      })
      
      render(<AuthForm mode="sign-in" />)
      
      const emailInput = screen.getByLabelText('auth.email')
      const passwordInput = screen.getByLabelText('auth.password')
      const submitButton = screen.getByRole('button', { name: 'auth.signIn' })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('auth.errors.invalidCredentials')).toBeInTheDocument()
      })
    })

    it('preserves user input after error', async () => {
      const user = userEvent.setup()
      ;(authUtils.signInWithEmail as jest.Mock).mockResolvedValue({ 
        data: null, 
        error: 'auth.errors.invalidCredentials'
      })
      
      render(<AuthForm mode="sign-in" />)
      
      const emailInput = screen.getByLabelText('auth.email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('auth.password') as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: 'auth.signIn' })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(emailInput.value).toBe('test@example.com')
        expect(passwordInput.value).toBe('wrongpassword')
      })
    })
  })

  describe('Sign Up Mode', () => {
    it('renders sign up form correctly', () => {
      render(<AuthForm mode="sign-up" />)
      
      expect(screen.getByText('auth.signUpTitle')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'auth.signUp' })).toBeInTheDocument()
      expect(screen.queryByText('auth.forgotPassword')).not.toBeInTheDocument()
    })

    it('validates password minimum length in sign-up mode', async () => {
      const user = userEvent.setup()
      render(<AuthForm mode="sign-up" />)
      
      const passwordInput = screen.getByLabelText('auth.password')
      await user.type(passwordInput, 'short')
      await user.tab() // Trigger blur
      
      await waitFor(() => {
        expect(screen.getByText('auth.validation.passwordMinLength {"min":8}')).toBeInTheDocument()
      })
    })

    it('shows success message after sign up', async () => {
      const user = userEvent.setup()
      ;(authUtils.signUpWithEmail as jest.Mock).mockResolvedValue({ 
        data: { user: { id: '123' } }, 
        error: null 
      })
      
      render(<AuthForm mode="sign-up" />)
      
      const emailInput = screen.getByLabelText('auth.email')
      const passwordInput = screen.getByLabelText('auth.password')
      const submitButton = screen.getByRole('button', { name: 'auth.signUp' })
      
      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('auth.messages.checkEmail')).toBeInTheDocument()
      })
    })
  })

  describe('OAuth Sign In', () => {
    it('shows loading state on OAuth buttons when clicked', async () => {
      const user = userEvent.setup()
      ;(authUtils.signInWithOAuth as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: {}, error: null }), 100))
      )
      
      render(<AuthForm mode="sign-in" />)
      
      const googleButton = screen.getByRole('button', { name: /Google/i })
      const githubButton = screen.getByRole('button', { name: /GitHub/i })
      
      await user.click(googleButton)
      
      // Google button should show loading, others should be disabled
      expect(googleButton).toBeDisabled()
      expect(githubButton).toBeDisabled()
      expect(screen.getByRole('button', { name: 'auth.signIn' })).toBeDisabled()
    })

    it('handles OAuth errors correctly', async () => {
      const user = userEvent.setup()
      ;(authUtils.signInWithOAuth as jest.Mock).mockResolvedValue({ 
        data: null, 
        error: 'auth.errors.oauthError'
      })
      
      render(<AuthForm mode="sign-in" />)
      
      const googleButton = screen.getByRole('button', { name: /Google/i })
      await user.click(googleButton)
      
      await waitFor(() => {
        expect(screen.getByText('auth.errors.oauthError')).toBeInTheDocument()
      })
    })
  })

  describe('URL Parameters', () => {
    it('displays error from URL parameters', () => {
      mockGet.mockImplementation((key) => {
        if (key === 'error') return 'Session%20expired'
        return null
      })
      
      render(<AuthForm mode="sign-in" />)
      
      expect(screen.getByText('Session expired')).toBeInTheDocument()
    })

    it('displays message from URL parameters', () => {
      mockGet.mockImplementation((key) => {
        if (key === 'message') return 'Password%20reset%20successful'
        return null
      })
      
      render(<AuthForm mode="sign-in" />)
      
      expect(screen.getByText('Password reset successful')).toBeInTheDocument()
    })

    it('uses redirectTo parameter from URL', async () => {
      const user = userEvent.setup()
      mockGet.mockImplementation((key) => {
        if (key === 'redirectTo') return '/protected-page'
        return null
      })
      ;(authUtils.signInWithEmail as jest.Mock).mockResolvedValue({ 
        data: { user: { id: '123' } }, 
        error: null 
      })
      
      render(<AuthForm mode="sign-in" />)
      
      const emailInput = screen.getByLabelText('auth.email')
      const passwordInput = screen.getByLabelText('auth.password')
      const submitButton = screen.getByRole('button', { name: 'auth.signIn' })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/protected-page')
      })
    })
  })

  describe('Real-time Validation', () => {
    it('shows validation error only after field is touched', async () => {
      const user = userEvent.setup()
      render(<AuthForm mode="sign-in" />)
      
      const emailInput = screen.getByLabelText('auth.email')
      
      // Type invalid email
      await user.type(emailInput, 'invalid')
      
      // Error should not show while typing
      expect(screen.queryByText('auth.validation.emailInvalid')).not.toBeInTheDocument()
      
      // Blur the field
      await user.tab()
      
      // Error should show after blur
      expect(screen.getByText('auth.validation.emailInvalid')).toBeInTheDocument()
    })

    it('updates validation error in real-time after field is touched', async () => {
      const user = userEvent.setup()
      render(<AuthForm mode="sign-in" />)
      
      const emailInput = screen.getByLabelText('auth.email')
      
      // Type invalid email and blur
      await user.type(emailInput, 'invalid')
      await user.tab()
      
      expect(screen.getByText('auth.validation.emailInvalid')).toBeInTheDocument()
      
      // Go back and fix the email
      await user.clear(emailInput)
      await user.type(emailInput, 'valid@example.com')
      
      // Error should disappear in real-time
      expect(screen.queryByText('auth.validation.emailInvalid')).not.toBeInTheDocument()
    })
  })
})