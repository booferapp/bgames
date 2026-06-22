'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Bell, Menu } from 'lucide-react'
import { ThemeToggle } from '../theme/ThemeToggle'

export function DashboardHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="h-12 border-b border-neutral-900 bg-black flex items-center justify-between px-6 gap-4 flex-shrink-0">
      <button 
        onClick={onMenuClick}
        className="lg:hidden text-neutral-500 hover:text-white p-1 focus:outline-none"
      >
        <Menu size={18} />
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:text-neutral-300">
          <Bell size={14} />
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-white"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </header>
  )
}
