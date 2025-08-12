'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmail, signUpWithEmail, signInWithOAuth, getAuthErrorKey } from '@/lib/auth/client-utils'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: ''
  })
  const [touched, setTouched] = useState({
    email: false,
    password: false
  })

  // Get redirect URL from search params
  const redirectTo = searchParams.get('redirectTo') || '/'

  // Check for error or message in URL params
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const messageParam = searchParams.get('message')
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
    if (messageParam) {
      setMessage(decodeURIComponent(messageParam))
    }
  }, [searchParams])

  // Validate email
  const validateEmail = (value: string) => {
    if (!value) {
      return t('auth.validation.emailRequired')
    }
    if (!EMAIL_REGEX.test(value)) {
      return t('auth.validation.emailInvalid')
    }
    return ''
  }

  // Validate password
  const validatePassword = (value: string) => {
    if (!value) {
      return t('auth.validation.passwordRequired')
    }
    if (mode === 'sign-up' && value.length < 8) {
      return t('auth.validation.passwordMinLength', { min: 8 })
    }
    return ''
  }

  // Handle email change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (touched.email) {
      setValidationErrors(prev => ({ ...prev, email: validateEmail(value) }))
    }
  }

  // Handle password change with validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    if (touched.password) {
      setValidationErrors(prev => ({ ...prev, password: validatePassword(value) }))
    }
  }

  // Handle field blur to show validation
  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }))
    if (field === 'email') {
      setValidationErrors(prev => ({ ...prev, email: validateEmail(email) }))
    } else {
      setValidationErrors(prev => ({ ...prev, password: validatePassword(password) }))
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    
    setValidationErrors({
      email: emailError,
      password: passwordError
    })
    
    setTouched({
      email: true,
      password: true
    })
    
    // Don't submit if there are validation errors
    if (emailError || passwordError) {
      return
    }
    
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (mode === 'sign-in') {
        const { data, error } = await signInWithEmail(email, password)
        if (error) {
          // Check if error is a translation key
          const errorKey = getAuthErrorKey(error)
          const errorMessage = errorKey.startsWith('auth.') ? t(errorKey) : error
          setError(errorMessage)
          setLoading(false)
        } else {
          router.push(redirectTo)
        }
      } else {
        const { data, error } = await signUpWithEmail(email, password)
        if (error) {
          // Check if error is a translation key
          const errorKey = getAuthErrorKey(error)
          const errorMessage = errorKey.startsWith('auth.') ? t(errorKey, { min: 8 }) : error
          setError(errorMessage)
          setLoading(false)
        } else {
          setMessage(t('auth.messages.checkEmail'))
          setLoading(false)
        }
      }
    } catch (err) {
      setError(t('auth.errors.unexpected'))
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError(null)
    setOauthLoading(provider)

    try {
      const { error } = await signInWithOAuth(provider)
      if (error) {
        // Check if error is a translation key
        const errorKey = getAuthErrorKey(error)
        const errorMessage = errorKey.startsWith('auth.') ? t(errorKey) : error
        setError(errorMessage)
        setOauthLoading(null)
      }
      // OAuth redirects automatically, no need to handle success
    } catch (err) {
      setError(t('auth.errors.unexpected'))
      setOauthLoading(null)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {mode === 'sign-in' ? t('auth.signInTitle') : t('auth.signUpTitle')}
        </h2>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleEmailAuth}>
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {message && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={handleEmailChange}
              onBlur={() => handleBlur('email')}
              className={`mt-1 block w-full appearance-none rounded-md border ${
                touched.email && validationErrors.email 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
              } px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none dark:bg-gray-800 dark:text-white sm:text-sm`}
              placeholder={t('auth.emailPlaceholder')}
              aria-invalid={touched.email && !!validationErrors.email}
              aria-describedby={touched.email && validationErrors.email ? 'email-error' : undefined}
            />
            {touched.email && validationErrors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400" id="email-error">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => handleBlur('password')}
              className={`mt-1 block w-full appearance-none rounded-md border ${
                touched.password && validationErrors.password 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
              } px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none dark:bg-gray-800 dark:text-white sm:text-sm`}
              placeholder={mode === 'sign-up' ? t('auth.passwordPlaceholder') : '••••••••'}
              aria-invalid={touched.password && !!validationErrors.password}
              aria-describedby={touched.password && validationErrors.password ? 'password-error' : undefined}
            />
            {touched.password && validationErrors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400" id="password-error">
                {validationErrors.password}
              </p>
            )}
          </div>
        </div>

        {mode === 'sign-in' && (
          <div className="flex items-center justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || oauthLoading !== null}
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('common.loading')}
            </span>
          ) : (
            mode === 'sign-in' ? t('auth.signIn') : t('auth.signUp')
          )}
        </button>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                {t('auth.orContinueWith')}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading || oauthLoading !== null}
              className="inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {oauthLoading === 'google' ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="ml-2">Google</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading || oauthLoading !== null}
              className="inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {oauthLoading === 'github' ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-2">GitHub</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {mode === 'sign-in' ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}
          </span>
          <Link
            href={mode === 'sign-in' ? '/auth/sign-up' : '/auth/sign-in'}
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {mode === 'sign-in' ? t('auth.signUp') : t('auth.signIn')}
          </Link>
        </div>
      </form>
    </div>
  )
}