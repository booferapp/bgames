'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'
import { getError, BooferErrorCode } from '@/lib/errors'
import { BannerUpload } from '@/components/dashboard/BannerUpload'

const CATEGORIES = ['Puzzle', 'Action', 'Arcade', 'Adventure', 'Sports', 'Strategy', 'Casual', 'Other']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function UploadGamePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Developer Profile state
  const [developer, setDeveloper] = useState<{ id: string; api_key: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // HTML Validation state
  interface ValidationLog {
    step: string
    status: 'pending' | 'running' | 'success' | 'failed' | 'violation'
    message: string
  }
  const [validating, setValidating] = useState(false)
  const [validationLogs, setValidationLogs] = useState<ValidationLog[]>([])
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error' | 'violation'>('idle')
  const [validationError, setValidationError] = useState<string | null>(null)

  // Fetch current developer details on mount
  useEffect(() => {
    async function loadDeveloper() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          const { data: dev } = await supabase
            .from('boofer_developers')
            .select('id, api_key')
            .eq('user_id', user.id)
            .single()
          setDeveloper(dev)
        }
      } catch (err) {
        console.error('Failed to load developer profile:', err)
      }
    }
    loadDeveloper()
  }, [])

  const validateHtmlFile = async (f: File, devKey: string) => {
    setValidating(true)
    setValidationStatus('idle')
    setValidationError(null)

    const logs: ValidationLog[] = [
      { step: 'file_read', status: 'running', message: 'Reading HTML file structure...' },
      { step: 'api_key', status: 'pending', message: 'Checking Developer API Key...' },
      { step: 'sdk_integration', status: 'pending', message: 'Verifying Boofer SDK integration...' },
      { step: 'sdk_integrity', status: 'pending', message: 'Verifying SDK code integrity...' },
    ]
    setValidationLogs([...logs])

    const updateLog = (step: string, status: 'success' | 'failed' | 'violation', message: string) => {
      setValidationLogs(prev => prev.map(l => l.step === step ? { ...l, status, message } : l))
    }

    try {
      // 1. Read file
      const text = await f.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/html')
      updateLog('file_read', 'success', 'HTML file read successfully.')

      // 2. Check API Key
      setValidationLogs(prev => prev.map(l => l.step === 'api_key' ? { ...l, status: 'running' } : l))
      const meta = doc.querySelector('meta[name="boofer-api-key"]')
      const extractedKey = meta ? meta.getAttribute('content')?.trim() : null

      if (!extractedKey) {
        updateLog('api_key', 'failed', 'Missing API key. Add <meta name="boofer-api-key" content="..."> to the head.')
        throw new Error('API Key is missing from the HTML.')
      }

      if (extractedKey !== devKey) {
        updateLog('api_key', 'failed', 'Invalid API Key. The key does not match your developer account key.')
        throw new Error('API Key mismatch. Make sure you use your correct developer API Key.')
      }
      updateLog('api_key', 'success', 'Developer API Key matches your account.')

      // 3. Check Boofer SDK Integration (and Inline Block)
      setValidationLogs(prev => prev.map(l => l.step === 'sdk_integration' ? { ...l, status: 'running' } : l))
      const scripts = Array.from(doc.querySelectorAll('script'))

      // 3a. Check for inline SDK code
      const inlineSdkKeywords = ['_booferResolve', 'AndroidBridge', 'window.Boofer =', 'window.webkit.messageHandlers.AndroidBridge']
      for (const script of scripts) {
        const src = script.getAttribute('src')
        if (!src) {
          const content = script.textContent || ''
          const foundKeyword = inlineSdkKeywords.find(keyword => content.includes(keyword))
          if (foundKeyword) {
            updateLog('sdk_integration', 'violation', 'Security Violation: Inlined Boofer SDK detected. Direct SDK injection is forbidden.')
            setValidationStatus('violation')
            setValidationError('Inline Boofer SDK detected. You must link the SDK as an external reference and not paste its code inside.')
            return
          }
        }
      }

      // 3b. Find external script for boofer-sdk.js
      const sdkScript = scripts.find(s => {
        const src = s.getAttribute('src')
        return src && src.includes('boofer-sdk.js')
      })

      if (!sdkScript) {
        updateLog('sdk_integration', 'failed', 'Missing Boofer SDK script. Include <script src="boofer-sdk.js"></script>.')
        throw new Error('Boofer SDK script not found.')
      }

      updateLog('sdk_integration', 'success', 'Boofer SDK script integration found.')

      // 4. Check SDK Integrity
      setValidationLogs(prev => prev.map(l => l.step === 'sdk_integrity' ? { ...l, status: 'running' } : l))
      const sdkSrc = sdkScript.getAttribute('src')!

      if (sdkSrc.startsWith('http://') || sdkSrc.startsWith('https://')) {
        try {
          const res = await fetch(sdkSrc)
          if (!res.ok) throw new Error('Network response not ok')
          const remoteContent = await res.text()

          // Fetch official SDK
          const officialRes = await fetch('/downloads/boofer-sdk.js')
          if (!officialRes.ok) throw new Error('Could not load official SDK for comparison')
          const officialContent = await officialRes.text()

          // Normalize line endings to avoid CRLF (\r\n) vs LF (\n) differences on Windows
          const normalize = (str: string) => str.replace(/\r\n/g, '\n').trim()

          if (normalize(remoteContent) !== normalize(officialContent)) {
            updateLog('sdk_integrity', 'violation', 'Security Violation: Modified Boofer SDK code detected.')
            setValidationStatus('violation')
            setValidationError('Critical Integrity Failure: The referenced external SDK has been altered or tampered with. Modifying the SDK is a violation of developer terms.')
            return
          }
          updateLog('sdk_integrity', 'success', 'Remote SDK integrity verified successfully.')
        } catch (err) {
          updateLog('sdk_integrity', 'failed', 'Integrity check blocked. Use relative source <script src="boofer-sdk.js"></script>.')
          throw new Error('Failed to verify SDK integrity over CORS/Network. Please use relative reference.')
        }
      } else {
        updateLog('sdk_integrity', 'success', 'SDK references internal unmodified platform source.')
      }

      setValidationStatus('success')
    } catch (err: unknown) {
      setValidationStatus('error')
      setValidationError((err as Error).message || 'Validation failed.')
    } finally {
      setValidating(false)
    }
  }

  // Trigger verification when file or developer state updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let active = true
    const run = async () => {
      await Promise.resolve()
      if (!active) return
      if (file && developer?.api_key) {
        validateHtmlFile(file, developer.api_key)
      } else if (!file) {
        setValidationLogs([])
        setValidationStatus('idle')
        setValidationError(null)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [file, developer])

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith('.html') && f.type !== 'text/html') {
      setErrors(e => ({ ...e, file: getError('GAME_FILE_INVALID_TYPE').message }))
      return
    }
    if (f.size > MAX_FILE_SIZE) {
      setErrors(e => ({ ...e, file: getError('GAME_FILE_TOO_LARGE').message }))
      return
    }
    setErrors(e => ({ ...e, file: '' }))
    setFile(f)
    
    // Create preview URL for iframe
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
  }, [])

  const clearFile = () => {
    setFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setValidationLogs([])
    setValidationStatus('idle')
    setValidationError(null)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  // Keywords handlers
  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim().toLowerCase()
    if (trimmed && !keywords.includes(trimmed) && keywords.length < 10) {
      setKeywords([...keywords, trimmed])
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword))
  }

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addKeyword(keywordInput)
    } else if (e.key === 'Backspace' && keywordInput === '' && keywords.length > 0) {
      setKeywords(keywords.slice(0, -1))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!title.trim()) newErrors.title = getError('GAME_TITLE_REQUIRED').message
    if (!file) {
      newErrors.file = 'Please upload a game HTML file.'
    } else if (validationStatus !== 'success') {
      newErrors.file = validationStatus === 'violation'
        ? 'Upload blocked due to security policy violations.'
        : (validationError || 'HTML verification must pass before submission.')
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    setErrors({})

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('BOOFER_UNAUTHENTICATED')

      // Get developer ID
      const { data: dev } = await supabase
        .from('boofer_developers')
        .select('id, api_key')
        .eq('user_id', user.id)
        .single()

      if (!dev) throw new Error('BOOFER_NOT_DEVELOPER')

      // Upload HTML file to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${file!.name.replace(/[^a-z0-9.\-_]/gi, '_')}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('game-uploads')
        .upload(fileName, file!, { contentType: 'text/html', upsert: false })

      if (uploadError) throw new Error('UPLOAD_FAILED')

      const { data: { publicUrl } } = supabase.storage
        .from('game-uploads')
        .getPublicUrl(uploadData.path)

      // Insert game record
      await supabase.from('cloud_games').insert({
        title: title.trim(),
        description: description.trim() || null,
        game_url: publicUrl,
        thumbnail_url: thumbnailUrl.trim() || null,
        developer_id: dev.id,
        status: 'pending',
        api_key: dev.api_key,
        sdk_verified: false,
        category: category || null,
      })

      setSuccess(true)
      setTimeout(() => router.push('/dashboard/games'), 1500)
    } catch (err: unknown) {
      const code = (err instanceof Error ? err.message : 'UNKNOWN') as BooferErrorCode
      const booferError = getError(code)
      setErrors({ submit: `${booferError.message} — ${booferError.hint}` })
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <CheckCircle size={40} className="text-green-500 mb-4" />
        <h2 className="text-lg font-bold text-white mb-1">Game submitted!</h2>
        <p className="text-sm text-neutral-500">Your game is now in review. Redirecting…</p>
      </div>
    )
  }

  return (
    <div className="flex gap-6 max-w-7xl">
      {/* Left side - Form */}
      <div className="flex-1 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight">Upload Game</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Submit an HTML5 game for review on the Boofer platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Game File</CardTitle>
          </CardHeader>
          <CardContent>
            {file ? (
              <div className="flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-800">
                <FileText size={18} className="text-neutral-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className="text-xs text-neutral-600">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="text-neutral-600 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-neutral-500 bg-neutral-900/50' : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <Upload size={20} className="mx-auto text-neutral-600 mb-2" />
                <p className="text-sm text-neutral-400">Drop your <span className="text-white">.html</span> file here</p>
                <p className="text-xs text-neutral-700 mt-1">or click to browse — max 10 MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,text/html"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {errors.file && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle size={11} /> {errors.file}
              </p>
            )}

            {/* Terminal logs component */}
            {(validating || validationLogs.length > 0) && (
              <div className="mt-4 bg-black border border-neutral-900 rounded-none p-4 font-mono text-xs text-neutral-400">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2 mb-3">
                  <span className="text-white font-bold tracking-wider">BOOFER INTEGRITY CHECKER v1.0.0</span>
                  <span className="text-neutral-600">CHECKING INTEGRITY...</span>
                </div>
                
                <div className="flex flex-col gap-2">
                  {validationLogs.map((log) => {
                    let statusColor = 'text-neutral-600'
                    let statusLabel = '[PENDING]'
                    
                    if (log.status === 'running') {
                      statusColor = 'text-blue-400 animate-pulse'
                      statusLabel = '[ RUNNING ]'
                    } else if (log.status === 'success') {
                      statusColor = 'text-green-500'
                      statusLabel = '[   OK   ]'
                    } else if (log.status === 'failed') {
                      statusColor = 'text-red-500'
                      statusLabel = '[ FAILED ]'
                    } else if (log.status === 'violation') {
                      statusColor = 'text-red-600 font-extrabold animate-pulse'
                      statusLabel = '[VIOLATION]'
                    }
                    
                    return (
                      <div key={log.step} className="flex items-start gap-2.5">
                        <span className={statusColor}>{statusLabel}</span>
                        <span className="text-neutral-300">{log.message}</span>
                      </div>
                    )
                  })}
                </div>
                
                {/* Loader during validation */}
                {validating && (
                  <div className="mt-3 flex items-center gap-2 text-blue-400">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-none animate-ping" />
                    <span>Analyzing file structure...</span>
                  </div>
                )}
                
                {/* Result Message */}
                {!validating && validationStatus === 'success' && (
                  <div className="mt-4 p-2 bg-green-950/20 border border-green-900 text-green-500 font-sans text-sm rounded-none">
                    ✓ Code analysis complete. All checks passed. Game is ready for submission.
                  </div>
                )}

                {!validating && validationStatus === 'error' && (
                  <div className="mt-4 p-2 bg-red-950/20 border border-red-900 text-red-500 font-sans text-sm rounded-none flex items-center justify-between gap-3">
                    <span className="flex-1">✗ Validation Failed: {validationError}</span>
                    <button
                      type="button"
                      onClick={() => developer?.api_key && validateHtmlFile(file!, developer.api_key)}
                      className="px-2.5 py-1 bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-200 text-xs font-sans tracking-wide cursor-pointer transition-colors rounded-none whitespace-nowrap"
                    >
                      Retry Check
                    </button>
                  </div>
                )}

                {!validating && validationStatus === 'violation' && (
                  <div className="mt-4 p-3 bg-red-950/40 border border-red-900 text-red-500 font-sans text-sm flex flex-col gap-2 rounded-none">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                        ⚠️ Critical Security Policy Violation
                      </p>
                      <button
                        type="button"
                        onClick={() => developer?.api_key && validateHtmlFile(file!, developer.api_key)}
                        className="px-2.5 py-1 bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-200 text-xs font-sans tracking-wide cursor-pointer transition-colors rounded-none whitespace-nowrap"
                      >
                        Retry Check
                      </button>
                    </div>
                    <p>{validationError}</p>
                    <div className="bg-red-950/60 p-2.5 border border-red-900/60 text-xs text-red-400 leading-normal rounded-none">
                      <strong>WARNING:</strong> Attempting to upload altered or tampered versions of the Boofer SDK or bypassing security protocols constitutes a direct breach of the Developer License Agreement and will result in a <strong>permanent ban of your developer account</strong>.
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-neutral-700 mt-3">
              Your game must include <code className="text-neutral-500">{"<meta name=\"boofer-api-key\" content=\"YOUR_KEY\">"}</code> in the HTML head.
            </p>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Game Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              label="Title *"
              placeholder="My Awesome Game"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              maxLength={80}
            />
            <Textarea
              label="Description"
              placeholder="A short description of your game..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-neutral-600"
              >
                <option value="">Select a category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <BannerUpload
              value={thumbnailUrl}
              onChange={setThumbnailUrl}
              userId={userId ?? ''}
              error={errors.thumbnail}
            />
            
            {/* Keywords Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Keywords (max 10)
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-950 border border-neutral-800 focus-within:border-neutral-600">
                {keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-800 text-white text-xs"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="text-neutral-500 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  onBlur={() => addKeyword(keywordInput)}
                  placeholder={keywords.length === 0 ? "Type and press Enter or comma..." : ""}
                  disabled={keywords.length >= 10}
                  className="flex-1 min-w-[150px] bg-transparent text-white text-sm outline-none placeholder:text-neutral-700"
                />
              </div>
              <p className="text-xs text-neutral-700">
                Press <kbd className="px-1 py-0.5 bg-neutral-900 border border-neutral-800">Enter</kbd> or <kbd className="px-1 py-0.5 bg-neutral-900 border border-neutral-800">,</kbd> to add keywords
              </p>
            </div>
          </CardContent>
        </Card>

        {errors.submit && (
          <div className="border border-red-900 bg-red-950/30 px-4 py-3">
            <p className="text-sm text-red-400 flex items-center gap-2">
              <AlertCircle size={13} /> {errors.submit}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={submitting} disabled={validationStatus !== 'success' || submitting}>
            Submit for Review
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
      </div>

      {/* Right side - Mobile Preview */}
      <div className="sticky top-6 h-fit">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-white tracking-tight">Mobile Preview</h2>
          <p className="text-xs text-neutral-600 mt-0.5">How your game will appear in the app</p>
        </div>

        {/* Mobile Frame */}
        <div className="relative w-[280px] h-[560px] bg-neutral-900 border-4 border-neutral-800 rounded-[32px] shadow-2xl overflow-hidden">
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-between px-4">
            <span className="text-[10px] text-white font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2.5 border border-white/40 rounded-sm relative">
                <div className="absolute inset-0.5 bg-white rounded-[1px]" style={{ width: '80%' }} />
              </div>
            </div>
          </div>

          {/* Game Header */}
          <div className="absolute top-8 left-0 right-0 bg-black/80 backdrop-blur-sm z-10 p-3 border-b border-neutral-800">
            <div className="flex items-start gap-2">
              {thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnailUrl} alt="Banner" className="w-12 h-12 object-cover rounded" />
              ) : (
                <div className="w-12 h-12 bg-neutral-800 rounded flex items-center justify-center">
                  <FileText size={20} className="text-neutral-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate">
                  {title || 'Your Game Title'}
                </h3>
                <p className="text-[10px] text-neutral-500 truncate">
                  {category || 'Category'}
                </p>
                {keywords.length > 0 && (
                  <div className="flex gap-1 mt-1 overflow-hidden">
                    {keywords.slice(0, 3).map(kw => (
                      <span key={kw} className="text-[9px] px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Game Content */}
          <div className="absolute top-[120px] left-0 right-0 bottom-0 bg-black">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Game preview"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center px-6">
                <Upload size={32} className="text-neutral-700 mb-3" />
                <p className="text-xs text-neutral-600">Upload a game file to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
