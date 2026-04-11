'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Script, Theme } from '@/lib/types'

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [themes, setThemes] = useState<Record<string, Theme>>({})
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [enhancing, setEnhancing] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from('scripts').select('*').order('created_at', { ascending: false }),
        supabase.from('themes').select('*'),
      ])

      setScripts(s || [])
      const themeMap: Record<string, Theme> = {}
      ;(t || []).forEach(th => { themeMap[th.id] = th })
      setThemes(themeMap)
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
    } else {
      alert(data.error || 'Enhancement failed')
    }
    setEnhancing(null)
  }

  if (loading) return <Shell><div className="text-zinc-500 text-sm">Loading...</div></Shell>

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Scripts</h1>
          <p className="text-zinc-500 text-sm mt-1">{scripts.length} script{scripts.length !== 1 ? 's' : ''}</p>
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
      ) : (
        <div className="space-y-4">
          {scripts.map(script => {
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
                              onClick={() => { setEditingId(script.id); setEditDraft({ ...script.script_content }) }}
                              className="text-sm text-zinc-400 hover:text-white transition border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg"
                            >
                              Edit
                            </button>
                            {script.is_edited && (
                              <button
                                onClick={() => handleRestore(script)}
                                className="text-sm text-violet-400 hover:text-violet-300 transition border border-violet-800 hover:border-violet-600 px-3 py-1.5 rounded-lg"
                              >
                                Restore original
                              </button>
                            )}
                            {isImported && (
                              <button
                                onClick={() => handleEnhance(script)}
                                disabled={enhancing === script.id}
                                className="text-sm text-violet-300 hover:text-white transition bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-3 py-1.5 rounded-lg font-semibold"
                              >
                                {enhancing === script.id ? 'Enhancing...' : '✦ Enhance with VIBE — 1 token'}
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
