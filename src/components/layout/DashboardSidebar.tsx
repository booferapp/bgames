'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Gamepad2, Settings, BookOpen, ExternalLink, ChevronRight } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/games', label: 'Games', icon: Gamepad2 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const docItems = [
  { href: '/docs', label: 'Introduction' },
  { href: '/docs/quickstart', label: 'Quick Start' },
  { href: '/docs/sdk', label: 'SDK Reference' },
  { href: '/docs/profiles', label: 'Player Profiles' },
  { href: '/docs/monetization', label: 'Monetization' },
  { href: '/docs/faq', label: 'FAQ' },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[#000] border-r border-neutral-900 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-neutral-900">
        <Link href="/" className="flex items-center gap-2.5">
          <img 
            src="/assets/images/cg-new-b-games.svg" 
            alt="Boofer Games" 
            style={{ height: '22px', width: 'auto', display: 'block' }}
          />
          <div>
            <span className="text-white text-sm font-semibold tracking-tight">Boofer Games</span>
            <span className="text-neutral-600 text-xs block leading-none">Dev Console</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="mb-6">
          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest px-2 mb-2">Dashboard</p>
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-2 py-2 text-sm rounded-none w-full mb-0.5',
                  isActive
                    ? 'text-white bg-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/50'
                )}
              >
                <item.icon size={14} />
                {item.label}
                {isActive && <ChevronRight size={12} className="ml-auto" />}
              </Link>
            )
          })}
        </div>

        <div>
          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest px-2 mb-2">Docs</p>
          {docItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-2 py-1.5 text-sm text-neutral-500 hover:text-neutral-200 mb-0.5"
            >
              <span className="w-1 h-1 rounded-full bg-neutral-700 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-neutral-900">
        <Link
          href="https://booferapp.github.io"
          target="_blank"
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-600 hover:text-neutral-400"
        >
          <ExternalLink size={11} />
          Boofer Platform
        </Link>
      </div>
    </aside>
  )
}
