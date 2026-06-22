'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '../theme/ThemeToggle'
import { User } from '@supabase/supabase-js'

export function PublicNavbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    // Fetch initial user state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])



  return (
    <header style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 50,
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      transition: 'background 0.3s ease, border-color 0.3s ease',
    }}>
      <div className="container-base" style={{ height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo & Title */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <img 
            src="/assets/images/cg-new-b-games.svg" 
            alt="Boofer Games" 
            style={{ height: '22px', width: 'auto', display: 'block' }}
          />
          <span style={{ 
            color: 'var(--text-color)', 
            fontSize: '13px', 
            fontWeight: 500, 
            borderLeft: '1px solid var(--border-color)', 
            paddingLeft: '8px',
            marginLeft: '2px',
            letterSpacing: '-0.01em',
            transition: 'color 0.3s ease, border-color 0.3s ease'
          }}>
            Developer Console
          </span>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/docs" className="nav-link">
            Docs
          </Link>
          <a href="#about" className="nav-link">
            About
          </a>
          <a href="#contact" className="nav-link">
            Contact
          </a>
          <a href="#misuse" className="nav-link">
            Report Misuse
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
            <ThemeToggle />

            {!loading && (
              user ? (
                <Link
                  href="/dashboard"
                  style={{
                    fontSize: '13px',
                    color: 'var(--button-text)',
                    background: 'var(--button-bg)',
                    padding: '6px 14px',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'background 0.3s ease, color 0.3s ease',
                  }}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/onboarding"
                  style={{
                    fontSize: '13px',
                    color: 'var(--button-text)',
                    background: 'var(--button-bg)',
                    padding: '6px 14px',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'background 0.3s ease, color 0.3s ease',
                  }}
                >
                  Login
                </Link>
              )
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
