import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import axios from 'axios' 
import {loginapi} from '../utils/apipath'

const navigateTo = (path: string) => {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function Login():JSX.Element {
    
    const [email,setEmail]=useState('');
    const [password,setPassword]=useState('');
    const [error, setError] = useState('')
    
    const handelFromSubmit= async(e: FormEvent<HTMLFormElement>)=>
    {
         e.preventDefault();
         if( !email || !password)
         {
            setError('Please enter both email and password')
            return
         }
         setError('')
         if(password.length<6)
         {
            alert("Password must be greater than 6 Characters")
            return
         }
         try {
            const data= {email,password}
            const response =await axios.post(loginapi,data, {
                withCredentials:true,
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            if(response.data.message){
                alert(response.data.message)
            }
         } catch (error) {
            console.log(error);
            
         }
    }

  return (
    <div className="min-h-screen bg-[radial-gradient(55rem_28rem_at_90%_-20%,#c8efe3_5%,transparent_65%),radial-gradient(42rem_25rem_at_-10%_120%,#ffcfa6_5%,transparent_65%),linear-gradient(140deg,#fffdf8_0%,#f5fbff_100%)] px-6 py-8 grid place-items-center">
      <div className="w-full max-w-[460px] rounded-2xl border border-teal-700/20 bg-gradient-to-b from-white to-amber-50 p-6 sm:p-8 shadow-[0_30px_50px_-32px_rgba(19,49,84,0.32)]">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-teal-700">Suggestion Platform</p>
        <h1 className="mt-2 mb-1 text-3xl sm:text-4xl font-bold leading-tight text-slate-800">Welcome back</h1>
        <p className="mb-5 text-sm text-slate-600">Log in to continue sharing and managing ideas.</p>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <form className="grid gap-2.5" onSubmit={handelFromSubmit}>
          <label htmlFor="login-email" className="text-xs font-semibold tracking-wide text-slate-800">Email</label>
          <input id="login-email" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-3 focus:ring-teal-600/20" type="email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
          <label htmlFor="login-password" className="text-xs font-semibold tracking-wide text-slate-800">Password</label>
          <input id="login-password" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-3 focus:ring-teal-600/20" type="password" value={password} onChange={(e)=>setPassword(e.target.value)}/>
          <button className="mt-2 rounded-xl bg-gradient-to-r from-teal-700 to-teal-500 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0" type='submit'>Login</button>
          <p className="mt-2 text-sm text-slate-500">
            New here?{' '}
            <button className="border-none bg-transparent p-0 font-bold text-teal-700 hover:underline" type="button" onClick={() => navigateTo('/signup')}>Create account</button>
          </p>
        </form>
      </div>
    </div>
  )
}
