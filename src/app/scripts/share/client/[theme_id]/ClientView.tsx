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

export default function ClientView({ scripts, themeId }: { scripts: any[], themeId: string }) {
  const [hearts, setHearts] = useState<Set<string>>(new Set())
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    const sid = getOrCreateSession()
    setSessionId(sid)
    const stored = localStorage.getItem(`eve_hearts_${themeId}`)
    if (stored) setHearts(new Set(JSON.parse(stored)))
  }, [themeId])

  async function toggleHeart(scriptId: string) {
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
          <svg width="16" height="16" viewBox="0 0 36 36" fill="#8b5cf6" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 30s-13-8.5-13-17a8 8 0 0 1 13-6.2A8 8 0 0 1 31 13c0 8.5-13 17-13 17z" strokeLinejoin="round"/>
          </svg>
          {heartedCount} script{heartedCount !== 1 ? 's' : ''} picked
        </p>
      )}

      <div className="space-y-5">
        {scripts.map(script => {
          const content = script.script_content
          const isHearted = hearts.has(script.id)

          return (
            <div
              key={script.id}
              className={`border rounded-2xl p-6 transition-all duration-200 ${
                isHearted ? 'border-violet-600 bg-violet-950/20' : 'border-zinc-800 bg-zinc-900'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{script.title || 'Untitled Script'}</h3>
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

                <button
                  onClick={() => toggleHeart(script.id)}
                  className="transition-all duration-150 hover:scale-110 shrink-0"
                  title={isHearted ? 'Remove from picks' : 'Add to picks'}
                >
                  <svg width="48" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M18 30s-13-8.5-13-17a8 8 0 0 1 13-6.2A8 8 0 0 1 31 13c0 8.5-13 17-13 17z"
                      fill={isHearted ? '#8b5cf6' : 'none'}
                      stroke={isHearted ? '#8b5cf6' : '#71717a'}
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Hook */}
              <div className="bg-violet-950/30 border border-violet-800/50 rounded-xl p-4 mb-3">
                <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">Hook</p>
                <p className="text-white font-semibold leading-relaxed">{content?.hook}</p>
              </div>

              {/* Body */}
              {content?.body?.length > 0 && (
                <div className="space-y-1 mb-3 px-1">
                  {content.body.map((line: string, i: number) => (
                    <p key={i} className="text-zinc-400 text-sm leading-relaxed">{line}</p>
                  ))}
                </div>
              )}

              {/* CTA */}
              {content?.cta && (
                <p className="text-zinc-300 text-sm font-medium px-1">{content.cta}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
