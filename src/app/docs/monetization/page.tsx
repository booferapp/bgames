import Link from 'next/link'
import { DollarSign, Gift, Play } from 'lucide-react'

import { CodeBlock } from '@/components/ui/CodeBlock'

export default function MonetizationPage() {
  return (
    <div className="space-y-12">
      <div className="pb-8 border-b border-neutral-900">
        <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-3">Guides</p>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-4">Monetization</h1>
        <p className="text-neutral-500 leading-relaxed max-w-2xl">
          Learn how to display advertisements, handle rewards, and generate revenue from your HTML5 games.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Gift size={18} className="text-neutral-500" />
          Rewarded Videos
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Allow players to watch voluntary video ads in exchange for in-game currencies, lives, or boosts. Subscribe to the reward listener to trigger rewards:
        </p>
        <CodeBlock code={`// Subscribe to rewarded events
const unsubscribe = Boofer.onRewardEarned(({ type, amount }) => {
  if (type === 'extra_life') {
    player.lives += amount;
    resumeGame();
  }
});`} />
      </section>
    </div>
  )
}
