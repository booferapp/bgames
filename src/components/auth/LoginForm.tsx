'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!identifier.trim() || !password.trim()) return

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Resolve handle or recovery email to primary email using RPC
      const { data: resolvedEmail, error: rpcError } = await supabase.rpc('get_email_by_identifier', {
        identifier: identifier.trim(),
      })

      if (rpcError) {
        throw new Error(rpcError.message)
      }

      // If resolving failed and the input is not a direct email format, throw error
      const loginEmail = resolvedEmail || identifier.trim()
      if (!resolvedEmail && !identifier.includes('@')) {
        throw new Error('Username not found. Please enter a valid username, email, or recovery email.')
      }

      // Standard Supabase authentication with password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      })

      if (authError) {
        throw new Error(authError.message)
      }

      // Redirect to dashboard on success
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Invalid username/email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Username, Email or Recovery Email
        </label>
        <input
          id="username-input"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="e.g. @surya or email"
          required
          style={{
            width: '100%',
            background: 'var(--input-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-color)',
            fontSize: '13px',
            padding: '10px 12px',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--text-muted)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          style={{
            width: '100%',
            background: 'var(--input-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-color)',
            fontSize: '13px',
            padding: '10px 12px',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--text-muted)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        />
      </div>

      {error && (
        <p style={{ fontSize: '12px', color: '#f87171', textAlign: 'left', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '8px 12px' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          background: 'var(--button-bg)',
          color: 'var(--button-text)',
          border: 'none',
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '6px',
          transition: 'opacity 0.2s',
        }}
      >
        {loading && (
          <span style={{
            width: '14px',
            height: '14px',
            border: '2px solid rgba(0,0,0,0.2)',
            borderTopColor: 'var(--button-text)',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.7s linear infinite',
          }} />
        )}
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}
