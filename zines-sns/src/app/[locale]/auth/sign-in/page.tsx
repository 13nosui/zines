import AuthForm from '@/components/auth/AuthForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - ZINEs',
  description: 'Sign in to your ZINEs account',
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm mode="sign-in" />
    </div>
  )
}