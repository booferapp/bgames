'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { Check, Copy, Download, AlertCircle, ArrowRight, Lock, UserCheck, QrCode } from 'lucide-react'
import { useRouter } from 'next/navigation'

const GENRES = ['Puzzle', 'Action', 'Arcade', 'Adventure', 'Sports', 'Strategy', 'Casual', 'Other']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionApproved, setSessionApproved] = useState(false)
  const [loading, setLoading] = useState(false)

  // Step 2 Survey State
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [developerIntent, setDeveloperIntent] = useState('')

  // Step 3 Verification State
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [developer, setDeveloper] = useState<Record<string, unknown> | null>(null)

  // Clipboard & Exporter state
  const [copied, setCopied] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<string | null>(null)



  const supabase = createClient()

  // Gating on load: redirect to dashboard if verified, or jump to Step 3 if pending verification
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return // Stay on Step 1 (QR scan)

      // User is logged in, fetch status
      const [profileRes, devRes] = await Promise.all([
        supabase.from('profiles').select('is_validated, is_verified, recovery_email').eq('id', user.id).single(),
        supabase.from('boofer_developers').select('status, api_key').eq('user_id', user.id).single()
      ])

      const isVerified = profileRes.data?.is_verified
      const hasEmail = !!profileRes.data?.recovery_email
      const devStatus = devRes.data?.status

      if (isVerified && devStatus === 'active' && hasEmail) {
        router.push('/dashboard')
      } else {
        // Verification pending, jump straight to Step 3
        setProfile(profileRes.data)
        setDeveloper(devRes.data)
        setStep(3)
      }
    }

    checkAuth()
  }, [])

  // Step 1: Create session on load if step is 1
  useEffect(() => {
    if (step !== 1 || sessionId) return

    async function initSession() {
      const { data, error } = await supabase
        .from('web_auth_sessions')
        .insert({ status: 'pending' })
        .select('id')
        .single()

      if (error) {
        console.error('Failed to create auth session:', error)
        return
      }

      setSessionId(data.id)
      setSessionStatus('pending')
    }

    initSession()
  }, [step, sessionId])

  // Listen for realtime status changes when sessionId is active
  useEffect(() => {
    if (!sessionId) return

    const channel = supabase
      .channel(`auth-status-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'web_auth_sessions',
          filter: `id=eq.${sessionId}`,
        },
        async (payload: { new: { status: string; access_token?: string; refresh_token?: string } }) => {
          const updated = payload.new
          setSessionStatus(updated.status)

          if (step === 1 && updated.status === 'approved' && updated.access_token && updated.refresh_token) {
            setSessionApproved(true)

            const { error: sessionError } = await supabase.auth.setSession({
              access_token: updated.access_token,
              refresh_token: updated.refresh_token,
            })

            if (sessionError) {
              console.error('Failed to establish session:', sessionError)
              return
            }

            // Clean up tokens in database
            await supabase
              .from('web_auth_sessions')
              .update({ access_token: null, refresh_token: null })
              .eq('id', sessionId)

            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const [profileRes, devRes] = await Promise.all([
                supabase.from('profiles').select('is_validated, is_verified, recovery_email').eq('id', user.id).single(),
                supabase.from('boofer_developers').select('status, api_key').eq('user_id', user.id).single()
              ])
              setProfile(profileRes.data)
              setDeveloper(devRes.data)
            }

            setTimeout(() => {
              setStep(2)
            }, 1000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, step])

  const triggerFaceVerify = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error("No logged-in user")
      setLoading(false)
      return
    }

    // 🛡️ Always check if already verified before triggering
    const { data: freshProfile } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', user.id)
      .single()

    if (freshProfile?.is_verified) {
      setProfile(prev => prev ? { ...prev, is_verified: true } : { is_verified: true })
      setLoading(false)
      return
    }

    if (sessionId) {
      const { error } = await supabase
        .from('web_auth_sessions')
        .update({ status: 'verify_face_pending', user_id: user.id })
        .eq('id', sessionId)
      if (error) {
        console.error(error)
      } else {
        setSessionStatus('verify_face_pending')
      }
    } else {
      // Create session first with 'pending' to satisfy RLS insert policy, then update to 'verify_face_pending'
      const { data, error } = await supabase
        .from('web_auth_sessions')
        .insert({ status: 'pending', user_id: user.id })
        .select('id')
        .single()
      if (error) {
        console.error('Failed to insert session row:', error)
      } else {
        const newSessionId = data.id
        setSessionId(newSessionId)
        
        const { error: updateError } = await supabase
          .from('web_auth_sessions')
          .update({ status: 'verify_face_pending' })
          .eq('id', newSessionId)
        
        if (updateError) {
          console.error('Failed to update session status to verify_face_pending:', updateError)
        } else {
          setSessionStatus('verify_face_pending')
        }
      }
    }
    setLoading(false)
  }

  const cancelFaceVerify = async () => {
    if (!sessionId) return
    setLoading(true)
    const { error } = await supabase
      .from('web_auth_sessions')
      .update({ status: 'approved' })
      .eq('id', sessionId)
    if (error) {
      console.error(error)
    } else {
      setSessionStatus('approved')
    }
    setLoading(false)
  }

  const triggerAddEmail = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error("No logged-in user")
      setLoading(false)
      return
    }

    // 🛡️ Always check if recovery email already exists before triggering
    const { data: freshProfile } = await supabase
      .from('profiles')
      .select('recovery_email')
      .eq('id', user.id)
      .single()

    if (freshProfile?.recovery_email) {
      setProfile(prev => prev ? { ...prev, recovery_email: freshProfile.recovery_email } : { recovery_email: freshProfile.recovery_email })
      setLoading(false)
      return
    }

    if (sessionId) {
      const { error } = await supabase
        .from('web_auth_sessions')
        .update({ status: 'register_email_pending', user_id: user.id })
        .eq('id', sessionId)
      if (error) {
        console.error(error)
      } else {
        setSessionStatus('register_email_pending')
      }
    } else {
      const { data, error } = await supabase
        .from('web_auth_sessions')
        .insert({ status: 'pending', user_id: user.id })
        .select('id')
        .single()
      if (error) {
        console.error(error)
      } else {
        const newSessionId = data.id
        setSessionId(newSessionId)
        
        const { error: updateError } = await supabase
          .from('web_auth_sessions')
          .update({ status: 'register_email_pending' })
          .eq('id', newSessionId)
        
        if (updateError) {
          console.error(updateError)
        } else {
          setSessionStatus('register_email_pending')
        }
      }
    }
    setLoading(false)
  }

  const cancelAddEmail = async () => {
    if (!sessionId) return
    setLoading(true)
    const { error } = await supabase
      .from('web_auth_sessions')
      .update({ status: 'approved' })
      .eq('id', sessionId)
    if (error) {
      console.error(error)
    } else {
      setSessionStatus('approved')
    }
    setLoading(false)
  }


  // Step 3: Realtime and Polling user verification state
  useEffect(() => {
    if (step !== 3) {
      return
    }

    let activeUser: { id: string } | null = null

    async function checkVerification(userObj?: { id: string } | null) {
      const u = userObj || activeUser || (await supabase.auth.getUser()).data.user
      if (!u) return
      activeUser = u

      const [profileRes, devRes] = await Promise.all([
        supabase.from('profiles').select('is_validated, is_verified, recovery_email').eq('id', u.id).single(),
        supabase.from('boofer_developers').select('status, api_key').eq('user_id', u.id).single()
      ])

      const profileData = profileRes.data
      let devData = devRes.data

      if (profileData) setProfile(profileData)
      if (devData) setDeveloper(devData)

      // If profile is verified and has recovery email, but developer row does not exist or is not active,
      // automatically register the developer via RPC here!
      if (profileData?.is_verified && profileData?.recovery_email && (!devData || devData.status !== 'active')) {
        console.log('User is verified with email but not registered as developer, registering...')
        const { data: newDev, error: registerError } = await supabase.rpc('register_developer', { p_user_id: u.id })
        if (registerError) {
          console.error('Failed to register developer via RPC:', registerError)
        } else if (newDev) {
          const devRow = Array.isArray(newDev) ? newDev[0] : newDev
          if (devRow) {
            devData = devRow
            setDeveloper(devRow)
          }
        }
      }

      // If fully verified, automatically advance to Step 4
      if (profileData?.is_verified && devData?.status === 'active' && profileData?.recovery_email) {
        setStep(4)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let profileChannel: any = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let devChannel: any = null

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      activeUser = user

      await checkVerification(user)

      profileChannel = supabase
        .channel(`realtime-profile-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload: { new: Record<string, unknown> }) => {
            setProfile(payload.new)
            checkVerification(user)
          }
        )
        .subscribe()

      devChannel = supabase
        .channel(`realtime-dev-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'boofer_developers', filter: `user_id=eq.${user.id}` },
          (payload: { new: Record<string, unknown> }) => {
            setDeveloper(payload.new)
            checkVerification(user)
          }
        )
        .subscribe()
    }

    setupRealtime()

    // Fallback polling (every 5 seconds) to handle any lost connection
    const interval = setInterval(() => {
      checkVerification()
    }, 5000)

    return () => {
      clearInterval(interval)
      if (profileChannel) supabase.removeChannel(profileChannel)
      if (devChannel) supabase.removeChannel(devChannel)
    }
  }, [step])

  // Helper: Copy API key to clipboard
  const copyToClipboard = () => {
    if (!developer?.api_key) return
    navigator.clipboard.writeText(developer.api_key as string)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Helper: Download API key as file
  const downloadKey = (format: 'txt' | 'md') => {
    if (!developer?.api_key) return
    const key = developer.api_key as string
    const filename = `boofer_api_key.${format}`
    const content = format === 'txt'
      ? `BOOFER DEVELOPER KEY: ${key}\nGenerated on: ${new Date().toLocaleDateString()}`
      : `# Boofer API Key\n\n- **Key**: \`${key}\`\n- **Generated**: ${new Date().toLocaleDateString()}`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }



  // Survey handlers
  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    )
  }

  const handleSurveySubmit = async (skip = false) => {
    setLoading(true)
    if (sessionId) {
      const surveyData = skip ? { skipped: true } : { genres: selectedGenres, intent: developerIntent }
      await supabase
        .from('web_auth_sessions')
        .update({ survey_data: surveyData })
        .eq('id', sessionId)
    }
    setLoading(false)
    setStep(3)
  }

  return (
    <div className="fancy-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div className="fancy-glow" />
      <PublicNavbar />

      <div className="container-base" style={{ marginTop: '100px', marginBottom: '60px', flex: 1, display: 'flex', gap: '40px', position: 'relative', zIndex: 10 }}>
        
        {/* LEFT SIDEBAR: Indicators */}
        <aside style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-color)' }}>Onboarding Checklist</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Complete these steps to unlock the console</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { id: 1, label: '1. Authentication', desc: 'Scan QR with Boofer App' },
              { id: 2, label: '2. Profile Survey', desc: 'Game genres & intent' },
              { id: 3, label: '3. Verification', desc: 'Identity & verification status' },
              { id: 4, label: '4. SDK & API Key', desc: 'Download SDK & API Key' }
            ].map(s => {
              const isActive = step === s.id
              const isCompleted = step > s.id
              return (
                <div 
                  key={s.id} 
                  style={{ 
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    opacity: isActive || isCompleted ? 1 : 0.4,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <div style={{
                    width: '20px', height: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isCompleted ? '#22c55e' : isActive ? 'var(--text-color)' : 'transparent',
                    border: isCompleted ? 'none' : '1px solid var(--border-color)',
                    color: isCompleted ? '#fff' : isActive ? 'var(--bg-color)' : 'var(--text-muted)',
                    fontSize: '11px', fontWeight: 700
                  }}>
                    {isCompleted ? <Check size={12} strokeWidth={3} /> : s.id}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: isActive ? 600 : 500, color: 'var(--text-color)' }}>{s.label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* MAIN PANEL & RIGHT-SIDE STATUS */}
        <main style={{ flex: 1, display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
          
          {/* Main Onboarding Wizard Card */}
          <div style={{
            flex: 1,
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            padding: '40px',
            minHeight: '440px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}>

            {/* STEP 1: AUTHENTICATION */}
            {step === 1 && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-color)', marginBottom: '8px' }}>
                  Step 1: Authenticate with Boofer App
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px', lineHeight: 1.6 }}>
                  Scan the QR code below using the Boofer mobile app scanner to verify your credentials and log in automatically.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                  {sessionId ? (
                    <div style={{ background: '#fff', padding: '16px', border: '1px solid var(--border-color)' }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('boofer://auth?session_id=' + sessionId)}`}
                        alt="Onboarding QR Code"
                        style={{ display: 'block', width: '180px', height: '180px' }}
                      />
                    </div>
                  ) : (
                    <div style={{ width: '180px', height: '180px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="animate-pulse" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Generating QR...</span>
                    </div>
                  )}

                  {sessionApproved ? (
                    <p style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600 }} className="animate-pulse">
                      ✓ Approval Received! Access granted...
                    </p>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Waiting for approval from mobile app...
                    </p>
                  )}
                  {/* Fallback Intent link removed to enforce QR scanning */}
                </div>
              </div>
            )}

            {/* STEP 2: PROFILE SURVEY */}
            {step === 2 && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-color)', marginBottom: '8px' }}>
                  Step 2: Tell us about your projects
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
                  Select the game genres you specialize in and your developer classification. This helps us customize your console experience.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-color)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                      Game Genres (Select all that apply)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {GENRES.map(g => {
                        const selected = selectedGenres.includes(g)
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handleGenreToggle(g)}
                            style={{
                              background: selected ? 'var(--text-color)' : 'transparent',
                              color: selected ? 'var(--bg-color)' : 'var(--text-color)',
                              border: '1px solid var(--border-color)',
                              padding: '8px 12px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              textAlign: 'center',
                              fontWeight: 500,
                              transition: 'all 0.15s'
                            }}
                          >
                            {g}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-color)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                      Developer Intent
                    </label>
                    <select
                      value={developerIntent}
                      onChange={e => setDeveloperIntent(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-color)',
                        padding: '10px 12px',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      <option value="">Select intent...</option>
                      <option value="hobbyist">Hobbyist / Personal Developer</option>
                      <option value="indie">Independent Studio</option>
                      <option value="studio">Professional / Publisher</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
                  <button
                    onClick={() => handleSurveySubmit(false)}
                    disabled={loading}
                    style={{
                      background: 'var(--button-bg)',
                      color: 'var(--button-text)',
                      border: 'none',
                      padding: '10px 20px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Next Step
                  </button>
                  <button
                    onClick={() => handleSurveySubmit(true)}
                    disabled={loading}
                    style={{
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                      padding: '10px 20px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Skip Survey
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DEVELOPER VERIFICATION */}
            {step === 3 && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-color)', marginBottom: '8px' }}>
                  Step 3: Developer Verification Status
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
                  Boofer requires active face verification and registration checking to prevent misuse and maintain publishing quality.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>Validated Profile Check</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email or phone validation confirmation</p>
                    </div>
                    <span style={{ fontSize: '12px', color: profile?.is_validated ? '#22c55e' : '#f87171', fontWeight: 600 }}>
                      {profile?.is_validated ? 'PASSED' : 'PENDING'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>Identity Verification Check</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Biometric Face ID status in Boofer App</p>
                    </div>
                    {profile?.is_verified ? (
                      <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>PASSED</span>
                    ) : sessionStatus === 'verify_face_pending' ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Requested...</span>
                        <button
                          onClick={cancelFaceVerify}
                          style={{
                            background: 'transparent',
                            color: '#f87171',
                            border: '1px solid #f87171',
                            padding: '4px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={triggerFaceVerify}
                        disabled={loading}
                        style={{
                          background: 'var(--button-bg)',
                          color: 'var(--button-text)',
                          border: 'none',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'opacity 0.2s'
                        }}
                      >
                        Verify Face
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>Developer Email Address</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                        {profile?.recovery_email 
                          ? ((typeof profile.recovery_email === 'string' && profile.recovery_email.startsWith('{')) || (typeof profile.recovery_email === 'object')
                            ? 'Encrypted (Secured with your PIN)' 
                            : String(profile.recovery_email))
                          : 'Set your recovery email in the Boofer app to complete onboarding'}
                      </p>
                    </div>
                    {profile?.recovery_email ? (
                      <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>REGISTERED</span>
                    ) : sessionStatus === 'register_email_pending' ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Requested...</span>
                        <button
                          onClick={cancelAddEmail}
                          style={{
                            background: 'transparent',
                            color: '#f87171',
                            border: '1px solid #f87171',
                            padding: '4px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={triggerAddEmail}
                        disabled={loading}
                        style={{
                          background: 'var(--button-bg)',
                          color: 'var(--button-text)',
                          border: 'none',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'opacity 0.2s'
                        }}
                      >
                        Add Email
                      </button>
                    )}
                  </div>
                </div>

                {!profile?.recovery_email && sessionStatus === 'register_email_pending' && (
                  <div style={{ marginTop: '24px', padding: '16px', border: '1px solid #1e3a8a', background: 'rgba(30,58,138,0.1)' }}>
                    <p style={{ fontSize: '13px', color: '#60a5fa', fontWeight: 500 }}>
                      ✓ Email registration requested. Please open the Boofer app on your phone and approve the prompt to enter your email.
                    </p>
                  </div>
                )}

                {!profile?.is_verified && sessionStatus === 'verify_face_pending' && (
                  <div style={{ marginTop: '24px', padding: '16px', border: '1px solid #1e3a8a', background: 'rgba(30,58,138,0.1)' }}>
                    <p style={{ fontSize: '13px', color: '#60a5fa', fontWeight: 500 }}>
                      ✓ Face ID check requested. Please open the Boofer app on your phone and approve the prompt to verify.
                    </p>
                  </div>
                )}

                {!profile?.is_verified && sessionStatus !== 'verify_face_pending' && (
                  <div style={{ marginTop: '24px', padding: '16px', border: '1px solid #450a0a', background: 'rgba(127,29,29,0.1)' }}>
                    <p style={{ fontSize: '13px', color: '#f87171', fontWeight: 500 }}>
                      {'Face ID check not completed. Please click "Verify Face" above to initiate the check on your phone.'}
                    </p>
                  </div>
                )}

                {!!profile?.is_verified && !profile?.recovery_email && (
                  <p style={{ fontSize: '12px', color: '#f87171', marginTop: '16px', fontWeight: 500 }}>
                    Identity verified. Please register your recovery email inside the Boofer app to finish onboarding.
                  </p>
                )}

                {!!profile?.is_verified && developer?.status !== 'active' && !!profile?.recovery_email && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>
                    Identity verified. Activating developer profile...
                  </p>
                )}
              </div>
            )}

            {/* STEP 4: SDK & API KEY */}
            {step === 4 && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e', marginBottom: '8px' }}>
                  ✓ Onboarding Complete! Welcome Developer
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
                  You are registered as an active Boofer Developer. Below is your developer key and instructions to begin building.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* API Key Box */}
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-color)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                      Your Developer API Key
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={(developer?.api_key as string) || 'Loading API Key...'}
                        readOnly
                        style={{
                          flex: 1,
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-color)',
                          fontSize: '13px',
                          padding: '10px 12px',
                          outline: 'none',
                          fontFamily: 'var(--font-geist-mono), monospace'
                        }}
                      />
                      <button
                        onClick={copyToClipboard}
                        style={{
                          background: 'var(--button-bg)',
                          color: 'var(--button-text)',
                          border: 'none',
                          padding: '10px 16px',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        {copied ? 'Copied!' : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => downloadKey('txt')}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        color: 'var(--text-color)',
                        border: '1px solid var(--border-color)',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Download size={12} /> Download Key (.txt)
                    </button>
                    <button
                      onClick={() => downloadKey('md')}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        color: 'var(--text-color)',
                        border: '1px solid var(--border-color)',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Download size={12} /> Download Key (.md)
                    </button>
                  </div>

                  {/* SDK Downloader Card */}
                  <div style={{
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginTop: '10px'
                  }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>Boofer HTML5 SDK</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Get the latest bridge controller package</p>
                    </div>
                    <a
                      href="/downloads/boofer-sdk.js"
                      download
                      style={{
                        background: 'var(--button-bg)',
                        color: 'var(--button-text)',
                        fontSize: '12px',
                        fontWeight: 500,
                        padding: '8px 16px',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Download size={12} /> Download SDK
                    </a>
                  </div>
                </div>

                <div style={{ marginTop: '40px' }}>
                  <button
                    onClick={() => router.push('/dashboard')}
                    style={{
                      background: 'var(--button-bg)',
                      color: 'var(--button-text)',
                      border: 'none',
                      padding: '12px 24px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    Go to Console Dashboard <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT SIDE PANEL: Real-time status / errors */}
          <div style={{
            width: '280px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              System Status
            </h4>

            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Lock size={14} className="text-yellow-500" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-color)' }}>SSO Removed</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Login is entirely handled securely by scanning the QR code.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <QrCode size={14} className="text-blue-500" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-color)' }}>App Handshake</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>The app signs in and pushes tokens to Supabase Realtime.</p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertCircle size={14} className="text-neutral-500" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-color)' }}>Survey is Optional</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>You can skip this setup profile step and configure it later in Settings.</p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {!profile?.is_verified ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#f87171' }}>Verification Required</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Trigger the verification intent, launch the Boofer app, and complete Face ID verification.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <UserCheck size={14} style={{ color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#22c55e' }}>Identity Verified</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verification passes successfully. Proceeding to finalize credentials.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <UserCheck size={14} style={{ color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-color)' }}>Fully Activated</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>You can now embed the SDK in your games and upload them from your dashboard.</p>
                </div>
              </div>
            )}

            <div style={{ marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Need assistance? Read our <Link href="/docs" style={{ color: 'var(--text-color)', textDecoration: 'underline' }}>integration guides</Link> or contact support.
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
