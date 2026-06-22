import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  return (
    <div className="bg-[#0a0a0a] border border-neutral-900 mb-5 overflow-hidden">
      {filename && (
        <div className="px-4 py-2 border-b border-neutral-900 flex justify-between">
          <span className="text-xs text-neutral-600 font-mono">{filename}</span>
        </div>
      )}
      <pre className="px-5 py-4 overflow-x-auto text-sm text-neutral-300 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function QuickStartPage() {
  return (
    <div>
      <p className="text-xs text-neutral-600 uppercase tracking-widest mb-3">Getting Started</p>
      <h1 className="text-3xl font-bold text-white tracking-tight mb-4">Quick Start</h1>
      <p className="text-neutral-500 leading-relaxed mb-10">
        Build and integrate your first Boofer-ready HTML5 game in under 5 minutes.
      </p>

      <div className="space-y-10">
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-neutral-700 text-sm font-mono">01</span> Include the SDK
          </h2>
          <p className="text-sm text-neutral-500 mb-3">Add the CDN script to your game&apos;s <code className="text-neutral-400">{'<head>'}</code>:</p>
          <CodeBlock
            code={`<head>
  <!-- Boofer SDK -->
  <script src="https://booferapp.github.io/bgames/assets/sdk/boofer-sdk.js"></script>

  <!-- Your API key (required) -->
  <meta name="boofer-api-key" content="YOUR_API_KEY">

  <!-- Environment tag (remove before publishing) -->
  <meta name="boofer-env" content="development">
</head>`}
            filename="index.html"
          />
          <div className="border border-amber-900 bg-amber-950/20 px-4 py-3">
            <p className="text-xs text-amber-600 font-semibold mb-1">⚠️ Important</p>
            <p className="text-xs text-amber-700">Remove <code>{'<meta name="boofer-env" content="development">'}</code> before submitting your game. Without it, the SDK will block your game from loading outside the Boofer app.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-neutral-700 text-sm font-mono">02</span> Initialize your game
          </h2>
          <CodeBlock
            code={`(async () => {
  try {
    // 1. Wait for the native bridge
    await Boofer.ready();

    // 2. Initialize and get player context
    const ctx = await Boofer.initGame({ gameId: 'my_game' });
    console.log('Player:', ctx.player.handle);
    console.log('High Score:', ctx.high_score);

    // Start your game loop
    startGame(ctx.player, ctx.high_score);
  } catch (err) {
    console.warn('Running outside Boofer:', err.message);
    // Fallback for development/browser testing
    startGame({ handle: 'Guest', id: 'guest' }, 0);
  }
})();`}
            filename="game.js"
          />
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-neutral-700 text-sm font-mono">03</span> Save scores
          </h2>
          <CodeBlock
            code={`// Save the current score
await Boofer.saveScore(1500);

// Signal game over with final score
await Boofer.gameOver(1500, { level: 3, time: 120 });`}
            filename="game.js"
          />
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-neutral-700 text-sm font-mono">04</span> Upload your game
          </h2>
          <p className="text-sm text-neutral-500 mb-3">Once your game is ready, upload it from your developer dashboard.</p>
          <Link
            href="/dashboard/games/upload"
            className="inline-flex items-center gap-2 bg-white text-black text-sm font-medium px-4 py-2 hover:bg-neutral-200"
          >
            Go to Upload <ArrowRight size={13} />
          </Link>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-neutral-900 flex items-center justify-between">
        <div />
        <Link href="/docs/sdk" className="text-sm text-neutral-500 hover:text-white flex items-center gap-1">
          SDK Reference <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}
