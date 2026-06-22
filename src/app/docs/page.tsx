import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function DocsPage() {
  const sections = [
    { href: '/docs/quickstart', title: 'Quick Start', desc: 'Get up and running in 5 minutes.' },
    { href: '/docs/sdk', title: 'SDK Reference', desc: 'Complete API reference for the Boofer SDK.' },
    { href: '/docs/profiles', title: 'Player Profiles', desc: 'Fetch and display player data.' },
    { href: '/docs/monetization', title: 'Monetization', desc: 'Integrate ads and earn revenue.' },
    { href: '/docs/xaor', title: 'Xaor Encryption', desc: 'Secure game save data with Xaor.' },
    { href: '/docs/publish', title: 'Publishing', desc: 'Submit and manage your games.' },
    { href: '/docs/faq', title: 'FAQ', desc: 'Common questions and answers.' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-10 pb-8 border-b border-neutral-900">
        <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-3">Documentation</p>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-4">Boofer SDK Docs</h1>
        <p className="text-neutral-500 leading-relaxed max-w-xl">
          Everything you need to build, integrate, and publish HTML5 games on the Boofer platform. The SDK is a single JavaScript file that bridges your game with the native Boofer app.
        
        </p>
      </div>

      {/* CDN Install */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Include the SDK</h2>
        <div className="bg-[#0a0a0a] border border-neutral-900 px-5 py-4">
          <code className="text-sm text-neutral-300 font-mono">
            {'<script src="https://booferapp.github.io/bgames/assets/sdk/boofer-sdk.js"></script>'}
          </code>
        </div>
        <p className="text-xs text-neutral-600 mt-2">Add this inside your game&apos;s <code className="text-neutral-500">{'<head>'}</code> tag.</p>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group border border-neutral-900 p-4 hover:border-neutral-700 hover:bg-neutral-950 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white">{s.title}</h3>
              <ArrowRight size={13} className="text-neutral-700 group-hover:text-neutral-400 transition-colors" />
            </div>
            <p className="text-sm text-neutral-600">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
