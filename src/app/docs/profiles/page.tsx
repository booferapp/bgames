import Link from 'next/link'
import { ArrowRight, User, Award, Shield } from 'lucide-react'

import { CodeBlock } from '@/components/ui/CodeBlock'

export default function ProfilesPage() {
  return (
    <div className="space-y-12">
      <div className="pb-8 border-b border-neutral-900">
        <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-3">Guides</p>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-4">Player Profiles</h1>
        <p className="text-neutral-500 leading-relaxed max-w-2xl">
          Learn how to fetch, utilize, and render player information inside your HTML5 games using the Boofer SDK.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <User size={18} className="text-neutral-500" />
          Fetching Player Data
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Use the <code>Boofer.getPlayerInfo()</code> method to retrieve details about the currently logged-in player.
        </p>
        <CodeBlock code={`const player = await Boofer.getPlayerInfo();
console.log("Player Handle:", player.displayName);
console.log("Player Level:", player.level);`} />
      </section>

      <section className="space-y-4 pt-6 border-t border-neutral-900">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Award size={18} className="text-neutral-500" />
          Profile Fields Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400 border-collapse">
            <thead>
              <tr className="border-b border-neutral-900 text-white font-semibold">
                <th className="py-3 pr-4">Field</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900/50">
              <tr>
                <td className="py-3 pr-4 font-mono text-xs text-white">userId</td>
                <td className="py-3 pr-4 font-mono text-xs text-neutral-500">string</td>
                <td className="py-3">Unique player identifier.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono text-xs text-white">displayName</td>
                <td className="py-3 pr-4 font-mono text-xs text-neutral-500">string</td>
                <td className="py-3">The player's username or nickname.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono text-xs text-white">avatarUrl</td>
                <td className="py-3 pr-4 font-mono text-xs text-neutral-500">string</td>
                <td className="py-3">Public URI to the user's profile image.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono text-xs text-white">level</td>
                <td className="py-3 pr-4 font-mono text-xs text-neutral-500">number</td>
                <td className="py-3">The player's global Boofer level.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono text-xs text-white">highScore</td>
                <td className="py-3 pr-4 font-mono text-xs text-neutral-500">number</td>
                <td className="py-3">The player's personal high score for the game.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
