import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import axios from 'axios'
import { userapi } from '../utils/apipath'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Label, ErrorMessage } from '../components/ui'

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
        
        alert(response.data.message)
        navigate('/login')
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-1 text-center">Suggestion Platform</h1>
        <h2 className="text-lg font-semibold mb-1 text-center">Create account</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Join the workspace and start submitting smart suggestions.
        </p>

        {errors.general ? (
          <ErrorMessage message={errors.general} className="text-center mb-4" />
        ) : null}

        <form onSubmit={handleFormSubmit} noValidate className="flex flex-col gap-4">
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
          />
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
          />
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
          />

          {/* Role Selection */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="role" size="md" className="text-gray-700">
              Account Type
            </Label>
            <select
              id="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as UserRole)
                setErrors((prev) => ({ ...prev, role: undefined }))
                // Clear business fields when switching away from business
                if (e.target.value !== 'business') {
                  setLocation('')
                  setDescription('')
                  setPancardNumber('')
                }
              }}
              className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 transition ${
                errors.role
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200'
              }`}
            >
              <option value="user">User</option>
              <option value="business">Business</option>
              <option value="governmentservices">Government</option>
            </select>
            {errors.role ? (
              <ErrorMessage message={errors.role} size="sm" className="mt-0.5" />
            ) : null}
          </div>

          {/* Business Fields - Conditional Rendering */}
          {isBusiness && (
            <>
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
            />

              
              {/* Location */}
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
              />

              {/* Description */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="description" size="md" className="text-gray-700">
                  Description <span className="text-gray-400">(required for business)</span>
                </Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    setErrors((prev) => ({ ...prev, description: undefined }))
                  }}
                  placeholder="Describe your business"
                  rows={3}
                  className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 transition resize-none ${
                    errors.description
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                />
                {errors.description ? (
                  <ErrorMessage message={errors.description} size="sm" className="mt-0.5" />
                ) : null}
              </div>

              {/* PAN Card Number */}
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
              />
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
