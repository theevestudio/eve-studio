'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Theme } from '@/lib/types'

export default function ImportScriptPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [themeId, setThemeId] = useState('')
  const [title, setTitle] = useState('')
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [analysisNotes, setAnalysisNotes] = useState('')
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: t } = await supabase.from('themes').select('*').order('client_name')
      setThemes(t || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handlePDFUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    setError('')
    setImporting(true)

    try {
      // Use PDF.js via CDN to extract text client-side
      const pdfjsLib = (window as any).pdfjsLib
      if (!pdfjsLib) {
        setError('PDF reader not loaded yet — try again in a moment')
        setImporting(false)
        return
      }

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(' ')
        fullText += pageText + '\n'
      }

      if (fullText.trim().length < 10) {
        setError('Could not extract text from this PDF. It may be a scanned image — please paste the text manually instead.')
        setImporting(false)
        return
      }

      setRawText(fullText.trim())
    } catch {
      setError('Failed to read PDF — please paste the script text manually instead.')
    } finally {
      setImporting(false)
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!rawText.trim()) { setError('Please paste or upload your script first'); return }

    setImporting(true)
    setError('')
    setAnalysisNotes('')

    const res = await fetch('/api/scripts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText, theme_id: themeId || null, title: title || null }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Import failed')
      setImporting(false)
      return
    }

    setAnalysisNotes(data.analysis_notes || '')
    setSuccess(true)
    setImporting(false)
  }

  if (loading) return <Shell><div className="text-zinc-500 text-sm">Loading...</div></Shell>

  if (success) {
    return (
      <Shell>
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
            <button
              onClick={() => router.push('/dashboard/scripts')}
              className="bg-violet-600 hover:bg-violet-500 transition text-white font-semibold px-5 py-2.5 rounded-lg text-sm"
            >
              View all scripts
            </button>
            <button
              onClick={() => { setSuccess(false); setRawText(''); setTitle(''); setThemeId(''); setAnalysisNotes('') }}
              className="border border-zinc-700 hover:border-zinc-500 transition text-zinc-400 hover:text-white font-semibold px-5 py-2.5 rounded-lg text-sm"
            >
              Import another
            </button>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Import a Script</h1>
          <p className="text-zinc-500 text-sm">Paste or upload your script — VIBE will analyze it, structure it, and score its viral potential.</p>
        </div>

        {/* Warning banner */}
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl px-5 py-4 mb-8">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">Heads up</p>
          <p className="text-amber-200/80 text-sm leading-relaxed">
            Imported scripts may not be formatted exactly the way VIBE formats them, so E.V.E. may not be able to fully read all sections.
            Use <strong>Enhance with VIBE</strong> (1 token) after importing to optimize for best results.
          </p>
        </div>

        <form onSubmit={handleImport} className="space-y-6">

          {/* Optional title */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Script title <span className="text-zinc-600">(optional — VIBE will generate one)</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Why buyers lowball in this market"
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          {/* Optional client theme */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Client theme <span className="text-zinc-600">(optional — helps VIBE analyze in context)</span></label>
            <select
              value={themeId}
              onChange={e => setThemeId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition"
            >
              <option value="">— No client selected —</option>
              {themes.map(t => (
                <option key={t.id} value={t.id}>{t.client_name}</option>
              ))}
            </select>
          </div>

          {/* PDF upload */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Upload PDF <span className="text-zinc-600">(or paste text below)</span></label>
            <div
              className="border-2 border-dashed border-zinc-800 hover:border-violet-600 transition rounded-xl p-8 text-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="text-zinc-500 text-sm mb-1">Click to upload a PDF</p>
              <p className="text-zinc-700 text-xs">Script text will be extracted automatically</p>
              <p className="text-zinc-700 text-xs mt-1">⚠ Scanned image PDFs cannot be extracted — paste text manually instead</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePDFUpload}
              />
            </div>
          </div>

          {/* Text paste area */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Script text <span className="text-zinc-600">(paste from Notion, Google Docs, Notes, etc.)</span></label>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Paste your script here — hook, body, CTA, all of it. VIBE will structure it for you..."
              rows={12}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition resize-none font-mono"
            />
            <p className="text-zinc-600 text-xs mt-1">{rawText.length} characters</p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={importing || !rawText.trim()}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition text-white font-bold py-4 rounded-xl text-base"
          >
            {importing ? 'VIBE is analyzing your script...' : 'Import & Analyze'}
          </button>

          <p className="text-center text-zinc-600 text-xs">Importing is free · Enhancement costs 1 VIBE token</p>
        </form>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-black text-white">
      {/* PDF.js CDN */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" async />
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/scripts')} className="text-zinc-500 hover:text-white transition text-sm">← Scripts</button>
        <span className="text-zinc-700">|</span>
        <span className="text-sm font-semibold">Import Script</span>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
