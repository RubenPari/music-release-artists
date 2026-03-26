import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id || props.name

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[#08060d]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full rounded-lg border px-3 py-2 text-[#08060d] placeholder-[#6b6375]/50
          focus:outline-none focus:ring-2 focus:ring-[#aa3bff]/50 focus:border-[#aa3bff]
          disabled:cursor-not-allowed disabled:bg-[#f4f3ec] disabled:opacity-50
          ${error ? 'border-red-500' : 'border-[#e5e4e7]'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
