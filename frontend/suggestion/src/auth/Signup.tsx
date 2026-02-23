import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import axios from 'axios' 
import {userapi} from '../utils/apipath'
import { useNavigate } from 'react-router-dom'

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

type UserRole = 'user' | 'business' | 'government'

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
    const data: any = { name, email, password, role }
    
    // Add business fields only if role is business
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
    } catch (error: any) {
      const responseData = error?.response?.data

      if (responseData?.field && responseData?.error) {
        setErrors({ [responseData.field]: responseData.error })
      } else if (responseData?.errors && typeof responseData.errors === 'object') {
        const mapped = responseData.errors as Record<string, string>
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
        })
      } else if (responseData?.error) {
        setErrors({ general: responseData.error })
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

        {errors.general && (
          <p className="text-red-500 text-sm text-center mb-4">{errors.general}</p>
        )}

        <form onSubmit={handleFormSubmit} noValidate className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              placeholder="Your name"
              className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 transition ${
                errors.name
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-0.5">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors((prev) => ({ ...prev, email: undefined }))
              }}
              placeholder="you@example.com"
              className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 transition ${
                errors.email
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200'
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-0.5">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              placeholder="Min. 6 characters"
              className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 transition ${
                errors.password
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200'
              }`}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-0.5">{errors.password}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="role">
              Account Type
            </label>
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
              <option value="government">Government</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-xs mt-0.5">{errors.role}</p>
            )}
          </div>

          {/* Business Fields - Conditional Rendering */}
          {isBusiness && (
            <>
            {/* Business Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="businessname">
                Business Name
              </label>
              <input
                id="businessname"
                type="text"
                value={businessname}
                onChange={(e) => {
                  setBusinessname(e.target.value)
                  setErrors((prev) => ({ ...prev, businessname: undefined }))
                }}
                placeholder="Enter business name"
                className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 transition ${
                  errors.businessname
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-200'
                }`}
              />
              {errors.businessname && (
                <p className="text-red-500 text-xs mt-0.5">{errors.businessname}</p>
              )}
            </div>

              
              {/* Location */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="location">
                  Location <span className="text-gray-400">(required for business)</span>
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value)
                    setErrors((prev) => ({ ...prev, location: undefined }))
                  }}
                  placeholder="Business location"
                  className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 transition ${
                    errors.location
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                />
                {errors.location && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.location}</p>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="description">
                  Description <span className="text-gray-400">(required for business)</span>
                </label>
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
                {errors.description && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.description}</p>
                )}
              </div>

              {/* PAN Card Number */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="pancardNumber">
                  PAN Card Number <span className="text-gray-400">(required for business)</span>
                </label>
                <input
                  id="pancardNumber"
                  type="text"
                  value={pancardNumber}
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setPancardNumber(value)
                    setErrors((prev) => ({ ...prev, pancardNumber: undefined }))
                  }}
                  placeholder="Enter PAN card number"
                  className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 transition ${
                    errors.pancardNumber
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                />
                {errors.pancardNumber && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.pancardNumber}</p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition"
          >
            Sign Up
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-4">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:underline font-medium"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  )
}
