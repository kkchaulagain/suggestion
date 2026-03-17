import type { ReactNode } from 'react'
import PhoneInput from 'react-phone-input-2'
import '../../../styles/react-phone-input-2.css'
import FieldWrapper from './FieldWrapper'

export interface PhoneFieldProps {
  id: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
}

export default function PhoneField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
}: PhoneFieldProps) {
  return (
    <FieldWrapper id={id} label={label} error={error}>
      <PhoneInput
        country="np"
        specialLabel=""
        enableSearch
        value={value}
        onChange={(nextPhone) => onChange(nextPhone)}
        inputProps={{
          id,
          name: id,
          required,
          disabled,
        }}
        placeholder={placeholder || '+1 (555) 000-0000'}
        containerClass="w-full"
        buttonClass={`!border !rounded-l-lg !border-r-0 !bg-white hover:!bg-white dark:!bg-slate-800 dark:hover:!bg-slate-800 ${
          error ? '!border-red-400 dark:!border-red-500' : '!border-slate-300 dark:!border-slate-600'
        }`}
        inputClass={`!w-full !min-h-[44px] !rounded-lg !border !bg-white !py-2.5 !pl-14 !pr-3 !text-base !text-slate-900 !outline-none !transition focus:!border-emerald-600 focus:!ring-2 focus:!ring-emerald-600/20 dark:!border-slate-600 dark:!bg-slate-800 dark:!text-slate-100 dark:focus:!border-emerald-500 dark:focus:!ring-emerald-500/30 ${
          error
            ? '!border-red-400 focus:!border-red-500 focus:!ring-red-200 dark:!border-red-500 dark:focus:!ring-red-500/30'
            : '!border-slate-300'
        }`}
        dropdownClass="!bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-slate-100"
        searchClass="!bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-slate-100"
        disabled={disabled}
      />
    </FieldWrapper>
  )
}
