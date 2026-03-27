import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'album' | 'single' | 'ep' | 'compilation'
  size?: 'sm' | 'md'
}

const variantStyles = {
  default: 'bg-[#f4f3ec] text-[#6b6375]',
  album: 'bg-[#aa3bff]/10 text-[#aa3bff]',
  single: 'bg-[#22c55e]/10 text-[#22c55e]',
  ep: 'bg-[#3b82f6]/10 text-[#3b82f6]',
  compilation: 'bg-[#f59e0b]/10 text-[#f59e0b]',
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
      `}
    >
      {children}
    </span>
  )
}
