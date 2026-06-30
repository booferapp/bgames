import Link from 'next/link'
import { Shield, Key, CheckCircle } from 'lucide-react'

import { CodeBlock } from '@/components/ui/CodeBlock'

export default function XaorPage() {
  return (
    <div className="space-y-12">
      <div className="pb-8 border-b border-neutral-900">
        <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-3">Guides</p>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-4">Xaor Cryptographic Engine</h1>
        <p className="text-neutral-500 leading-relaxed max-w-2xl">
          Secure player scores and prevent client-side spoofing attacks using Boofer's built-in Xaor encryption engine.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield size={18} className="text-neutral-500" />
          Overview
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Xaor is an open-source high-performance cryptographic engine developed by Shaadow Platforms. The Boofer app uses Xaor to sign sessions and scores, creating tamper-proof tokens that your backend servers can verify without making expensive external API requests.
        </p>
      </section>

      <section className="space-y-4 pt-6 border-t border-neutral-900">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Key size={18} className="text-neutral-500" />
          Verifying Tokens on Your Backend
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          First, obtain the secure token from the client-side game via the SDK:
        </p>
        <CodeBlock code={`const { token } = await Boofer.getSessionToken();
// Send this token to your backend`} />
        <p className="text-neutral-500 text-sm leading-relaxed">
          Then, verify it on your server using the <code>xaorjs</code> or other language engines:
        </p>
        <CodeBlock code={`import { verify } from 'xaorjs'

// Verify token using your developer console secret key
const isValid = verify(token, process.env.BOOFER_DEVELOPER_SECRET);
if (isValid) {
  // Score is authenticated and untampered
}`} filename="server.js" />
      </section>
    </div>
  )
}
