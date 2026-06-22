'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Key, Copy, Eye, EyeOff, CheckCircle } from 'lucide-react'

export function ApiKeyCard({ apiKey }: { apiKey: string }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copyKey() {
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayKey = visible ? apiKey : `${apiKey.slice(0, 8)}${'•'.repeat(Math.max(0, apiKey.length - 8))}`

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Key size={14} className="text-neutral-500" />
        <CardTitle>API Key</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-neutral-500 mb-3">
          Embed this key in your game HTML as{' '}
          <code className="text-neutral-300 bg-neutral-900 px-1 py-0.5">
            {'<meta name="boofer-api-key" content="YOUR_KEY">'}
          </code>
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-neutral-900 border border-neutral-800 px-3 py-2.5 font-mono text-xs text-neutral-300 overflow-hidden">
            {displayKey}
          </div>
          <button
            onClick={() => setVisible(!visible)}
            className="p-2.5 border border-neutral-800 text-neutral-600 hover:text-white hover:border-neutral-600"
          >
            {visible ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button
            onClick={copyKey}
            className="p-2.5 border border-neutral-800 text-neutral-600 hover:text-white hover:border-neutral-600"
          >
            {copied ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} />}
          </button>
        </div>
        <p className="text-xs text-neutral-700 mt-2">
          Keep this key private. Do not share it or commit it to public repositories.
        </p>
      </CardContent>
    </Card>
  )
}
