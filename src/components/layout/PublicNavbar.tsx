'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '../theme/ThemeToggle'
import { User } from '@supabase/supabase-js'
import { Menu, X } from 'lucide-react'

export function PublicNavbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

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

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex" style={{ alignItems: 'center', gap: '24px' }}>
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

        {/* Mobile Navigation Toggle Button */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-neutral-500 hover:text-white focus:outline-none p-1"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu Dropdown */}
      {menuOpen && (
        <nav className="md:hidden border-t border-neutral-900 bg-black/95 px-6 py-4 flex flex-col gap-3">
          <Link href="/docs" className="nav-link py-1" onClick={() => setMenuOpen(false)}>
            Docs
          </Link>
          <a href="#about" className="nav-link py-1" onClick={() => setMenuOpen(false)}>
            About
          </a>
          <a href="#contact" className="nav-link py-1" onClick={() => setMenuOpen(false)}>
            Contact
          </a>
          <a href="#misuse" className="nav-link py-1" onClick={() => setMenuOpen(false)}>
            Report Misuse
          </a>
          
          <div className="border-t border-neutral-900 pt-3 mt-1 flex items-center justify-between">
            {!loading && (
              user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontSize: '13px',
                    color: 'var(--button-text)',
                    background: 'var(--button-bg)',
                    padding: '6px 14px',
                    textDecoration: 'none',
                    fontWeight: 500,
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/onboarding"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontSize: '13px',
                    color: 'var(--button-text)',
                    background: 'var(--button-bg)',
                    padding: '6px 14px',
                    textDecoration: 'none',
                    fontWeight: 500,
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  Login
                </Link>
              )
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
