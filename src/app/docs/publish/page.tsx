import Link from 'next/link'
import { BookOpen, CheckCircle, Upload, ArrowRight } from 'lucide-react'

import { CodeBlock } from '@/components/ui/CodeBlock'

export default function PublishPage() {
  return (
    <div className="space-y-12">
      <div className="pb-8 border-b border-neutral-900">
        <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-3">Platform</p>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-4">Publishing Guide</h1>
        <p className="text-neutral-500 leading-relaxed max-w-2xl">
          Publish your game to millions of active players on the global Boofer Store.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckCircle size={18} className="text-neutral-500" />
          Pre-Publishing Checklist
        </h2>
        <ul className="list-disc list-inside text-neutral-550 text-sm space-y-2">
          <li>Ensure the relative reference is used: <code>&lt;script src="boofer-sdk.js"&gt;&lt;/script&gt;</code>.</li>
          <li>Remove development mode flags like <code>&lt;meta name="boofer-env" content="development"&gt;</code>.</li>
          <li>Ensure your bundle file size is under 10MB.</li>
        </ul>
      </section>

      <section className="space-y-4 pt-6 border-t border-neutral-900">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Upload size={18} className="text-neutral-500" />
          Submission Process
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Navigate to the developer console under the **Upload** view, drag your single HTML file or ZIP package, verify matches on parameters, and submit it for review!
        </p>
        <Link
          href="/dashboard/games/upload"
          className="inline-flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2 hover:bg-neutral-200 transition-colors"
        >
          Open Developer Dashboard <ArrowRight size={13} />
        </Link>
      </section>
    </div>
  )
}
