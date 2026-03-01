import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import axios from 'axios' 
import { loginapi, meapi } from '../utils/apipath'
import { useNavigate } from 'react-router-dom'





export default function Login():JSX.Element {
    const navigate = useNavigate();
    
    const [email,setEmail]=useState('');
    const [password,setPassword]=useState('');
    const [errors, setErrors] = useState<{
      email?: string
      password?: string
      general?: string
    }>({})
    
    const handelFromSubmit= async(e: FormEvent<HTMLFormElement>)=>
    {
         e.preventDefault();
         setErrors({})
         try {
            const data= {email,password}
            const response =await axios.post(loginapi,data, {
                withCredentials:true,
                headers: {
                    'Content-Type': 'application/json',
                }
                
            })
            if(response.data.message){
                const token = response.data?.data?.token || response.data?.token
                if (token) {
                  localStorage.setItem('token', token)
                }
                localStorage.setItem('isLoggedIn', 'true')
                let role = response.data?.data?.role || response.data?.user?.role
                if (!role) {
                  const meResponse = await axios.get(meapi, {
                    withCredentials: true,
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  })
                  role = meResponse?.data?.data?.role
                }
                const normalizedRole = String(role).toLowerCase()
                const isBusinessDashboardRole = normalizedRole === 'business' || normalizedRole === 'governmentservices'
                alert(response.data.message)
                navigate(isBusinessDashboardRole ? '/business-dashboard' : '/dashboard')
            }
         } catch (error: any) {
            localStorage.removeItem('isLoggedIn')
            const responseData = error?.response?.data

            if (responseData?.field && responseData?.error) {
              setErrors({ [responseData.field]: responseData.error })
            } else if (responseData?.errors && typeof responseData.errors === 'object') {
              const mapped = responseData.errors as Record<string, string>
              setErrors({
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
    <div className="min-h-screen bg-[radial-gradient(55rem_28rem_at_90%_-20%,#c8efe3_5%,transparent_65%),radial-gradient(42rem_25rem_at_-10%_120%,#ffcfa6_5%,transparent_65%),linear-gradient(140deg,#fffdf8_0%,#f5fbff_100%)] px-6 py-8 grid place-items-center">
      <div className="w-full max-w-[460px] rounded-2xl border border-teal-700/20 bg-gradient-to-b from-white to-amber-50 p-6 sm:p-8 shadow-[0_30px_50px_-32px_rgba(19,49,84,0.32)]">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-teal-700">Suggestion Platform</p>
        <h1 className="mt-2 mb-1 text-3xl sm:text-4xl font-bold leading-tight text-slate-800">Welcome back</h1>
        <p className="mb-5 text-sm text-slate-600">Log in to continue sharing and managing ideas.</p>
        {errors.general && <p className="mb-3 text-sm text-red-600">{errors.general}</p>}
        <form className="grid gap-2.5" onSubmit={handelFromSubmit} noValidate>
          <label htmlFor="login-email" className="text-xs font-semibold tracking-wide text-slate-800">Email</label>
          <input
            id="login-email"
            className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition ${
              errors.email
                ? 'border-red-400 focus:border-red-500 focus:ring-3 focus:ring-red-200'
                : 'border-slate-300 focus:border-teal-600 focus:ring-3 focus:ring-teal-600/20'
            }`}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((prev) => ({ ...prev, email: undefined, general: undefined }))
            }}
          />
          {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
          <label htmlFor="login-password" className="text-xs font-semibold tracking-wide text-slate-800">Password</label>
          <input
            id="login-password"
            className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition ${
              errors.password
                ? 'border-red-400 focus:border-red-500 focus:ring-3 focus:ring-red-200'
                : 'border-slate-300 focus:border-teal-600 focus:ring-3 focus:ring-teal-600/20'
            }`}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrors((prev) => ({ ...prev, password: undefined, general: undefined }))
            }}
          />
          {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
          <button className="mt-2 rounded-xl bg-gradient-to-r from-teal-700 to-teal-500 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0" type='submit'>Login</button>
          <p className="mt-2 text-sm text-slate-500">
            New here?{' '}
            <button className="border-none bg-transparent p-0 font-bold text-teal-700 hover:underline" type="button" onClick={() => navigate('/signup')}>Create account</button>
          </p>
        </form>
      </div>
    </div>
  )
}
