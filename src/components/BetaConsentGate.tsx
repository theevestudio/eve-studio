'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BetaConsentGate({ onAccept }: { onAccept: () => void }) {
  const [loading, setLoading] = useState(false)
  const [declined, setDeclined] = useState(false)
  const supabase = createClient()

  async function handleAccept() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({
        analytics_consent: true,
        analytics_consent_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    setLoading(false)
    onAccept()
  }

  if (declined) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-3xl mb-4">✕</p>
          <h1 className="text-xl font-bold mb-3">Beta access requires data consent</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            We collect usage data so we can actually improve E.V.E. before launch. Without it, the beta program doesn&apos;t serve its purpose.
          </p>
          <p className="text-zinc-500 text-sm mb-8">
            If you change your mind, refresh the page to accept. Otherwise, you can still subscribe at the regular rate once E.V.E. launches.
          </p>
          <button
            onClick={() => setDeclined(false)}
            className="text-sm text-zinc-400 hover:text-white transition underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-lg w-full">
        {/* Beta badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs bg-amber-900/50 text-amber-400 border border-amber-700/60 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
            Beta Program
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-3">One thing before you start</h1>
        <p className="text-zinc-400 text-base leading-relaxed mb-8">
          As a beta tester, you get full free access to E.V.E. Studio and the Premiere Pro plugin during your session. In return, we collect usage data — what features you use, how often, and where things break.
        </p>

        {/* What we collect */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8 space-y-3">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-3">What we collect</p>
          {[
            ['Pages you visit and features you use', 'Helps us see what\'s working and what gets ignored'],
            ['Actions you take (running VIBE, editing scripts, using the plugin)', 'Shows us how you actually use the product, not just how we intended it'],
            ['Errors and bugs you report', 'Lets us fix issues before public launch'],
          ].map(([what, why]) => (
            <div key={what} className="flex gap-3 text-sm">
              <span className="text-amber-500 mt-0.5 shrink-0">·</span>
              <div>
                <span className="text-white">{what}</span>
                <span className="text-zinc-500"> — {why}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-zinc-500 text-xs mb-8 leading-relaxed">
          We do not sell this data. It is used exclusively to improve E.V.E. This is separate from and in addition to the NDA you already signed. You may withdraw from the beta program at any time by contacting us.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition text-black font-bold py-3.5 rounded-xl text-sm"
          >
            {loading ? 'Saving...' : 'I agree — take me to my dashboard'}
          </button>
          <button
            onClick={() => setDeclined(true)}
            className="flex-1 border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-white transition font-medium py-3.5 rounded-xl text-sm"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  )
}
