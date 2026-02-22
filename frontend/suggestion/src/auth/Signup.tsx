import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import axios from 'axios' 
import {userapi} from '../utils/apipath'

import { useNavigate } from 'react-router-dom'




type FieldErrors = {
  name?: string
  email?: string
  password?: string
  general?: string
}

export default function Signup(): JSX.Element {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      const data = { name, email, password }
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
          general: mapped.general,
        })
      } else if (responseData?.error) {
        setErrors({ general: responseData.error })
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' })
      }
    }
  }

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