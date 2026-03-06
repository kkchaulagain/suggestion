import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import axios from 'axios'
import { userapi } from '../utils/apipath'
import { useNavigate } from 'react-router-dom'
import { Building2, CheckCircle, CreditCard, Lock, Mail, MapPin, User } from 'lucide-react'
import { Button, Input, Select, Textarea, ErrorMessage, ThemeToggle } from '../components/ui'

type FieldErrors = {
  name?: string
  email?: string
  password?: string
  role?: string
  location?: string
  description?: string
  pancardNumber?: string
  businessname?: string
  general?: string
}

type UserRole = 'user' | 'business' | 'governmentservices'

export default function Signup(): JSX.Element {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('user')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [pancardNumber, setPancardNumber] = useState('')
  const [businessname, setBusinessname] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Prepare data based on role
    const data: Record<string, unknown> = { name, email, password, role }
    if (role === 'business') {
      data.location = location
      data.description = description
      data.pancardNumber = pancardNumber ? parseInt(pancardNumber) : undefined
      data.businessname = businessname
    }

    try {
      const response = await axios.post(userapi, data, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.data.message) {
        setSuccessMessage(response.data.message)
      }
    } catch (error: unknown) {
      const responseData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
      const field = responseData?.field
      const errMsg = responseData?.error

      if (field != null && errMsg != null && typeof field === 'string' && typeof errMsg === 'string') {
        setErrors({ [field]: errMsg })
      } else if (responseData?.errors && typeof responseData.errors === 'object') {
        const mapped = responseData.errors as Record<string, string | undefined>
        setErrors({
          name: mapped.name,
          email: mapped.email,
          password: mapped.password,
          role: mapped.role,
          location: mapped.location,
          description: mapped.description,
          pancardNumber: mapped.pancardNumber,
          businessname: mapped.businessname,
          general: mapped.general,
        } as FieldErrors)
      } else if (typeof errMsg === 'string') {
        setErrors({ general: errMsg })
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' })
      }
    }
  }

  const isBusiness = role === 'business'

  if (successMessage) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md dark:bg-slate-800 dark:border dark:border-slate-700 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <p className="mt-4 text-slate-700 dark:text-slate-200">{successMessage}</p>
          <Button type="button" variant="primary" size="lg" className="mt-6 w-full" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md dark:bg-slate-800 dark:border dark:border-slate-700">
        <h1 className="text-2xl font-bold mb-1 text-center text-slate-900 dark:text-slate-100">Suggestion Platform</h1>
        <h2 className="text-lg font-semibold mb-1 text-center text-slate-800 dark:text-slate-200">Create account</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 text-center mb-6">
          Join the workspace and start submitting smart suggestions.
        </p>

        {errors.general ? (
          <ErrorMessage message={errors.general} className="text-center mb-4" />
        ) : null}

        <form onSubmit={handleFormSubmit} noValidate className="flex flex-col gap-4">
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden />
            <Input
              id="name"
              label="Name"
              type="text"
              value={name}
              onChange={(v) => {
                setName(v)
                setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              placeholder="Your name"
              error={errors.name}
              className="pl-9"
            />
          </div>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden />
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(v) => {
                setEmail(v)
                setErrors((prev) => ({ ...prev, email: undefined }))
              }}
              placeholder="you@example.com"
              error={errors.email}
              className="pl-9"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden />
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(v) => {
                setPassword(v)
                setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              placeholder="Min. 6 characters"
              error={errors.password}
              className="pl-9"
            />
          </div>

          {/* Role Selection */}
          <Select
            id="role"
            label="Account Type"
            value={role}
            onChange={(value) => {
              setRole(value as UserRole)
              setErrors((prev) => ({ ...prev, role: undefined }))
              if (value !== 'business') {
                setLocation('')
                setDescription('')
                setPancardNumber('')
              }
            }}
            options={[
              { value: 'user', label: 'User' },
              { value: 'business', label: 'Business' },
              { value: 'governmentservices', label: 'Government' },
            ]}
            error={errors.role}
          />

          {/* Business Fields - Conditional Rendering */}
          {isBusiness && (
            <>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden />
              <Input
                id="businessname"
                label="Business Name"
                type="text"
                value={businessname}
                onChange={(v) => {
                  setBusinessname(v)
                  setErrors((prev) => ({ ...prev, businessname: undefined }))
                }}
                placeholder="Enter business name"
                error={errors.businessname}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden />
              <Input
                id="location"
                label={<>Location <span className="text-gray-400">(required for business)</span></>}
                type="text"
                value={location}
                onChange={(v) => {
                  setLocation(v)
                  setErrors((prev) => ({ ...prev, location: undefined }))
                }}
                placeholder="Business location"
                error={errors.location}
                className="pl-9"
              />
            </div>

              <Textarea
                id="description"
                label={<>Description <span className="text-gray-400">(required for business)</span></>}
                value={description}
                onChange={(v) => {
                  setDescription(v)
                  setErrors((prev) => ({ ...prev, description: undefined }))
                }}
                placeholder="Describe your business"
                rows={3}
                error={errors.description}
              />

              {/* PAN Card Number */}
            <div className="relative">
              <CreditCard className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden />
              <Input
                id="pancardNumber"
                label={<>PAN Card Number <span className="text-gray-400">(required for business)</span></>}
                type="text"
                value={pancardNumber}
                onChange={(v) => {
                  setPancardNumber(v.replace(/[^0-9]/g, ''))
                  setErrors((prev) => ({ ...prev, pancardNumber: undefined }))
                }}
                placeholder="Enter PAN card number"
                error={errors.pancardNumber}
                className="pl-9"
              />
            </div>
            </>
          )}

          <Button type="submit" variant="primary" size="md" className="w-full">
            Sign Up
          </Button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-4">
          Already have an account?{' '}
          <Button type="button" variant="ghost" className="!p-0 text-emerald-600 hover:underline font-medium" onClick={() => navigate('/login')}>
            Login
          </Button>
        </p>
      </div>
    </div>
  )
}
