import { cn } from '@/lib/utils'
import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-neutral-950 border border-neutral-800 text-white text-sm px-3 py-2.5',
            'placeholder:text-neutral-600',
            'focus:outline-none focus:border-neutral-600',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error && 'border-red-900 focus:border-red-700',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-neutral-600">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={4}
          className={cn(
            'w-full bg-neutral-950 border border-neutral-800 text-white text-sm px-3 py-2.5',
            'placeholder:text-neutral-600 resize-none',
            'focus:outline-none focus:border-neutral-600',
            error && 'border-red-900',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-neutral-600">{hint}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
