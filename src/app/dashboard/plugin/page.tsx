'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'
import LoadingEVE from '@/components/LoadingEVE'

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function PluginPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [reapplying, setReapplying] = useState(false)
  const [reapplyStatus, setReapplyStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      setLoading(false)
    }
    load()
  }, [])

  async function handleReapply() {
    setReapplying(true)
    try {
      const res = await fetch('/api/beta/reapply', { method: 'POST' })
      const data = await res.json()
      setReapplyStatus(data.success ? 'sent' : 'error')
    } catch {
      setReapplyStatus('error')
    } finally {
      setReapplying(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <LoadingEVE />
    </div>
  )

  const betaExpiresAt = profile?.beta_expires_at
  const daysLeft = betaExpiresAt ? daysUntil(betaExpiresAt) : null
  const isExpired = daysLeft !== null && daysLeft <= 0
  const expiryDate = betaExpiresAt
    ? new Date(betaExpiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold">E.V.E. Plugin</h1>
            <span className="text-xs bg-violet-900/50 text-violet-300 border border-violet-700 px-2.5 py-1 rounded-full font-semibold uppercase tracking-widest">Beta</span>
          </div>
          <p className="text-zinc-400">Your Premiere Pro plugin for script access, sequence creation, and footage import — directly inside your timeline.</p>
        </div>

        {/* Beta session status */}
        {profile?.is_beta_user && (
          <div className={`rounded-xl border p-5 mb-8 ${
            isExpired ? 'bg-red-950/30 border-red-800/60' : 'bg-zinc-900 border-zinc-700'
          }`}>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Beta Session</p>
            {isExpired ? (
              <p className="text-red-400 font-semibold">Your beta session expired on {expiryDate}.</p>
            ) : daysLeft !== null ? (
              <p className="text-white font-semibold">
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                <span className="text-zinc-500 font-normal"> · Expires {expiryDate}</span>
              </p>
            ) : (
              <p className="text-zinc-400">Beta access active.</p>
            )}
          </div>
        )}

        {/* Download */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-1">Download the Plugin</h2>
          <p className="text-zinc-400 text-sm mb-4">Download the ZIP, unzip it, then follow the install steps below.</p>
          <a
            href="/eve-plugin.zip"
            download="eve-plugin.zip"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 transition text-white font-bold px-5 py-2.5 rounded-xl text-sm"
          >
            ↓ Download E.V.E. Plugin
          </a>
        </section>

        {/* Install instructions */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">How to Install</h2>
          <ol className="space-y-4 text-sm text-zinc-300">
            {[
              { n: 1, text: 'Download and unzip the plugin folder above.' },
              { n: 2, text: 'Open Adobe Premiere Pro first — UXP Developer Tools will not work unless Premiere is already running and fully loaded.' },
              { n: 3, text: 'Inside Premiere Pro, go to Window → UXP Developer Tools. Open it from within Premiere, not from a standalone app.' },
              { n: 4, text: 'If you see "No applications connected" — close UXP Dev Tools, make sure Premiere is fully open, then reopen UXP Developer Tools from the Window menu inside Premiere.' },
              { n: 5, text: 'Click Add Plugin, then select the manifest.json file inside the unzipped eve-studio-plugin folder.' },
              { n: 6, text: 'Click Load, then find E.V.E. under Window → Extensions in Premiere.' },
              { n: 7, text: 'Sign in with your EVE Studio account. Your subscription is verified automatically.' },
            ].map(step => (
              <li key={step.n} className="flex gap-4">
                <span className="shrink-0 w-6 h-6 rounded-md bg-violet-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{step.n}</span>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Warnings */}
        <section className="bg-yellow-950/20 border border-yellow-800/40 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-yellow-400 mb-3">⚠ Beta Warning</h2>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li>· This is early beta software. Bugs and unexpected behavior may occur.</li>
            <li>· Do not use E.V.E. on active client projects without a backup — always keep a copy of your Premiere project.</li>
            <li>· Sequence creation and footage import are experimental. Review all changes before rendering.</li>
            <li>· Updates will be released regularly. Check your account page for new versions and re-download when available.</li>
            <li>· If the plugin stops working after a Premiere update, re-download from this page — we push fixes fast.</li>
          </ul>
        </section>

        {/* Lifetime discount */}
        <section className="bg-violet-950/20 border border-violet-700/40 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-violet-300 mb-1">Your Founding Member Rate — $29/month</h2>
          <p className="text-zinc-400 text-sm mb-4">
            As a beta tester, you lock in <strong className="text-white">$29/month forever</strong> when you subscribe — that&apos;s $10/month off the regular $39/mo rate. This rate never increases as long as your subscription stays active.
          </p>
          <button
            onClick={() => router.push('/dashboard/account?checkout=EVE_LIFETIME')}
            className="bg-violet-600 hover:bg-violet-500 transition text-white font-bold px-5 py-2.5 rounded-xl text-sm"
          >
            Subscribe at $29/mo →
          </button>
        </section>

        {/* Reapply */}
        {profile?.is_beta_user && (
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-1">Extend Your Beta Session</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Beta sessions are 3 months. You can apply for an additional 3 months of free testing access — we review all extension requests personally.
            </p>
            {reapplyStatus === 'sent' ? (
              <div className="bg-violet-950/50 border border-violet-700 rounded-xl px-4 py-3 text-violet-300 text-sm font-medium">
                Extension request sent. We&apos;ll review it and get back to you shortly.
              </div>
            ) : reapplyStatus === 'error' ? (
              <div className="bg-red-950/40 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">
                Something went wrong — try again or email us at theevestudio.io
              </div>
            ) : (
              <button
                onClick={handleReapply}
                disabled={reapplying}
                className="border border-zinc-600 hover:border-violet-500 hover:text-white disabled:opacity-50 transition text-zinc-300 font-semibold px-5 py-2.5 rounded-xl text-sm"
              >
                {reapplying ? 'Sending request...' : 'Apply for 3 More Months'}
              </button>
            )}
          </section>
        )}

      </main>
    </div>
  )
}
