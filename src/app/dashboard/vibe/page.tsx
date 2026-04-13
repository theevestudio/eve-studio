'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import type { Theme, Script, TokenBalance } from '@/lib/types'
import LoadingEVE from '@/components/LoadingEVE'

export default function VibePage() {
  return (
    <Suspense fallback={<Shell><LoadingEVE /></Shell>}>
      <VibeContent />
    </Suspense>
  )
}

function VibeContent() {
  const searchParams = useSearchParams()
  const [themes, setThemes] = useState<Theme[]>([])
  const [tokens, setTokens] = useState<TokenBalance | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<string>(searchParams.get('theme') || '')
  const [count, setCount] = useState(3)
  const [showCustomize, setShowCustomize] = useState(false)
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('')
  const [hookPref, setHookPref] = useState('')
  const [ctaOverride, setCtaOverride] = useState('')
  const [generating, setGenerating] = useState(false)
  const [scripts, setScripts] = useState<Script[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmGenerate, setConfirmGenerate] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const [{ data: t }, { data: b }] = await Promise.all([
        supabase.from('themes').select('*').order('client_name'),
        supabase.from('token_balances').select('*').eq('user_id', user.id).single(),
      ])
      setThemes(t || [])
      setTokens(b)
      setLoading(false)
    }
    load()
  }, [])

  async function handleGenerate() {
    if (!selectedTheme) { setError('Select a client theme first'); return }
    if (!tokens || tokens.balance < count) { setError('Not enough tokens'); return }
    setGenerating(true)
    setError('')
    setScripts([])

    const res = await fetch('/api/vibe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme_id: selectedTheme, count, topic, tone, hookPref, ctaOverride }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setGenerating(false)
      return
    }

    setScripts(data.scripts || [])
    setTokens(prev => prev ? { ...prev, balance: data.new_balance } : prev)
    setGenerating(false)
  }

  if (loading) return <Shell><LoadingEVE /></Shell>

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">VIBE</h1>
        <p className="text-zinc-500 text-sm mt-1">Video Idea Batch Engine — generate scripts powered by AI</p>
      </div>

      {/* Token balance */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-8 flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-xs">Available tokens</p>
          <p className="text-2xl font-bold text-violet-400">{tokens?.balance ?? 0}</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/account')}
          className="text-sm text-zinc-400 hover:text-white transition border border-zinc-700 px-3 py-1.5 rounded-lg"
        >
          Buy more
        </button>
      </div>

      {themes.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-10 text-center">
          <p className="text-zinc-500 mb-4">You need a client theme before generating scripts.</p>
          <button
            onClick={() => router.push('/dashboard/themes/new')}
            className="bg-violet-600 hover:bg-violet-500 transition text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Create a theme
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Theme picker */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Client theme</label>
            <select
              value={selectedTheme}
              onChange={e => setSelectedTheme(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition"
            >
              <option value="">— Select a client —</option>
              {themes.map(t => (
                <option key={t.id} value={t.id}>{t.client_name}</option>
              ))}
            </select>
          </div>

          {/* Script count */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Number of scripts — <span className="text-violet-400">{count} token{count !== 1 ? 's' : ''}</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 5, 10].map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                    count === n
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Customize */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowCustomize(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-white transition"
            >
              <span>Customize generation <span className="text-zinc-600">(optional)</span></span>
              <span>{showCustomize ? '▲' : '▼'}</span>
            </button>

            {showCustomize && (
              <div className="px-4 pb-4 space-y-4 border-t border-zinc-800 pt-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Topic or angle <span className="text-zinc-700">— e.g. "why buyers lowball in this market"</span></label>
                  <input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition"
                    placeholder="Leave blank to let VIBE choose..."
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {['Auto', 'Educational', 'Entertaining', 'Inspirational', 'Promotional', 'Controversial'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTone(t === 'Auto' ? '' : t)}
                        className={`text-xs px-3 py-1 rounded-full border transition ${
                          (t === 'Auto' && !tone) || tone === t
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Hook style</label>
                  <div className="flex flex-wrap gap-2">
                    {['Auto', 'Question', 'Bold statement', 'Story open', 'Contrast', 'Curiosity gap', 'Direct offer'].map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHookPref(h === 'Auto' ? '' : h)}
                        className={`text-xs px-3 py-1 rounded-full border transition ${
                          (h === 'Auto' && !hookPref) || hookPref === h
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Override CTA <span className="text-zinc-700">— replaces theme default</span></label>
                  <input
                    value={ctaOverride}
                    onChange={e => setCtaOverride(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition"
                    placeholder="e.g. Comment SOLD below"
                  />
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {confirmGenerate ? (
            <div className="border border-violet-700 bg-violet-950/30 rounded-xl px-5 py-4 space-y-3">
              <p className="text-white font-semibold text-sm">
                Generate {count} script{count !== 1 ? 's' : ''} for <span className="text-violet-400">{count} token{count !== 1 ? 's' : ''}</span>?
              </p>
              <p className="text-zinc-500 text-xs">Your balance will go from {tokens?.balance ?? 0} → {(tokens?.balance ?? 0) - count} tokens.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmGenerate(false); handleGenerate() }}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 transition text-white font-bold py-3 rounded-xl text-sm"
                >
                  Confirm — Generate
                </button>
                <button
                  onClick={() => setConfirmGenerate(false)}
                  className="px-4 py-3 text-zinc-400 hover:text-white transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmGenerate(true)}
              disabled={generating || !selectedTheme || (tokens?.balance ?? 0) < count}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition text-white font-bold py-4 rounded-xl text-lg"
            >
              {generating ? 'Generating scripts...' : `Generate ${count} Script${count !== 1 ? 's' : ''}`}
            </button>
          )}

          {generating && (
            <div className="text-center text-zinc-500 text-sm animate-pulse">
              VIBE is writing your scripts — this takes about 10-15 seconds...
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {scripts.length > 0 && (
        <div className="mt-10 space-y-6">
          <h2 className="text-lg font-bold">Generated Scripts</h2>
          {scripts.map((script, i) => (
            <ScriptCard key={script.id} script={script} index={i + 1} />
          ))}
          <button
            onClick={() => router.push('/dashboard/scripts')}
            className="w-full border border-zinc-700 hover:border-violet-500 transition text-zinc-400 hover:text-white py-3 rounded-xl text-sm"
          >
            View all scripts →
          </button>
        </div>
      )}
    </Shell>
  )
}

function ScriptCard({ script, index }: { script: Script; index: number }) {
  const content = script.script_content
  if (!content) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-1">Script {index}</p>
          <p className="font-bold text-lg">{script.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {script.hook_type && (
            <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{script.hook_type}</span>
          )}
          {script.virality_score && (
            <span className="text-xs bg-violet-900 text-violet-300 px-2 py-0.5 rounded-full">
              {script.virality_score}/10
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Hook</p>
          <p className="text-white font-medium">{content.hook}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Body</p>
          <div className="space-y-1">
            {content.body?.map((line, i) => (
              <p key={i} className="text-zinc-300 text-sm">{line}</p>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">CTA</p>
          <p className="text-white text-sm">{content.cta}</p>
        </div>
        {content.b_roll_notes && content.b_roll_notes.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">B-roll notes</p>
            <ul className="text-zinc-400 text-xs space-y-0.5">
              {content.b_roll_notes.map((note, i) => (
                <li key={i}>· {note}</li>
              ))}
            </ul>
          </div>
        )}
        {content.duration_estimate && (
          <p className="text-xs text-zinc-600">Est. duration: {content.duration_estimate}</p>
        )}
      </div>
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 sm:px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-zinc-500 hover:text-white transition text-sm">← Dashboard</button>
        <span className="text-zinc-700">|</span>
        <span className="text-sm font-semibold">VIBE</span>
      </nav>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</main>
    </div>
  )
}
