'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BookOpen } from 'lucide-react'

const sections = [
  {
    title: 'Getting Started',
    items: [
      { href: '/docs', label: 'Introduction' },
      { href: '/docs/quickstart', label: 'Quick Start' },
    ],
  },
  {
    title: 'SDK Reference',
    items: [
      { href: '/docs/sdk', label: 'SDK Overview' },
      { href: '/docs/sdk#lifecycle', label: 'Lifecycle & Init' },
      { href: '/docs/sdk#players', label: 'Player & Sessions' },
      { href: '/docs/sdk#scores', label: 'Scores & Overlays' },
      { href: '/docs/sdk#telemetry', label: 'Telemetry & Haptics' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { href: '/docs/profiles', label: 'Player Profiles' },
      { href: '/docs/monetization', label: 'Monetization' },
      { href: '/docs/mobile', label: 'Mobile Controls' },
      { href: '/docs/xaor', label: 'Xaor Encryption' },
    ],
  },
  {
    title: 'Platform',
    items: [
      { href: '/docs/publish', label: 'Publishing Games' },
      { href: '/docs/faq', label: 'FAQ' },
    ],
  },
]

export function DocsSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Find label of active item to display in the dropdown selector
  const activeItem = sections.flatMap(s => s.items).find(item => item.href === pathname)
  const currentLabel = activeItem ? activeItem.label : 'Select Documentation Page'

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sticky top-20 w-64 flex-shrink-0 hidden lg:block h-[calc(100vh-5rem)] overflow-y-auto border-r border-neutral-900 pr-6 mr-6 custom-scrollbar">
        <div className="py-6">
          {sections.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-2">
                {section.title}
              </p>
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'block py-1 text-sm leading-relaxed',
                      isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Mobile Collapsible Navigation */}
      <div className="lg:hidden w-full border-b border-neutral-900 pb-4 mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-sm font-medium text-white hover:bg-neutral-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            <BookOpen size={15} className="text-neutral-500" />
            {currentLabel}
          </span>
          <span className="text-xs text-neutral-500 font-mono">{isOpen ? 'COLLAPSE ↑' : 'EXPAND ↓'}</span>
        </button>

        {isOpen && (
          <div className="mt-2 bg-[#050505] border border-neutral-900 p-4 flex flex-col gap-4 max-h-[200px] overflow-y-auto">
            {sections.map((section) => (
              <div key={section.title}>
                <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-1.5">
                  {section.title}
                </p>
                <div className="flex flex-col gap-1 pl-2">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'block py-1.5 text-sm',
                          isActive ? 'text-white font-medium' : 'text-neutral-500 hover:text-neutral-350'
                        )}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
