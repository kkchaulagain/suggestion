import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input, ErrorMessage } from '../components/ui'

export default function Login(): JSX.Element {
  const navigate = useNavigate()
  const { login: authLogin, error: authError, setError: setAuthError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    general?: string
  }>({})

  const handelFromSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setAuthError(null)
    const result = await authLogin({ email, password })
    if (result.success) {
      navigate('/dashboard')
    } else if (result.error) {
      setErrors({ general: result.error })
    }
  }

  const displayError = authError ?? errors.general

  return (
    <div className="min-h-screen bg-[radial-gradient(55rem_28rem_at_90%_-20%,#c8efe3_5%,transparent_65%),radial-gradient(42rem_25rem_at_-10%_120%,#ffcfa6_5%,transparent_65%),linear-gradient(140deg,#fffdf8_0%,#f5fbff_100%)] px-6 py-8 grid place-items-center">
      <div className="w-full max-w-[460px] rounded-2xl border border-teal-700/20 bg-gradient-to-b from-white to-amber-50 p-6 sm:p-8 shadow-[0_30px_50px_-32px_rgba(19,49,84,0.32)]">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-teal-700">Suggestion Platform</p>
        <h1 className="mt-2 mb-1 text-3xl sm:text-4xl font-bold leading-tight text-slate-800">Welcome back</h1>
        <p className="mb-5 text-sm text-slate-600">Log in to continue sharing and managing ideas.</p>
        {displayError ? <ErrorMessage message={displayError} className="mb-3" /> : null}
        <form className="grid gap-2.5" onSubmit={handelFromSubmit} noValidate>
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
            className="rounded-xl border-teal-600/20 focus:border-teal-600 focus:ring-teal-600/20"
          />
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
            className="rounded-xl border-teal-600/20 focus:border-teal-600 focus:ring-teal-600/20"
          />
          <Button type="submit" variant="primary" size="lg" className="mt-2 w-full">
            Login
          </Button>
          <p className="mt-2 text-sm text-slate-500">
            New here?{' '}
            <Button type="button" variant="ghost" className="!p-0 font-bold text-teal-700 hover:underline" onClick={() => navigate('/signup')}>
              Create account
            </Button>
          </p>
        </form>
      </div>
    </div>
  )
}
