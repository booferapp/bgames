import { HelpCircle } from 'lucide-react'

export default function FaqPage() {
  const faqs = [
    {
      q: 'Why am I getting a "Security Violation: Inlined Boofer SDK detected" error?',
      a: 'Directly inlining the Boofer SDK code into your HTML files is forbidden to prevent tampering and simplify version updates. You must reference the SDK file externally using the script tag: <script src="boofer-sdk.js"></script>.'
    },
    {
      q: 'Why does my game fail the remote SDK integrity check?',
      a: 'If you point your script tag to an absolute URL (like a github.io CDN), the upload verification tool tries to download and verify it. This process can fail due to CORS headers or network problems. We recommend using a relative reference: <script src="boofer-sdk.js"></script>.'
    },
    {
      q: 'Can I test my game locally outside the Boofer mobile app?',
      a: 'Yes. To bypass the WebView bridge restriction during local development, include <meta name="boofer-env" content="development"> in your game\'s <head>. Be sure to remove this meta tag before uploading the final production version.'
    }
  ]

  return (
    <div className="space-y-12">
      <div className="pb-8 border-b border-neutral-900">
        <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-3">Platform</p>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-4">Frequently Asked Questions</h1>
        <p className="text-neutral-500 leading-relaxed max-w-2xl">
          Find answers to common questions about SDK configuration, submission, and developer accounts.
        </p>
      </div>

      <div className="space-y-8">
        {faqs.map((faq, i) => (
          <div key={i} className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-start gap-2.5">
              <HelpCircle size={18} className="text-neutral-600 mt-0.5 flex-shrink-0" />
              <span>{faq.q}</span>
            </h3>
            <p className="text-sm text-neutral-500 leading-relaxed pl-7">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
