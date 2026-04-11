'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STORAGE_KEY = 'eve_feedback_last'
const NEVER_KEY = 'eve_feedback_never'
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

export default function FeedbackPopup() {
  const [visible, setVisible] = useState(false)
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(NEVER_KEY)) return

    const last = localStorage.getItem(STORAGE_KEY)
    const shouldShow = !last || Date.now() - Number(last) > THIRTY_DAYS

    if (shouldShow) {
      // Show after 8 seconds so the user has had a chance to actually use the app
      const timer = setTimeout(() => setVisible(true), 8000)
      return () => clearTimeout(timer)
    }
  }, [])

  async function handleSubmit() {
    if (!stars) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('feedback').insert({
      user_id: user?.id || null,
      stars,
      comment: comment.trim() || null,
      created_at: new Date().toISOString(),
    }).select()

    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setSubmitting(false)
    setSubmitted(true)
    setTimeout(() => setVisible(false), 2500)
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setVisible(false)
  }

  function neverShow() {
    localStorage.setItem(NEVER_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

      {/* Card */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-7 w-full max-w-sm shadow-2xl z-10">
        {submitted ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✦</div>
            <p className="font-bold text-lg mb-1">Thank you!</p>
            <p className="text-zinc-500 text-sm">Your feedback helps us build a better E.V.E.</p>
          </div>
        ) : (
          <>
            <button onClick={dismiss} className="absolute top-4 right-4 text-zinc-600 hover:text-white transition text-xl leading-none">×</button>

            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">Quick feedback</p>
            <h3 className="text-lg font-bold mb-1">How's E.V.E. working for you?</h3>
            <p className="text-zinc-500 text-sm mb-6">Takes 10 seconds. Helps us a lot.</p>

            {/* Stars */}
            <div className="flex gap-2 justify-center mb-6">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setStars(s)}
                  className="text-3xl transition-all duration-150"
                  style={{ opacity: s <= (hovered || stars) ? 1 : 0.25, transform: s <= (hovered || stars) ? 'scale(1.15)' : 'scale(1)' }}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Optional comment */}
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Anything we should know? (optional)"
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 transition resize-none placeholder-zinc-600 mb-4"
            />

            <button
              onClick={handleSubmit}
              disabled={!stars || submitting}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition text-white font-bold py-3 rounded-xl text-sm"
            >
              {submitting ? 'Sending...' : 'Send feedback'}
            </button>

            <div className="flex justify-center mt-3">
              <button onClick={neverShow} className="text-xs text-zinc-700 hover:text-zinc-500 transition">
                Don't show this again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
