'use client'

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

  return (
    <aside className="sticky top-16 w-52 flex-shrink-0 hidden lg:block">
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
  )
}
