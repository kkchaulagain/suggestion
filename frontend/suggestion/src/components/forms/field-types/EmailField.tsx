import type { ReactNode } from 'react'
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
  error,

}:EmailFieldProps)
{
    return (
        <FieldWrapper id={id} label={label}>
            <Input
                id={id}
                type='email'           
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                error={error}
            />
        </FieldWrapper>
    )
}
