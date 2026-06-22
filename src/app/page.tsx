import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { ERRORS, BooferErrorCode } from '@/lib/errors'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface HomePageProps {
  searchParams: Promise<{ error?: string }>
}

const features = [
  {
    icon: '< />',
    title: 'Simple SDK',
    description: 'One CDN script bridges your HTML5 game with the native Boofer app.',
  },
  {
    icon: '↑',
    title: 'Instant Publishing',
    description: 'Upload your .html file and submit for review. Approved games go live globally.',
  },
  {
    icon: '✓',
    title: 'Verified Platform',
    description: 'All games are reviewed by Boofer to ensure safety and quality for all users.',
  },
  {
    icon: '▤',
    title: 'Analytics',
    description: 'Track game performance, player counts, and leaderboard engagement.',
  },
]

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const errorCode = params.error as BooferErrorCode | undefined
  const error = errorCode ? ERRORS[errorCode] : null

  return (
    <div className="fancy-bg" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Fancy radial glow behind the content */}
      <div className="fancy-glow" />

      <PublicNavbar />

      {/* ─── Hero ─────────────────────────────── */}
      <section style={{ paddingTop: '150px', paddingBottom: '100px', flex: '1 0 auto', position: 'relative', zIndex: 10 }}>
        <div className="container-base" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          {/* Status pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            border: '1px solid var(--border-color)', background: 'var(--card-bg)',
            padding: '6px 14px', borderRadius: '20px',
            marginBottom: '32px', fontSize: '12px', color: 'var(--text-muted)'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            Platform open for developers
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 'clamp(44px, 7vw, 72px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: '24px',
            maxWidth: '800px',
          }}>
            Build games<br />
            <span style={{ color: 'var(--text-muted)' }}>for Boofer.</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: '16px',
            color: 'var(--text-muted)',
            lineHeight: 1.7,
            marginBottom: '48px',
            maxWidth: '520px',
          }}>
            Publish your HTML5 games to millions of Boofer users. Integrate the SDK, upload your game, and earn revenue — all from one place.
          </p>

          {/* Error Banner */}
          {error && (
            <div style={{
              border: '1px solid rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.05)',
              padding: '16px 20px',
              marginBottom: '32px',
              maxWidth: '400px',
              textAlign: 'left',
            }}>
              <p style={{ fontSize: '13px', color: '#f87171', fontWeight: 600 }}>{error.message}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>{error.hint}</p>
            </div>
          )}

          {/* Get Started CTA */}
          <Link
            href="/onboarding"
            className="btn-hero"
          >
            Get Started <ArrowRight size={16} />
          </Link>

        </div>
      </section>

      {/* ─── Features ─────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--border-color)', position: 'relative', zIndex: 10 }}>
        <div className="container-base" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            border: '1px solid var(--border-color)',
            background: 'var(--card-bg)',
          }}>
            {features.map((f, i) => (
              <div
                key={f.title}
                style={{
                  padding: '32px 28px',
                  borderRight: i < features.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}
              >
                <span style={{
                  display: 'block',
                  fontSize: '18px',
                  color: 'var(--text-color)',
                  opacity: 0.3,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  marginBottom: '16px',
                }}>
                  {f.icon}
                </span>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '10px' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Docs CTA ─────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--border-color)', position: 'relative', zIndex: 10 }}>
        <div className="container-base" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-color)', marginBottom: '6px' }}>
                Read the documentation
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                SDK reference, integration guides, and platform policies.
              </p>
            </div>
            <Link
              href="/docs"
              className="btn-primary"
            >
              Browse Docs →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border-color)', position: 'relative', zIndex: 10, background: 'var(--bg-color)' }}>
        <div className="container-base" style={{ paddingTop: '24px', paddingBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Boofer — All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[
              { href: '/docs', label: 'Docs' },
              { href: '/docs/faq', label: 'FAQ' },
              { href: 'https://github.com/ogxaor/xaor', label: 'GitHub' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="footer-link">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
