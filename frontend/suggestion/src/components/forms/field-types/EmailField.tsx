import { useState, type ReactNode } from 'react'
import FieldWrapper from './FieldWrapper'
import {Input} from '../../ui'
export interface EmailFieldProps{
    id:string,
    label:ReactNode,
    value:string,
    onChange:(value:string)=>void,
    placeholder?:string,
    disabled?:boolean,
    required?:boolean,
    error?:string,
    isAnonymous?:boolean
}
export default function EmailField(
{
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled=false,
  required=false,
  isAnonymous=false,
  error,

}:EmailFieldProps)
{
    const[anonymous,setAnonymous]=useState(false)
    const handleAnonymousToggle=(checked:boolean)=>
    {
        setAnonymous(checked)
        onChange(checked?'Anonymous':'')
    }
    return (
        <FieldWrapper id={id} label={label}>
            <Input
                id={id}
                type='email'           
                value={anonymous? '':value}
                onChange={onChange}
                placeholder={anonymous?'You are anonymous':placeholder}
                required={!anonymous && required}
                disabled={disabled||anonymous}
                error={anonymous ? undefined : error}
            />
            {isAnonymous?(
               <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => handleAnonymousToggle(e.target.checked)}
              disabled={disabled}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600"
            />
            Submit anonymously
          </label>
            ):null}
        </FieldWrapper>
    )
}
