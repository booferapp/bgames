import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'active' | 'pending' | 'rejected' | 'suspended'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'text-neutral-400 border-neutral-800 bg-neutral-950',
  active: 'text-green-500 border-green-900 bg-green-950',
  pending: 'text-amber-500 border-amber-900 bg-amber-950',
  rejected: 'text-red-500 border-red-900 bg-red-950',
  suspended: 'text-red-400 border-red-900 bg-red-950',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-medium px-2 py-0.5 border uppercase tracking-wider',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
