import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Input, ErrorMessage, ThemeToggle } from '../components/ui'

export default function Login(): JSX.Element {
  const navigate = useNavigate()
  const { login: authLogin, error: authError, setError: setAuthError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    general?: string
  }>({})

  const handelFromSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setAuthError(null)
    setIsSubmitting(true)
    try {
      const result = await authLogin({ email, password })
      if (result.success) {
        navigate('/dashboard')
      } else if (result.error) {
        setErrors({ general: result.error })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayError = authError ?? errors.general

  return (
    <div className="relative min-h-screen bg-[radial-gradient(55rem_28rem_at_90%_-20%,#c8efe3_5%,transparent_65%),radial-gradient(42rem_25rem_at_-10%_120%,#ffcfa6_5%,transparent_65%),linear-gradient(140deg,#fffdf8_0%,#f5fbff_100%)] dark:bg-[radial-gradient(55rem_28rem_at_90%_-20%,rgba(45,212,191,0.12)_5%,transparent_65%),linear-gradient(140deg,#0f172a_0%,#1e293b_100%)] px-6 py-8 grid place-items-center">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[460px] rounded-2xl border border-teal-700/20 bg-gradient-to-b from-white to-amber-50 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 p-6 sm:p-8 shadow-[0_30px_50px_-32px_rgba(19,49,84,0.32)]">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-teal-700 dark:text-emerald-400">Suggestion Platform</p>
        <h1 className="mt-2 mb-1 text-3xl sm:text-4xl font-bold leading-tight text-slate-800 dark:text-slate-100">Welcome back</h1>
        <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">Log in to continue sharing and managing ideas.</p>
        {displayError ? <ErrorMessage message={displayError} className="mb-3" /> : null}
        <form className="grid gap-2.5" onSubmit={handelFromSubmit} noValidate>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden />
            <Input
              id="login-email"
              label="Email"
              type="email"
              value={email}
              onChange={(v) => {
                setEmail(v)
                setErrors((prev) => ({ ...prev, email: undefined, general: undefined }))
              }}
              error={errors.email}
              className="pl-9 rounded-xl border-teal-600/20 focus:border-teal-600 focus:ring-teal-600/20"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden />
            <Input
              id="login-password"
              label="Password"
              type="password"
              value={password}
              onChange={(v) => {
                setPassword(v)
                setErrors((prev) => ({ ...prev, password: undefined, general: undefined }))
              }}
              error={errors.password}
              className="pl-9 rounded-xl border-teal-600/20 focus:border-teal-600 focus:ring-teal-600/20"
            />
          </div>
          <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            New here?{' '}
            <Button type="button" variant="ghost" className="!p-0 font-bold text-teal-700 hover:underline dark:text-emerald-400" onClick={() => navigate('/signup')}>
              Create account
            </Button>
          </p>
        </form>
      </div>
    </div>
  )
}
