'use client'

import { useState, useEffect } from 'react'

const SESSION_KEY = 'eve_client_session'

function getOrCreateSession(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="28" height="24" viewBox="0 0 32 29.6" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.8,17.5,16,21.2c6.2-3.7,16-11.8,16-21.2C32,3.8,28.2,0,23.6,0z"
        fill={filled ? '#8b5cf6' : 'none'}
        stroke={filled ? '#8b5cf6' : '#71717a'}
        strokeWidth="2"
      />
    </svg>
  )
}

export default function ClientView({ scripts, themeId }: { scripts: any[], themeId: string }) {
  const [hearts, setHearts] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    const sid = getOrCreateSession()
    setSessionId(sid)
    const stored = localStorage.getItem(`eve_hearts_${themeId}`)
    if (stored) setHearts(new Set(JSON.parse(stored)))
  }, [themeId])

  async function toggleHeart(e: React.MouseEvent, scriptId: string) {
    e.stopPropagation()
    if (!sessionId) return
    const isHearted = hearts.has(scriptId)
    const newHearts = new Set(hearts)

    if (isHearted) {
      newHearts.delete(scriptId)
      fetch('/api/scripts/heart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: scriptId, session_id: sessionId }),
      })
    } else {
      newHearts.add(scriptId)
      fetch('/api/scripts/heart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: scriptId, session_id: sessionId }),
      })
    }

    setHearts(newHearts)
    localStorage.setItem(`eve_hearts_${themeId}`, JSON.stringify([...newHearts]))
  }

  const heartedCount = hearts.size

  return (
    <div>
      {heartedCount > 0 && (
        <p className="text-violet-400 text-sm mb-6 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 32 29.6" fill="#8b5cf6" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.8,17.5,16,21.2c6.2-3.7,16-11.8,16-21.2C32,3.8,28.2,0,23.6,0z"/>
          </svg>
          {heartedCount} script{heartedCount !== 1 ? 's' : ''} picked
        </p>
      )}

      <div className="space-y-3">
        {scripts.map(script => {
          const content = script.script_content
          const isHearted = hearts.has(script.id)
          const isExpanded = expandedId === script.id

          return (
            <div
              key={script.id}
              className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                isHearted ? 'border-violet-600 bg-violet-950/20' : 'border-zinc-800 bg-zinc-900'
              }`}
            >
              {/* Header row — click to expand */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/5 transition"
                onClick={() => setExpandedId(isExpanded ? null : script.id)}
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="font-semibold text-sm truncate">{script.title || 'Untitled Script'}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {script.virality_score && (
                      <span className="text-xs bg-violet-900 text-violet-300 px-2 py-0.5 rounded-full">
                        {script.virality_score}/10 virality
                      </span>
                    )}
                    {script.hook_type && (
                      <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                        {script.hook_type}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Heart — always visible, stops propagation so it doesn't toggle expand */}
                  <button
                    onClick={(e) => toggleHeart(e, script.id)}
                    className="transition-all duration-150 hover:scale-110"
                    title={isHearted ? 'Remove from picks' : 'Add to picks'}
                  >
                    <HeartIcon filled={isHearted} />
                  </button>
                  <span className="text-zinc-600 text-sm">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-zinc-800 px-5 py-5 space-y-4">
                  {/* Hook */}
                  <div className="bg-violet-950/30 border border-violet-800/50 rounded-xl p-4">
                    <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">Hook</p>
                    <p className="text-white font-semibold leading-relaxed">{content?.hook}</p>
                  </div>

                  {/* Body */}
                  {content?.body?.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Body</p>
                      <div className="space-y-1">
                        {content.body.map((line: string, i: number) => (
                          <p key={i} className="text-zinc-300 text-sm leading-relaxed">{line}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  {content?.cta && (
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Call to Action</p>
                      <p className="text-white text-sm font-medium">{content.cta}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
