'use client'

import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium tracking-tight rounded-none select-none cursor-pointer',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          {
            'primary': 'bg-white text-black hover:bg-neutral-200 active:bg-neutral-300',
            'secondary': 'bg-transparent text-white border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900',
            'ghost': 'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-900',
            'danger': 'bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 hover:text-red-300',
          }[variant],
          {
            'sm': 'text-xs px-3 py-1.5',
            'md': 'text-sm px-4 py-2',
            'lg': 'text-sm px-6 py-3',
          }[size],
          className
        )}
        {...props}
      >
        {loading && (
          <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
