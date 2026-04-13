'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Script, Theme } from '@/lib/types'
import { useToast, Toast } from '@/components/Toast'
import LoadingEVE from '@/components/LoadingEVE'

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [themes, setThemes] = useState<Record<string, Theme>>({})
  const [heartCounts, setHeartCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [enhancing, setEnhancing] = useState<string | null>(null)
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null)
  const [activeThemeFilter, setActiveThemeFilter] = useState<string | null>(null)
  const [filmedFilter, setFilmedFilter] = useState(false)
  const { toast, show: showToast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const [{ data: s }, { data: t }, { data: h }] = await Promise.all([
        supabase.from('scripts').select('*').order('created_at', { ascending: false }),
        supabase.from('themes').select('*'),
        supabase.from('script_hearts').select('script_id'),
      ])

      setScripts(s || [])
      const themeMap: Record<string, Theme> = {}
      ;(t || []).forEach(th => { themeMap[th.id] = th })
      setThemes(themeMap)
      const counts: Record<string, number> = {}
      ;(h || []).forEach(r => { counts[r.script_id] = (counts[r.script_id] || 0) + 1 })
      setHeartCounts(counts)

      const paramTheme = new URLSearchParams(window.location.search).get('theme')
      if (paramTheme) setActiveThemeFilter(paramTheme)

      setLoading(false)
    }
    load()
  }, [])

  async function handleSaveEdit(script: Script) {
    setSaving(true)
    const { error } = await supabase
      .from('scripts')
      .update({ script_content: editDraft, is_edited: true, updated_at: new Date().toISOString() })
      .eq('id', script.id)

    if (!error) {
      setScripts(prev => prev.map(s => s.id === script.id ? { ...s, script_content: editDraft, is_edited: true } : s))
      setEditingId(null)
      setEditDraft(null)
    }
    setSaving(false)
  }

  async function handleRestore(script: Script) {
    if (!script.original_content) return
    const { error } = await supabase
      .from('scripts')
      .update({ script_content: script.original_content, is_edited: false, updated_at: new Date().toISOString() })
      .eq('id', script.id)

    if (!error) {
      setScripts(prev => prev.map(s => s.id === script.id ? { ...s, script_content: script.original_content, is_edited: false } : s))
    }
  }

  function handleCopy(script: Script) {
    const c = script.script_content
    if (!c) return
    const text = [
      script.title ? `${script.title}\n` : '',
      `HOOK\n${c.hook}`,
      `\nBODY\n${c.body?.join('\n')}`,
      `\nCTA\n${c.cta}`,
      c.b_roll_notes?.length ? `\nB-ROLL NOTES\n${c.b_roll_notes.map(n => `· ${n}`).join('\n')}` : '',
      c.duration_estimate ? `\nEst. duration: ${c.duration_estimate}` : '',
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text)
    showToast('Script copied to clipboard')
  }

  function handleShare(script: Script) {
    const url = `${window.location.origin}/scripts/share/${script.id}`
    navigator.clipboard.writeText(url)
    showToast('Share link copied to clipboard')
  }

  async function handleEnhance(script: Script) {
    setEnhancing(script.id)
    const res = await fetch('/api/scripts/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script_id: script.id }),
    })
    const data = await res.json()
    if (res.ok && data.script) {
      setScripts(prev => prev.map(s => s.id === script.id ? data.script : s))
      showToast('Script enhanced')
    } else {
      showToast(data.error || 'Enhancement failed', 'error')
    }
    setEnhancing(null)
  }

  async function handleToggleFilmed(script: Script) {
    const next = !script.filmed
    const { error } = await supabase
      .from('scripts')
      .update({ filmed: next, updated_at: new Date().toISOString() })
      .eq('id', script.id)
    if (!error) {
      setScripts(prev => prev.map(s => s.id === script.id ? { ...s, filmed: next } : s))
      showToast(next ? 'Marked as filmed' : 'Marked as not filmed')
    }
  }

  if (loading) return <Shell><LoadingEVE /></Shell>

  // Themes that have at least one script
  const themesWithScripts = Object.values(themes).filter(th =>
    scripts.some(s => s.theme_id === th.id)
  )

  const filtered = scripts
    .filter(s => !activeThemeFilter || s.theme_id === activeThemeFilter)
    .filter(s => !filmedFilter || s.filmed)

  const activeThemeName = activeThemeFilter ? themes[activeThemeFilter]?.client_name : null

  return (
    <Shell>
      <Toast toast={toast} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Scripts</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {filtered.length} script{filtered.length !== 1 ? 's' : ''}
            {activeThemeName && <span> · {activeThemeName}</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard/scripts/import')}
            className="border border-zinc-700 hover:border-violet-500 transition text-zinc-400 hover:text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Import script
          </button>
          <button
            onClick={() => router.push('/dashboard/vibe')}
            className="bg-violet-600 hover:bg-violet-500 transition text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            + Generate with VIBE
          </button>
        </div>
      </div>

      {/* Client filter pills */}
      {themesWithScripts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setActiveThemeFilter(null); router.replace('/dashboard/scripts') }}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              !activeThemeFilter
                ? 'bg-violet-600 border-violet-600 text-white'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
            }`}
          >
            All
          </button>
          {themesWithScripts.map(th => (
            <button
              key={th.id}
              onClick={() => { setActiveThemeFilter(th.id); router.replace(`/dashboard/scripts?theme=${th.id}`) }}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                activeThemeFilter === th.id
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
              }`}
            >
              {th.client_name}
            </button>
          ))}
          <div className="w-px bg-zinc-800 mx-1 self-stretch" />
          <button
            onClick={() => setFilmedFilter(f => !f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              filmedFilter
                ? 'bg-emerald-700 border-emerald-700 text-white'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
            }`}
          >
            🎬 Filmed
          </button>
        </div>
      )}

      {scripts.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-500 mb-6">No scripts yet.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard/vibe')}
              className="bg-violet-600 hover:bg-violet-500 transition text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              Generate with VIBE
            </button>
            <button
              onClick={() => router.push('/dashboard/scripts/import')}
              className="border border-zinc-700 hover:border-zinc-500 transition text-zinc-400 hover:text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              Import a script
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-500 mb-4">No scripts for {activeThemeName}.</p>
          <button
            onClick={() => router.push(`/dashboard/vibe?theme=${activeThemeFilter}`)}
            className="bg-violet-600 hover:bg-violet-500 transition text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Generate with VIBE
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(script => {
            const isExpanded = expandedId === script.id
            const isEditing = editingId === script.id
            const isImported = script.source === 'imported'
            const content = isEditing ? editDraft : script.script_content
            const theme = script.theme_id ? themes[script.theme_id] : null

            return (
              <div key={script.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-zinc-800 transition"
                  onClick={() => setExpandedId(isExpanded ? null : script.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">{script.title || 'Untitled script'}</p>
                        {isImported && (
                          <span className="text-xs bg-amber-900/40 text-amber-400 border border-amber-800/50 px-2 py-0.5 rounded-full shrink-0">
                            Imported
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {theme?.client_name && <span>{theme.client_name} · </span>}
                        {new Date(script.created_at).toLocaleDateString()}
                        {script.is_edited && <span className="ml-2 text-violet-400">edited</span>}
                        {script.is_new && <span className="ml-2 text-emerald-400">new</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {script.hook_type && (
                      <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full hidden sm:block">{script.hook_type}</span>
                    )}
                    {script.virality_score && (
                      <span className="text-xs bg-violet-900 text-violet-300 px-2 py-0.5 rounded-full">{script.virality_score}/10</span>
                    )}
                    {heartCounts[script.id] > 0 && (
                      <span className="text-xs text-violet-400 font-semibold">♥ {heartCounts[script.id]}</span>
                    )}
                    {script.filmed && (
                      <span
                        title="Filmed"
                        className="text-base leading-none"
                        style={{ filter: 'drop-shadow(0 0 6px #34d399)' }}
                      >
                        🎬
                      </span>
                    )}
                    <span className="text-zinc-600 text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 px-5 py-5 space-y-4">

                    {/* Imported warning */}
                    {isImported && (
                      <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg px-4 py-3">
                        <p className="text-amber-400 text-xs font-semibold mb-0.5">Imported script</p>
                        <p className="text-amber-200/70 text-xs leading-relaxed">
                          This script was imported and may not be fully structured for E.V.E. Use Enhance with VIBE to optimize it for best results in Premiere Pro.
                        </p>
                      </div>
                    )}

                    {content ? (
                      isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs text-zinc-500 uppercase tracking-wide block mb-1">Hook</label>
                            <textarea
                              value={editDraft.hook}
                              onChange={e => setEditDraft((d: any) => ({ ...d, hook: e.target.value }))}
                              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 resize-none"
                              rows={2}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 uppercase tracking-wide block mb-1">Body</label>
                            <textarea
                              value={editDraft.body?.join('\n')}
                              onChange={e => setEditDraft((d: any) => ({ ...d, body: e.target.value.split('\n') }))}
                              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 resize-none"
                              rows={6}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 uppercase tracking-wide block mb-1">CTA</label>
                            <textarea
                              value={editDraft.cta}
                              onChange={e => setEditDraft((d: any) => ({ ...d, cta: e.target.value }))}
                              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 resize-none"
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleSaveEdit(script)}
                              disabled={saving}
                              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition text-white text-sm font-semibold px-4 py-2 rounded-lg"
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditDraft(null) }}
                              className="text-zinc-400 hover:text-white transition text-sm px-3 py-2"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Hook</p>
                            <p className="text-white font-medium">{content.hook}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Body</p>
                            <div className="space-y-1">
                              {content.body?.map((line: string, i: number) => (
                                <p key={i} className="text-zinc-300 text-sm">{line}</p>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">CTA</p>
                            <p className="text-white text-sm">{content.cta}</p>
                          </div>
                          {content.b_roll_notes?.length > 0 && (
                            <div>
                              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">B-roll notes</p>
                              <ul className="text-zinc-400 text-xs space-y-0.5">
                                {content.b_roll_notes.map((note: string, i: number) => (
                                  <li key={i}>· {note}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {content.duration_estimate && (
                            <p className="text-xs text-zinc-600">Est. duration: {content.duration_estimate}</p>
                          )}

                          <div className="flex flex-wrap gap-3 pt-2 border-t border-zinc-800">
                            <button
                              onClick={() => handleToggleFilmed(script)}
                              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition border ${
                                script.filmed
                                  ? 'bg-emerald-600 border-emerald-500 text-white'
                                  : 'border-zinc-700 text-zinc-400 hover:border-emerald-600 hover:text-emerald-400'
                              }`}
                              style={script.filmed ? { boxShadow: '0 0 14px rgba(52,211,153,0.45)' } : undefined}
                            >
                              {script.filmed ? '🎬 Filmed' : 'Mark as filmed'}
                            </button>
                            <button
                              onClick={() => { setEditingId(script.id); setEditDraft({ ...script.script_content }) }}
                              className="text-sm text-zinc-400 hover:text-white transition border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg"
                            >
                              Edit
                            </button>
                            {script.is_edited && confirmRestoreId === script.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400">This will overwrite your edits.</span>
                                <button
                                  onClick={() => { handleRestore(script); setConfirmRestoreId(null) }}
                                  className="text-xs text-red-400 hover:text-red-300 transition border border-red-800 hover:border-red-600 px-2.5 py-1 rounded-lg"
                                >
                                  Yes, restore
                                </button>
                                <button
                                  onClick={() => setConfirmRestoreId(null)}
                                  className="text-xs text-zinc-500 hover:text-white transition px-2"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : script.is_edited ? (
                              <button
                                onClick={() => setConfirmRestoreId(script.id)}
                                className="text-sm text-violet-400 hover:text-violet-300 transition border border-violet-800 hover:border-violet-600 px-3 py-1.5 rounded-lg"
                              >
                                Restore original
                              </button>
                            ) : null}
                            {isImported && (
                              <button
                                onClick={() => handleEnhance(script)}
                                disabled={enhancing === script.id}
                                className="text-sm text-violet-300 hover:text-white transition bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-3 py-1.5 rounded-lg font-semibold"
                              >
                                {enhancing === script.id ? 'Enhancing...' : '✦ Enhance with VIBE — 1 token'}
                              </button>
                            )}
                            <button
                              onClick={() => handleCopy(script)}
                              className="text-sm text-zinc-400 hover:text-white transition border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg"
                            >
                              Copy
                            </button>
                            <a
                              href={`/dashboard/scripts/${script.id}/print`}
                              target="_blank"
                              className="text-sm text-zinc-400 hover:text-white transition border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg"
                            >
                              Export PDF
                            </a>
                            <button
                              onClick={() => handleShare(script)}
                              className="text-sm text-zinc-400 hover:text-white transition border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg"
                            >
                              Share script
                            </button>
                            {script.theme_id && (
                              <button
                                onClick={() => {
                                  const url = `${window.location.origin}/scripts/share/client/${script.theme_id}`
                                  navigator.clipboard.writeText(url)
                                  showToast('Client page link copied!')
                                }}
                                className="text-sm text-violet-400 hover:text-violet-300 transition border border-violet-800 hover:border-violet-600 px-3 py-1.5 rounded-lg"
                              >
                                ♥ Share client page
                              </button>
                            )}
                          </div>
                        </>
                      )
                    ) : (
                      <p className="text-zinc-500 text-sm">No content available.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-zinc-500 hover:text-white transition text-sm">← Dashboard</button>
        <span className="text-zinc-700">|</span>
        <span className="text-sm font-semibold">Scripts</span>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
