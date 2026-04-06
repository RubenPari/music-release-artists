import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-white p-6 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '', ...props }: CardProps) {
  return (
    <h2 className={`text-xl font-semibold text-foreground ${className}`} {...props}>
      {children}
    </h2>
  )
}

export function CardContent({ children, className = '', ...props }: CardProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}
