import Link from 'next/link'
import { Smartphone, Zap, Move } from 'lucide-react'

function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  return (
    <div className="bg-[#0a0a0a] border border-neutral-900 mb-5 overflow-hidden">
      {filename && (
        <div className="px-4 py-2 border-b border-neutral-900 flex justify-between bg-[#070707]">
          <span className="text-xs text-neutral-600 font-mono">{filename}</span>
        </div>
      )}
      <pre className="px-5 py-4 overflow-x-auto text-sm text-neutral-300 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function MobilePage() {
  return (
    <div className="space-y-12">
      <div className="pb-8 border-b border-neutral-900">
        <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-3">Guides</p>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-4">Mobile Adaptations</h1>
        <p className="text-neutral-500 leading-relaxed max-w-2xl">
          Build mobile-first interactive HTML5 experiences optimized for mobile webviews.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Smartphone size={18} className="text-neutral-500" />
          Responsive Layouts & Viewport
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Ensure your games are configured to fit within varying canvas limits by using absolute scaling. Set your viewport metadata:
        </p>
        <CodeBlock code={`<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`} filename="index.html" />
      </section>

      <section className="space-y-4 pt-6 border-t border-neutral-900">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap size={18} className="text-neutral-500" />
          Haptic Telemetry Feedback
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Provide satisfying mechanical clicks during touch inputs by utilizing Boofer's native haptics engine:
        </p>
        <CodeBlock code={`// Simple click feedback
canvas.addEventListener('touchstart', () => {
  Boofer.triggerHaptic('light');
});`} />
      </section>
    </div>
  )
}
