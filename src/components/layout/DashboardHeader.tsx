'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Bell } from 'lucide-react'
import { ThemeToggle } from '../theme/ThemeToggle'

export function DashboardHeader() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="h-12 border-b border-neutral-900 bg-black flex items-center justify-end px-6 gap-4 flex-shrink-0">
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
    </header>
  )
}
