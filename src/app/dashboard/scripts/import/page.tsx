'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Theme } from '@/lib/types'
import LoadingEVE from '@/components/LoadingEVE'

type Tab = 'single' | 'bulk' | 'client'

type BulkResult = { title: string; ok: boolean; error?: string }

export default function ImportScriptPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('single')
  const router = useRouter()
  const supabase = createClient()

  async function loadThemes() {
    const { data: t } = await supabase.from('themes').select('*').order('client_name')
    setThemes(t || [])
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      await loadThemes()
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Shell><LoadingEVE /></Shell>

  return (
    <Shell>
      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {([
          { key: 'single', label: 'Single Script' },
          { key: 'bulk',   label: 'Bulk Import' },
          { key: 'client', label: 'Import Client' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tab === t.key ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'single' && <SingleImport themes={themes} />}
      {tab === 'bulk'   && <BulkImport themes={themes} />}
      {tab === 'client' && <ClientImport onClientAdded={loadThemes} />}
    </Shell>
  )
}

// ─── Single Import ────────────────────────────────────────────────────────────

function SingleImport({ themes }: { themes: Theme[] }) {
  const router = useRouter()
  const [themeId, setThemeId] = useState('')
  const [title, setTitle] = useState('')
  const [rawText, setRawText] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [analysisNotes, setAnalysisNotes] = useState('')
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePDFUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { setError('Please upload a PDF file'); return }
    setError('')
    setImporting(true)
    try {
      const pdfjsLib = (window as any).pdfjsLib
      if (!pdfjsLib) { setError('PDF reader not loaded yet — try again in a moment'); setImporting(false); return }
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n'
      }
      if (fullText.trim().length < 10) { setError('Could not extract text — please paste manually.'); setImporting(false); return }
      setRawText(fullText.trim())
    } catch {
      setError('Failed to read PDF — please paste the script text manually.')
    } finally {
      setImporting(false)
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!rawText.trim()) { setError('Please paste or upload your script first'); return }
    setImporting(true)
    setError('')
    const res = await fetch('/api/scripts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText, theme_id: themeId || null, title: title || null }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Import failed'); setImporting(false); return }
    setAnalysisNotes(data.analysis_notes || '')
    setSuccess(true)
    setImporting(false)
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full bg-emerald-900/30 border border-emerald-700 flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
        <h2 className="text-2xl font-bold mb-3">Script imported</h2>
        <p className="text-zinc-500 text-sm mb-4">VIBE analyzed your script and saved it to your library.</p>
        {analysisNotes && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left mb-6">
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">VIBE Analysis</p>
            <p className="text-zinc-300 text-sm leading-relaxed">{analysisNotes}</p>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/dashboard/scripts')} className="bg-violet-600 hover:bg-violet-500 transition text-white font-semibold px-5 py-2.5 rounded-lg text-sm">View all scripts</button>
          <button onClick={() => { setSuccess(false); setRawText(''); setTitle(''); setThemeId(''); setAnalysisNotes('') }} className="border border-zinc-700 hover:border-zinc-500 transition text-zinc-400 hover:text-white font-semibold px-5 py-2.5 rounded-lg text-sm">Import another</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Import a Script</h1>
        <p className="text-zinc-500 text-sm">Paste or upload your script — VIBE will analyze it, structure it, and score its viral potential.</p>
      </div>
      <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl px-5 py-4 mb-8">
        <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">Heads up</p>
        <p className="text-amber-200/80 text-sm leading-relaxed">Imported scripts may not be formatted exactly the way VIBE formats them. Use <strong>Enhance with VIBE</strong> (1 token) after importing to optimize for best results.</p>
      </div>
      <form onSubmit={handleImport} className="space-y-6">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Script title <span className="text-zinc-600">(optional)</span></label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Why buyers lowball in this market" className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition" />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Client <span className="text-zinc-600">(optional)</span></label>
          <select value={themeId} onChange={e => setThemeId(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition">
            <option value="">— No client selected —</option>
            {themes.map(t => <option key={t.id} value={t.id}>{t.client_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Upload PDF <span className="text-zinc-600">(or paste text below)</span></label>
          <div className="border-2 border-dashed border-zinc-800 hover:border-violet-600 transition rounded-xl p-8 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <p className="text-zinc-500 text-sm mb-1">Click to upload a PDF</p>
            <p className="text-zinc-700 text-xs">Script text will be extracted automatically</p>
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePDFUpload} />
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Script text</label>
          <textarea value={rawText} onChange={e => setRawText(e.target.value)} placeholder="Paste your script here — hook, body, CTA, all of it. VIBE will structure it for you..." rows={12} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition resize-none font-mono" />
          <p className="text-zinc-600 text-xs mt-1">{rawText.length} characters</p>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={importing || !rawText.trim()} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition text-white font-bold py-4 rounded-xl text-base">
          {importing ? 'VIBE is analyzing your script...' : 'Import & Analyze'}
        </button>
        <p className="text-center text-zinc-600 text-xs">Importing is free · Enhancement costs 1 VIBE token</p>
      </form>
    </div>
  )
}

// ─── Bulk Import ──────────────────────────────────────────────────────────────

function BulkImport({ themes }: { themes: Theme[] }) {
  const router = useRouter()
  const [themeId, setThemeId] = useState('')
  const [rawText, setRawText] = useState('')
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [results, setResults] = useState<BulkResult[] | null>(null)
  const [error, setError] = useState('')

  const scripts = rawText.trim()
    ? rawText.split(/\n---\n/).map(s => s.trim()).filter(s => s.length > 10)
    : []

  const clientName = themes.find(t => t.id === themeId)?.client_name ?? ''

  async function handleBulkImport() {
    if (!themeId) { setError('Please select a client first'); return }
    if (scripts.length === 0) { setError('No scripts found — paste your scripts separated by --- on its own line'); return }

    setImporting(true)
    setError('')
    setProgress({ current: 0, total: scripts.length })
    const results: BulkResult[] = []

    for (let i = 0; i < scripts.length; i++) {
      setProgress({ current: i + 1, total: scripts.length })
      try {
        const res = await fetch('/api/scripts/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_text: scripts[i], theme_id: themeId, title: null }),
        })
        const data = await res.json()
        if (!res.ok) {
          results.push({ title: `Script ${i + 1}`, ok: false, error: data.error || 'Import failed' })
        } else {
          results.push({ title: data.script?.title || `Script ${i + 1}`, ok: true })
        }
      } catch {
        results.push({ title: `Script ${i + 1}`, ok: false, error: 'Network error' })
      }
    }

    setResults(results)
    setImporting(false)
    setProgress(null)
  }

  if (results) {
    const succeeded = results.filter(r => r.ok).length
    const failed = results.filter(r => !r.ok).length
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl ${failed === 0 ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-amber-900/30 border border-amber-700'}`}>
          {failed === 0 ? '✓' : '⚠'}
        </div>
        <h2 className="text-2xl font-bold text-center mb-1">
          {succeeded} of {results.length} scripts imported
        </h2>
        {clientName && <p className="text-zinc-500 text-sm text-center mb-6">for {clientName}</p>}

        <div className="space-y-2 mb-8">
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${r.ok ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-red-950/20 border-red-800/40 text-red-300'}`}>
              <span>{r.ok ? '✓' : '✗'}</span>
              <span className="flex-1 truncate">{r.title}</span>
              {r.error && <span className="text-xs text-red-400">{r.error}</span>}
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/dashboard/scripts')} className="bg-violet-600 hover:bg-violet-500 transition text-white font-semibold px-5 py-2.5 rounded-lg text-sm">View scripts</button>
          <button onClick={() => { setResults(null); setRawText(''); setThemeId('') }} className="border border-zinc-700 hover:border-zinc-500 transition text-zinc-400 hover:text-white font-semibold px-5 py-2.5 rounded-lg text-sm">Import more</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Bulk Import</h1>
        <p className="text-zinc-500 text-sm">Import all scripts for one client at once. Separate each script with <code className="bg-zinc-800 px-1 rounded text-violet-300">---</code> on its own line.</p>
      </div>

      <div className="space-y-6">
        {/* Client selector — required */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Client <span className="text-red-400">*</span></label>
          <select
            value={themeId}
            onChange={e => { setThemeId(e.target.value); setError('') }}
            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition"
          >
            <option value="">— Select a client —</option>
            {themes.map(t => <option key={t.id} value={t.id}>{t.client_name}</option>)}
          </select>
        </div>

        {/* Paste area */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-zinc-300">Scripts</label>
            {scripts.length > 0 && (
              <span className="text-xs text-violet-400 font-semibold">{scripts.length} script{scripts.length !== 1 ? 's' : ''} detected</span>
            )}
          </div>
          <textarea
            value={rawText}
            onChange={e => { setRawText(e.target.value); setError('') }}
            placeholder={`Paste script 1 here...\n\n---\n\nPaste script 2 here...\n\n---\n\nPaste script 3 here...`}
            rows={18}
            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition resize-none font-mono"
          />
          <p className="text-zinc-600 text-xs mt-1">Separate each script with <span className="text-zinc-400">---</span> on its own line between scripts</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Progress */}
        {importing && progress && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-300 font-medium">Importing scripts...</p>
              <p className="text-sm text-violet-400 font-semibold">{progress.current} / {progress.total}</p>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div
                className="bg-violet-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">VIBE is analyzing script {progress.current} of {progress.total}...</p>
          </div>
        )}

        <button
          onClick={handleBulkImport}
          disabled={importing || scripts.length === 0 || !themeId}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition text-white font-bold py-4 rounded-xl text-base"
        >
          {importing ? `Importing ${progress?.current ?? 0} of ${progress?.total ?? scripts.length}...` : `Import ${scripts.length > 0 ? scripts.length + ' ' : ''}Script${scripts.length !== 1 ? 's' : ''} for ${clientName || 'Client'}`}
        </button>

        <p className="text-center text-zinc-600 text-xs">Importing is free · Enhance each script with VIBE (1 token) after</p>
      </div>
    </div>
  )
}

// ─── Client Import ────────────────────────────────────────────────────────────

function ClientImport({ onClientAdded }: { onClientAdded: () => Promise<void> }) {
  const supabase = createClient()
  const [rawText, setRawText] = useState('')
  const [clientName, setClientName] = useState('')
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState<Record<string, any> | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleParse() {
    if (!rawText.trim()) { setError('Paste some client info first'); return }
    setParsing(true)
    setError('')
    try {
      const res = await fetch('/api/themes/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setParsed(data.fields)
      if (data.fields?.client_name) setClientName(data.fields.client_name)
    } catch {
      setError('Failed to parse — try again.')
    } finally {
      setParsing(false)
    }
  }

  async function handleSave() {
    if (!clientName.trim()) { setError('Client name is required'); return }
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setSaving(false); return }

    const fields = parsed ?? {}
    const payload = {
      user_id: user.id,
      client_name: clientName.trim(),
      industry: fields.industry || null,
      sub_niche: fields.sub_niche || null,
      platforms: fields.platforms?.length ? fields.platforms : null,
      videos_per_month: fields.videos_per_month || null,
      audience_age: fields.audience_age ? [fields.audience_age] : null,
      audience_gender: fields.audience_gender || null,
      audience_lifestyle: Array.isArray(fields.audience_lifestyle) ? fields.audience_lifestyle : fields.audience_lifestyle ? fields.audience_lifestyle.split(',').map((s: string) => s.trim()) : null,
      audience_wants: Array.isArray(fields.audience_wants) ? fields.audience_wants : fields.audience_wants ? fields.audience_wants.split(',').map((s: string) => s.trim()) : null,
      audience_knowledge: fields.audience_knowledge || null,
      content_personality: fields.content_personality?.length ? fields.content_personality : null,
      on_camera: fields.on_camera || null,
      speaking_style: fields.speaking_style || null,
      hook_styles: fields.hook_styles?.length ? fields.hook_styles : null,
      topics_never: Array.isArray(fields.topics_never) ? fields.topics_never : fields.topics_never ? fields.topics_never.split(',').map((s: string) => s.trim()) : null,
      content_goals: fields.content_goals?.length ? fields.content_goals : null,
      primary_cta: fields.primary_cta || null,
      signature_offer: fields.signature_offer || null,
      content_pillars: Array.isArray(fields.content_pillars) ? fields.content_pillars : fields.content_pillars ? fields.content_pillars.split(',').map((s: string) => s.trim()) : null,
      filming_location: fields.filming_location ? [fields.filming_location] : null,
      visual_vibe: fields.visual_vibe || null,
      audio_style: fields.audio_style || null,
      brand_differentiators: Array.isArray(fields.brand_differentiators) ? fields.brand_differentiators : fields.brand_differentiators ? fields.brand_differentiators.split(',').map((s: string) => s.trim()) : null,
      real_comments: fields.real_comments || null,
      common_misconception: fields.common_misconception || null,
    }

    const { error: err } = await supabase.from('themes').insert(payload)
    if (err) { setError(err.message); setSaving(false); return }

    await onClientAdded()
    setSuccess(true)
    setSaving(false)
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full bg-emerald-900/30 border border-emerald-700 flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
        <h2 className="text-2xl font-bold mb-3">Client added</h2>
        <p className="text-zinc-500 text-sm mb-8"><span className="text-white">{clientName}</span> is now available as a client across E.V.E. Studio.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSuccess(false); setRawText(''); setParsed(null); setClientName('') }} className="bg-violet-600 hover:bg-violet-500 transition text-white font-semibold px-5 py-2.5 rounded-lg text-sm">Add another client</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Import Client</h1>
        <p className="text-zinc-500 text-sm">Paste anything about the client — intake form responses, emails, notes — and VIBE will extract what it can to build their theme.</p>
      </div>

      {!parsed ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Client info</label>
            <textarea
              value={rawText}
              onChange={e => { setRawText(e.target.value); setError('') }}
              placeholder="Paste intake form answers, emails, notes, a bio — anything that describes this client and their content needs..."
              rows={14}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition resize-none"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleParse}
            disabled={parsing || !rawText.trim()}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition text-white font-bold py-4 rounded-xl text-base"
          >
            {parsing ? 'VIBE is reading this...' : 'Parse with VIBE'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-violet-950/30 border border-violet-800/40 rounded-xl px-5 py-4">
            <p className="text-violet-300 text-sm font-medium mb-1">VIBE extracted the following</p>
            <p className="text-zinc-400 text-sm">Review the client name and confirm. You can edit all fields later in the Themes section.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Client name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={clientName}
              onChange={e => { setClientName(e.target.value); setError('') }}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition"
              placeholder="Client name"
            />
          </div>

          {/* Preview extracted fields */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Extracted data</p>
            {[
              ['Industry', parsed.industry],
              ['Sub-niche', parsed.sub_niche],
              ['Platforms', Array.isArray(parsed.platforms) ? parsed.platforms.join(', ') : parsed.platforms],
              ['Audience age', parsed.audience_age],
              ['Audience gender', parsed.audience_gender],
              ['Content goals', Array.isArray(parsed.content_goals) ? parsed.content_goals.join(', ') : parsed.content_goals],
              ['Primary CTA', parsed.primary_cta],
              ['Signature offer', parsed.signature_offer],
              ['Speaking style', parsed.speaking_style],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label as string} className="flex gap-3 text-sm">
                <span className="text-zinc-500 shrink-0 w-36">{label}</span>
                <span className="text-zinc-200">{value as string}</span>
              </div>
            ))}
            {Object.values(parsed).filter(Boolean).length === 0 && (
              <p className="text-zinc-600 text-sm">No fields extracted — you can still save with just the client name and fill in details later.</p>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !clientName.trim()}
              className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition text-white font-bold py-4 rounded-xl text-base"
            >
              {saving ? 'Saving...' : `Save ${clientName || 'Client'}`}
            </button>
            <button
              onClick={() => { setParsed(null); setError('') }}
              className="border border-zinc-700 hover:border-zinc-500 transition text-zinc-400 hover:text-white px-5 py-4 rounded-xl text-sm font-medium"
            >
              Re-paste
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-black text-white">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" async />
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/scripts')} className="text-zinc-500 hover:text-white transition text-sm">← Scripts</button>
        <span className="text-zinc-700">|</span>
        <span className="text-sm font-semibold">Import Scripts</span>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
