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
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full rounded-lg border px-3 py-2 text-foreground placeholder-muted/50
          focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand
          disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-50
          ${error ? 'border-red-500' : 'border-border'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
