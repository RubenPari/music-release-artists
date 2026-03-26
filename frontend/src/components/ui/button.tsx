import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const variantStyles = {
  primary: 'bg-[#aa3bff] text-white hover:bg-[#9331e6] disabled:bg-[#aa3bff]/50',
  secondary: 'bg-[#f4f3ec] text-[#08060d] hover:bg-[#e8e7df] disabled:bg-[#f4f3ec]/50',
  outline: 'border border-[#e5e4e7] text-[#6b6375] hover:bg-[#f4f3ec] disabled:opacity-50',
  ghost: 'text-[#6b6375] hover:bg-[#f4f3ec] disabled:opacity-50',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-lg font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-[#aa3bff]/50 focus:ring-offset-2
        disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
}
