import Link from 'next/link'
import { ArrowRight, Terminal, User, Trophy, ShieldAlert, Cpu, Heart } from 'lucide-react'

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

export default function SdkReferencePage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="pb-8 border-b border-neutral-900">
        <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-3">SDK Reference</p>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-4">API Documentation</h1>
        <p className="text-neutral-500 leading-relaxed max-w-2xl">
          Complete client-side JavaScript API reference for the Boofer SDK (v2.0.0). The SDK operates as a bridge between your HTML5 game and the native Boofer App WebView shell.
        </p>
      </div>

      {/* Section 1: Overview */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Terminal size={18} className="text-neutral-500" />
          Overview
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          The Boofer SDK is lightweight, has zero dependencies, and doesn't store credentials or perform direct database calls. All operations are dispatched as secure messages to the Android/iOS native layer via <code>postMessage</code>.
        </p>
        <p className="text-neutral-500 text-sm leading-relaxed">
          To integrate, embed the script relatively in your document:
        </p>
        <CodeBlock code={`<script src="boofer-sdk.js"></script>`} filename="index.html" />
      </section>

      {/* Section 2: Lifecycle & Init */}
      <section id="lifecycle" className="space-y-6 pt-6 border-t border-neutral-900">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu size={18} className="text-neutral-500" />
          Lifecycle & Init
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Initialize communication with the parent shell immediately upon game startup.
        </p>

        <div className="space-y-6">
          <div className="border border-neutral-900 p-5 bg-[#030303]">
            <h3 className="text-sm font-bold font-mono text-white mb-2">Boofer.ready(timeoutMs?)</h3>
            <p className="text-neutral-500 text-sm mb-3">
              Returns a <code>Promise&lt;boolean&gt;</code> resolving when the native bridge channel is successfully injected. Standard timeout defaults to <code>6000ms</code>.
            </p>
            <CodeBlock code={`await Boofer.ready(5000); // Wait up to 5s`} />
          </div>

          <div className="border border-neutral-900 p-5 bg-[#030303]">
            <h3 className="text-sm font-bold font-mono text-white mb-2">Boofer.initGame(options?)</h3>
            <p className="text-neutral-500 text-sm mb-3">
              Starts the session. Resolves with player profiles, active session, and custom game configs from the developer console.
            </p>
            <CodeBlock code={`const config = await Boofer.initGame({
  gameId: 'super_runner',
  gameVersion: '1.0.0'
});

console.log("Welcome back,", config.player.displayName);`} />
          </div>
        </div>
      </section>

      {/* Section 3: Player & Sessions */}
      <section id="players" className="space-y-6 pt-6 border-t border-neutral-900">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <User size={18} className="text-neutral-500" />
          Player & Sessions
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Retrieve rich player profile data, session diagnostics, and secure web tokens.
        </p>

        <div className="space-y-6">
          <div className="border border-neutral-900 p-5 bg-[#030303]">
            <h3 className="text-sm font-bold font-mono text-white mb-2">Boofer.getPlayerInfo(fresh?)</h3>
            <p className="text-neutral-500 text-sm mb-3">
              Retrieves the logged-in player profile. If <code>fresh</code> is set to true, it skips client caches and queries the live database.
            </p>
            <CodeBlock code={`const player = await Boofer.getPlayerInfo(true);
// { userId, displayName, avatarUrl, level, xp, highScore, badges[] }`} />
          </div>

          <div className="border border-neutral-900 p-5 bg-[#030303]">
            <h3 className="text-sm font-bold font-mono text-white mb-2">Boofer.getSessionInfo()</h3>
            <p className="text-neutral-500 text-sm mb-3">
              Returns a synchronous snapshot of the active gaming session stats (playtime duration, current score).
            </p>
            <CodeBlock code={`const stats = Boofer.getSessionInfo();
console.log(\`Playtime: \${stats.duration / 1000}s\`);`} />
          </div>

          <div className="border border-neutral-900 p-5 bg-[#030303]">
            <h3 className="text-sm font-bold font-mono text-white mb-2">Boofer.getSessionToken()</h3>
            <p className="text-neutral-500 text-sm mb-3">
              Fetches a signed payload verified with the Xaor Cryptographic Engine on server webhooks for secure server-side integrations.
            </p>
            <CodeBlock code={`const { token } = await Boofer.getSessionToken();
// Send token to your own server endpoint for verification`} />
          </div>
        </div>
      </section>

      {/* Section 4: Scores & Overlays */}
      <section id="scores" className="space-y-6 pt-6 border-t border-neutral-900">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy size={18} className="text-neutral-500" />
          Scores & Overlays
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Submit score telemetry and show native application leaderboards and share interfaces.
        </p>

        <div className="space-y-6">
          <div className="border border-neutral-900 p-5 bg-[#030303]">
            <h3 className="text-sm font-bold font-mono text-white mb-2">Boofer.saveScore(score, meta?)</h3>
            <p className="text-neutral-500 text-sm mb-3">
              Saves a player's score to the global leaderboards. Non-negative integers only.
            </p>
            <CodeBlock code={`await Boofer.saveScore(24800, { combo: 4, character: 'ninja' });`} />
          </div>

          <div className="border border-neutral-900 p-5 bg-[#030303]">
            <h3 className="text-sm font-bold font-mono text-white mb-2">Boofer.gameOver(finalScore, meta?)</h3>
            <p className="text-neutral-500 text-sm mb-3">
              Signals the end of a match. Submits the score and opens the native post-match leaderboard display automatically.
            </p>
            <CodeBlock code={`await Boofer.gameOver(24800, { reason: 'fallen' });`} />
          </div>

          <div className="border border-neutral-900 p-5 bg-[#030303]">
            <h3 className="text-sm font-bold font-mono text-white mb-2">Boofer.showLeaderboard()</h3>
            <p className="text-neutral-500 text-sm mb-3">
              Renders the native full-screen leaderboard interface over the webview page.
            </p>
            <CodeBlock code={`Boofer.showLeaderboard();`} />
          </div>

          <div className="border border-neutral-900 p-5 bg-[#030303]">
            <h3 className="text-sm font-bold font-mono text-white mb-2">Boofer.shareScore(score, message?)</h3>
            <p className="text-neutral-500 text-sm mb-3">
              Opens the native mobile share sheet, allowing players to share their scores onto Whatsapp, Discord, or Twitter.
            </p>
            <CodeBlock code={`await Boofer.shareScore(24800, "I just reached Level 10!");`} />
          </div>
        </div>
      </section>

      {/* Section 5: Telemetry & Haptics */}
      <section id="telemetry" className="space-y-6 pt-6 border-t border-neutral-900">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Heart size={18} className="text-neutral-500" />
          Telemetry & Haptics
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Send custom events and trigger device vibration motor patterns.
        </p>

        <div className="space-y-6">
          <div className="border border-neutral-900 p-5 bg-[#030303]">
            <h3 className="text-sm font-bold font-mono text-white mb-2">Boofer.trackEvent(name, data?)</h3>
            <p className="text-neutral-500 text-sm mb-3">
              Publishes custom analytics events for the dashboard graph views.
            </p>
            <CodeBlock code={`await Boofer.trackEvent('purchase_attempt', { itemId: 'laser_gun', goldValue: 50 });`} />
          </div>

          <div className="border border-neutral-900 p-5 bg-[#030303]">
            <h3 className="text-sm font-bold font-mono text-white mb-2">Boofer.triggerHaptic(type)</h3>
            <p className="text-neutral-500 text-sm mb-3">
              Vibrates the mobile device if supported. Types: <code>'light'</code> | <code>'medium'</code> | <code>'heavy'</code> | <code>'success'</code> | <code>'warning'</code> | <code>'error'</code>.
            </p>
            <CodeBlock code={`await Boofer.triggerHaptic('success');`} />
          </div>
        </div>
      </section>

      {/* Section 6: Event Listeners */}
      <section className="space-y-6 pt-6 border-t border-neutral-900">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert size={18} className="text-neutral-500" />
          Event Subscriptions
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Subscribe to event streams dispatched from the host shell.
        </p>

        <div className="space-y-6">
          <div className="border border-neutral-900 p-5 bg-[#030303]">
            <h3 className="text-sm font-bold font-mono text-white mb-2">Boofer.onAppEvent(event, callback)</h3>
            <p className="text-neutral-500 text-sm mb-3">
              Listens to application state occurrences. Events: <code>'pause'</code> | <code>'resume'</code> | <code>'close'</code>.
            </p>
            <CodeBlock code={`const unsubscribe = Boofer.onAppEvent('pause', () => {
  pauseGameLoop();
});`} />
          </div>
        </div>
      </section>
    </div>
  )
}
