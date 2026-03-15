import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import axios from 'axios'
import { userapi } from '../utils/apipath'
import { useNavigate } from 'react-router-dom'
import { Building2, CheckCircle, CreditCard, Lock, Mail, MapPin, User, UserCircle } from 'lucide-react'
import { Button, Input, Textarea, ErrorMessage, ThemeToggle, Label } from '../components/ui'
import AvatarPicker from '../components/AvatarPicker'
import PhoneInput from 'react-phone-input-2'
import '../styles/react-phone-input-2.css'

type FieldErrors = {
  name?: string
  email?: string
  password?: string
  phone?: string
  role?: string
  location?: string
  description?: string
  pancardNumber?: string
  businessname?: string
  avatarId?: string
  general?: string
}

type UserRole = 'user' | 'business' | 'governmentservices'

export default function Signup(): JSX.Element {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('user')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [pancardNumber, setPancardNumber] = useState('')
  const [businessname, setBusinessname] = useState('')
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    const data: Record<string, unknown> = { name, email, password, phone, role }
    if (role === 'user') {
      if (avatarId) data.avatarId = avatarId
    } else {
      data.businessname = businessname
      data.description = description
      if (location.trim()) data.location = location.trim()
      if (pancardNumber.trim()) data.pancardNumber = pancardNumber.trim()
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
      const message = responseData?.message

      if (field === 'phone' && typeof responseData?.errors === 'object' && responseData.errors != null) {
        const mapped = responseData.errors as Record<string, string | undefined>
        if (mapped.phone) {
          setErrors({ phone: mapped.phone })
          return
        }
      }

      if (
        typeof field === 'string' &&
        (typeof errMsg === 'string' || typeof message === 'string')
      ) {
        setErrors({ [field]: (typeof errMsg === 'string' ? errMsg : message) as string } as FieldErrors)
      } else if (responseData?.errors && typeof responseData.errors === 'object') {
        const mapped = responseData.errors as Record<string, string | undefined>
        setErrors({
          name: mapped.name,
          email: mapped.email,
          password: mapped.password,
          phone: mapped.phone,
          role: mapped.role,
          location: mapped.location,
          description: mapped.description,
          pancardNumber: mapped.pancardNumber,
          businessname: mapped.businessname,
          avatarId: mapped.avatarId,
          general: mapped.general,
        } as FieldErrors)
      } else if (typeof errMsg === 'string' || typeof message === 'string') {
        setErrors({ general: (typeof errMsg === 'string' ? errMsg : message) as string })
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' })
      }
    }
  }

  const isBusiness = role === 'business' || role === 'governmentservices'

  const authBackground =
    'bg-[radial-gradient(55rem_28rem_at_90%_-20%,#c8efe3_5%,transparent_65%),radial-gradient(42rem_25rem_at_-10%_120%,#ffcfa6_5%,transparent_65%),linear-gradient(140deg,#fffdf8_0%,#f5fbff_100%)] dark:bg-[radial-gradient(55rem_28rem_at_90%_-20%,rgba(45,212,191,0.12)_5%,transparent_65%),linear-gradient(140deg,#0f172a_0%,#1e293b_100%)]'
  const authCard =
    'w-full max-w-[460px] rounded-2xl border border-teal-700/20 bg-gradient-to-b from-white to-amber-50 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 shadow-[0_30px_50px_-32px_rgba(19,49,84,0.32)]'

  if (successMessage) {
    return (
      <div className={`relative min-h-screen overflow-y-auto ${authBackground} flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8`}>
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className={`${authCard} p-4 sm:p-6 md:p-8 text-center`}>
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
    <div className={`relative min-h-screen flex flex-col overflow-hidden ${authBackground}`}>
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <form
        onSubmit={handleFormSubmit}
        noValidate
        className="flex flex-1 flex-col min-h-0"
      >
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 flex justify-center">
          <div className={`${authCard} p-4 sm:p-6 md:p-8 w-full max-w-[460px]`}>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-teal-700 dark:text-emerald-400">Suggestion Platform</p>
            <h1 className="mt-2 mb-1 text-2xl sm:text-3xl font-bold leading-tight text-slate-800 dark:text-slate-100">Create account</h1>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">Join the workspace and start submitting smart suggestions.</p>

            {errors.general ? (
              <ErrorMessage message={errors.general} className="text-center mb-4" />
            ) : null}

            <div className="flex flex-col gap-4">
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
                leftIcon={<User className="h-4 w-4" />}
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
                leftIcon={<Mail className="h-4 w-4" />}
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
                leftIcon={<Lock className="h-4 w-4" />}
              />
              <div className="flex flex-col gap-1">
                <Label htmlFor="phone">Phone Number</Label>
                <PhoneInput
                  country="np"
                  specialLabel=""
                  enableSearch
                  value={phone}
                  onChange={(nextPhone) => {
                    setPhone(nextPhone)
                    setErrors((prev) => ({ ...prev, phone: undefined }))
                  }}
                  inputProps={{ id: 'phone', name: 'phone' }}
                  containerClass="w-full"
                  buttonClass={`!border !rounded-l-lg !border-r-0 !bg-white hover:!bg-white dark:!bg-slate-800 dark:hover:!bg-slate-800 ${
                    errors.phone ? '!border-red-400 dark:!border-red-500' : '!border-slate-300 dark:!border-slate-600'
                  }`}
                  inputClass={`!w-full !min-h-[44px] !rounded-lg !border !bg-white !py-2.5 !pl-14 !pr-3 !text-base !text-slate-900 !outline-none !transition focus:!border-emerald-600 focus:!ring-2 focus:!ring-emerald-600/20 dark:!border-slate-600 dark:!bg-slate-800 dark:!text-slate-100 dark:focus:!border-emerald-500 dark:focus:!ring-emerald-500/30 ${
                    errors.phone
                      ? '!border-red-400 focus:!border-red-500 focus:!ring-red-200 dark:!border-red-500 dark:focus:!ring-red-500/30'
                      : '!border-slate-300'
                  }`}
                  dropdownClass="!bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-slate-100"
                  searchClass="!bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-slate-100"
                />
                {errors.phone ? <ErrorMessage message={errors.phone} size="sm" className="mt-0.5" /> : null}
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('user')
                      setErrors((prev) => ({ ...prev, role: undefined }))
                      setLocation('')
                      setDescription('')
                      setPancardNumber('')
                      setBusinessname('')
                    }}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-left transition ${
                      role === 'user'
                        ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-900/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500'
                    }`}
                  >
                    <UserCircle className="h-8 w-8 text-slate-600 dark:text-slate-300" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Personal</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Just you, no paperwork. We&apos;ll create your space in the background.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRole('business')
                      setErrors((prev) => ({ ...prev, role: undefined }))
                    }}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-left transition ${
                      role === 'business'
                        ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-900/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500'
                    }`}
                  >
                    <Building2 className="h-8 w-8 text-slate-600 dark:text-slate-300" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Business</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">For shops, brands & orgs. You&apos;ll add business details next.</span>
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('governmentservices')
                      setErrors((prev) => ({ ...prev, role: undefined }))
                    }}
                    className={`text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 ${
                      role === 'governmentservices' ? 'text-emerald-600 dark:text-emerald-400' : ''
                    }`}
                  >
                    I&apos;m signing up as Government
                  </button>
                </div>
                {errors.role ? <ErrorMessage message={errors.role} size="sm" /> : null}
              </div>

              {role === 'user' && (
                <AvatarPicker
                  value={avatarId}
                  onChange={setAvatarId}
                  label="Pick your vibe"
                  aria-label="Choose your avatar"
                />
              )}

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
                    leftIcon={<Building2 className="h-4 w-4" />}
                  />
                  <Input
                    id="location"
                    label={<>Location <span className="text-gray-400">(optional)</span></>}
                    type="text"
                    value={location}
                    onChange={(v) => {
                      setLocation(v)
                      setErrors((prev) => ({ ...prev, location: undefined }))
                    }}
                    placeholder="Business location"
                    error={errors.location}
                    leftIcon={<MapPin className="h-4 w-4" />}
                  />

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

                  <Input
                    id="pancardNumber"
                    label={<>PAN Card Number <span className="text-gray-400">(optional)</span></>}
                    type="text"
                    value={pancardNumber}
                    onChange={(v) => {
                      setPancardNumber(v)
                      setErrors((prev) => ({ ...prev, pancardNumber: undefined }))
                    }}
                    placeholder="Enter PAN card number"
                    error={errors.pancardNumber}
                    leftIcon={<CreditCard className="h-4 w-4" />}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 sticky bottom-0 border-t border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-4 sm:px-6 sm:py-4">
          <Button type="submit" variant="primary" size="lg" className="w-full">
            Sign Up
          </Button>
          <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-3">
            Already have an account?{' '}
            <Button type="button" variant="ghost" className="!p-0 font-bold text-teal-700 hover:underline dark:text-emerald-400" onClick={() => navigate('/login')}>
              Login
            </Button>
          </p>
        </div>
      </form>
    </div>
  )
}
