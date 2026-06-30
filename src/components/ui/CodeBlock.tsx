'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="bg-[#0a0a0a] border border-neutral-900 mb-5 overflow-hidden relative group">
      {filename ? (
        <div className="px-4 py-2 border-b border-neutral-900 flex justify-between items-center bg-[#050505]">
          <span className="text-xs text-neutral-500 font-mono">{filename}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors"
          >
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
      )}
      
      <pre className="px-5 py-4 overflow-x-auto text-sm text-neutral-300 font-mono">
        <code>{code}</code>
      </pre>

      {copied && (
        <div className="fixed bottom-6 right-6 bg-neutral-900 border border-neutral-800 text-white px-4 py-2.5 shadow-xl z-50 flex items-center gap-2 rounded-md">
          <Check size={16} className="text-green-500" />
          <span className="text-sm font-medium">Content copied!</span>
        </div>
      )}
    </div>
  )
}
