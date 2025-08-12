'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Provider } from '@supabase/supabase-js'

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
}

interface AuthStrings {
  signIn: string
  signUp: string
  email: string
  password: string
  continueWithGoogle: string
  continueWithGitHub: string
  signInButton: string
  signUpButton: string
  emailRequired: string
  passwordRequired: string
  passwordMinLength: string
  invalidEmail: string
  authError: string
  alreadyHaveAccount: string
  dontHaveAccount: string
  signInLink: string
  signUpLink: string
}

// i18n-ready strings
const strings: Record<'en' | 'ja', AuthStrings> = {
  en: {
    signIn: 'Sign in',
    signUp: 'Sign up',
    email: 'Email',
    password: 'Password',
    continueWithGoogle: 'Continue with Google',
    continueWithGitHub: 'Continue with GitHub',
    signInButton: 'Sign in',
    signUpButton: 'Sign up',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    passwordMinLength: 'Password must be at least 6 characters',
    invalidEmail: 'Please enter a valid email',
    authError: 'Authentication failed. Please try again.',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    signInLink: 'Sign in',
    signUpLink: 'Sign up'
  },
  ja: {
    signIn: 'サインイン',
    signUp: 'サインアップ',
    email: 'メールアドレス',
    password: 'パスワード',
    continueWithGoogle: 'Googleで続ける',
    continueWithGitHub: 'GitHubで続ける',
    signInButton: 'サインイン',
    signUpButton: 'サインアップ',
    emailRequired: 'メールアドレスは必須です',
    passwordRequired: 'パスワードは必須です',
    passwordMinLength: 'パスワードは6文字以上である必要があります',
    invalidEmail: '有効なメールアドレスを入力してください',
    authError: '認証に失敗しました。もう一度お試しください。',
    alreadyHaveAccount: 'すでにアカウントをお持ちですか？',
    dontHaveAccount: 'アカウントをお持ちでないですか？',
    signInLink: 'サインイン',
    signUpLink: 'サインアップ'
  }
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Partial<Record<'email' | 'password' | 'auth', string>>>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Get language from browser or default to 'en'
  const lang = (typeof window !== 'undefined' && window.navigator.language.startsWith('ja')) ? 'ja' : 'en'
  const t = strings[lang]

  // Handle error from query params
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'auth_callback_error') {
      setErrors({ auth: t.authError })
    }
  }, [searchParams, t.authError])

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = t.emailRequired
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t.invalidEmail
    }
    
    // Password validation
    if (!password) {
      newErrors.password = t.passwordRequired
    } else if (mode === 'sign-up' && password.length < 6) {
      newErrors.password = t.passwordMinLength
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setErrors({})

    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
      }
      
      // Redirect to the original page or home
      const redirectTo = searchParams.get('redirectTo') || '/'
      router.push(redirectTo)
      router.refresh()
    } catch (error) {
      setErrors({ auth: t.authError })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: Provider) => {
    setIsLoading(true)
    try {
      const redirectTo = searchParams.get('redirectTo') || '/'
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (error) throw error
    } catch (error) {
      setErrors({ auth: t.authError })
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-8 py-10">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          {mode === 'sign-in' ? t.signIn : t.signUp}
        </h1>

        {/* Social Auth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t.continueWithGoogle}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 dark:text-gray-200">{t.continueWithGoogle}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin('github')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t.continueWithGitHub}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="text-gray-700 dark:text-gray-200">{t.continueWithGitHub}</span>
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} noValidate>
          {errors.auth && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.auth}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                {t.email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.email 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder={lang === 'ja' ? 'your@email.com' : 'your@email.com'}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isLoading}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                {t.password}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.password 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                disabled={isLoading}
              />
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Loading...</span>
              </span>
            ) : (
              mode === 'sign-in' ? t.signInButton : t.signUpButton
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {mode === 'sign-in' ? (
            <>
              {t.dontHaveAccount}{' '}
              <a href="/auth/sign-up" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                {t.signUpLink}
              </a>
            </>
          ) : (
            <>
              {t.alreadyHaveAccount}{' '}
              <a href="/auth/sign-in" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                {t.signInLink}
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}