'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useTrackEvent } from '@/hooks/useTrackEvent'
import type { Profile, TokenBalance } from '@/lib/types'

type ReportType = 'bug' | 'plugin_error' | 'recommendation' | 'other'

const REPORT_TYPES: { value: ReportType; label: string; hint: string }[] = [
  { value: 'bug',            label: 'Bug',            hint: 'Something broke or behaved unexpectedly' },
  { value: 'plugin_error',   label: 'Plugin Error',   hint: 'E.V.E. didn\'t finish, crashed, or gave a wrong result in Premiere' },
  { value: 'recommendation', label: 'Recommendation', hint: 'A feature or improvement you\'d like to see' },
  { value: 'other',          label: 'Other',          hint: 'Anything else worth noting' },
]

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function BetaDashboard({
  profile,
  tokens,
  onSignOut,
}: {
  profile: Profile
  tokens: TokenBalance | null
  onSignOut: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { trackEvent } = useTrackEvent()
  const supabase = createClient()

  // Report form state
  const [reportType, setReportType] = useState<ReportType>('bug')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reportStatus, setReportStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Track page view on mount
  useEffect(() => {
    trackEvent('page_view', { page: 'beta_dashboard' })
  }, [trackEvent])

  const betaExpiresAt = profile.beta_expires_at
  const daysLeft = betaExpiresAt ? daysUntil(betaExpiresAt) : null
  const isExpired = daysLeft !== null && daysLeft <= 0

  async function handleSubmitReport() {
    if (!description.trim() || description.trim().length < 5) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/beta/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reportType, description, page: pathname }),
      })
      const data = await res.json()
      if (data.success) {
        setReportStatus('success')
        setDescription('')
        trackEvent('report_submit', { type: reportType })
        setTimeout(() => setReportStatus('idle'), 4000)
      } else {
        setReportStatus('error')
      }
    } catch {
      setReportStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  function nav(path: string, event: string) {
    trackEvent(event)
    router.push(path)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Beta mode top bar */}
      <div className="bg-amber-950/40 border-b border-amber-800/40 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xs bg-amber-500 text-black font-black px-2.5 py-0.5 rounded-md uppercase tracking-widest">
            Beta Mode
          </span>
          <span className="text-amber-400/80 text-xs">
            You&apos;re using a pre-release version of E.V.E. Studio
          </span>
        </div>
        {daysLeft !== null && !isExpired && (
          <span className="text-amber-500/70 text-xs font-medium">
            {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
          </span>
        )}
        {isExpired && (
          <span className="text-red-400 text-xs font-semibold">Session expired</span>
        )}
      </div>

      {/* Navbar */}
      <nav className="border-b border-zinc-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <Image src="/logo-full.png" alt="The E.V.E. Studio" width={140} height={40} className="shrink-0" />
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm text-zinc-400 truncate hidden sm:block">{profile.email}</span>
          <button
            onClick={onSignOut}
            className="text-sm text-zinc-500 hover:text-white transition shrink-0"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Welcome header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-1">
            Welcome to the Beta Program{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-zinc-400 text-base">
            You have full free access to E.V.E. Studio and the Premiere Pro plugin. In return, we ask for three things.
          </p>
        </div>

        {/* What we need from you */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              number: '01',
              title: 'Use it for real',
              body: 'Run VIBE, edit scripts, try the plugin in Premiere. Don\'t just click around — put it to actual use.',
            },
            {
              number: '02',
              title: 'Report what you find',
              body: 'If something doesn\'t work, looks wrong, or could be better — tell us using the form below. Every report directly improves the product.',
            },
            {
              number: '03',
              title: 'Allow data collection',
              body: 'We track what features you use and how. This is how we know what\'s working before we launch. You already agreed to this.',
            },
          ].map(item => (
            <div key={item.number} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-amber-600 text-xs font-black uppercase tracking-widest mb-2">{item.number}</p>
              <p className="font-bold mb-1.5">{item.title}</p>
              <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        {/* Report an issue — persistent, always visible */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mb-10">
          <p className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-1">Beta Feedback</p>
          <h2 className="text-lg font-bold mb-1">Report an issue or leave feedback</h2>
          <p className="text-zinc-500 text-sm mb-5">
            Bugs, errors, plugin problems, recommendations — anything. Even "EVE didn&apos;t finish editing the video based on the script" is useful. Write it down.
          </p>

          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {REPORT_TYPES.map(rt => (
              <button
                key={rt.value}
                onClick={() => setReportType(rt.value)}
                className={`px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition border ${
                  reportType === rt.value
                    ? 'bg-amber-900/40 border-amber-600 text-amber-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>

          {/* Hint text for selected type */}
          <p className="text-zinc-600 text-xs mb-3">
            {REPORT_TYPES.find(r => r.value === reportType)?.hint}
          </p>

          {/* Description */}
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={
              reportType === 'plugin_error'
                ? 'e.g. EVE didn\'t finish editing the video based on the script — it got to cut 3 then stopped.'
                : reportType === 'bug'
                ? 'e.g. The script editor crashed when I tried to save with no hook text.'
                : reportType === 'recommendation'
                ? 'e.g. It would help to see which b-roll notes have been used already.'
                : 'Anything else worth knowing...'
            }
            rows={4}
            className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-amber-600 transition resize-none placeholder-zinc-600 mb-4"
          />

          {reportStatus === 'success' ? (
            <div className="bg-green-950/40 border border-green-800/60 rounded-xl px-4 py-3 text-green-400 text-sm font-medium">
              Report received — thank you. This goes straight to us.
            </div>
          ) : reportStatus === 'error' ? (
            <div className="bg-red-950/40 border border-red-800/60 rounded-xl px-4 py-3 text-red-400 text-sm">
              Something went wrong. Try again or email us directly.
            </div>
          ) : (
            <button
              onClick={handleSubmitReport}
              disabled={submitting || description.trim().length < 5}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 transition text-black font-bold px-6 py-3 rounded-xl text-sm"
            >
              {submitting ? 'Sending...' : 'Submit report'}
            </button>
          )}
        </div>

        {/* Token balance — compact row */}
        <div className="flex flex-wrap gap-4 mb-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center gap-3">
            <div>
              <p className="text-zinc-500 text-xs mb-0.5">VIBE Tokens</p>
              <p className="text-2xl font-bold text-violet-400">{tokens?.balance ?? 0}</p>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center gap-3">
            <div>
              <p className="text-zinc-500 text-xs mb-0.5">Lifetime earned</p>
              <p className="text-2xl font-bold text-white">{tokens?.lifetime_earned ?? 0}</p>
            </div>
          </div>
          {betaExpiresAt && !isExpired && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center gap-3">
              <div>
                <p className="text-zinc-500 text-xs mb-0.5">Beta expires</p>
                <p className="text-sm font-semibold text-white">
                  {new Date(betaExpiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Your tools */}
        <div className="mb-3">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-4">Your Tools</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => nav('/dashboard/vibe', 'nav_vibe')}
              className="bg-violet-600 hover:bg-violet-500 transition rounded-xl p-6 text-left"
            >
              <p className="text-xl font-bold mb-1">VIBE</p>
              <p className="text-violet-200 text-sm">Generate a batch of video scripts for your client</p>
            </button>

            <button
              onClick={() => nav('/dashboard/themes', 'nav_themes')}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition rounded-xl p-6 text-left"
            >
              <p className="text-xl font-bold mb-1">Client Themes</p>
              <p className="text-zinc-400 text-sm">Manage your client brand profiles</p>
            </button>

            <button
              onClick={() => nav('/dashboard/scripts', 'nav_scripts')}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition rounded-xl p-6 text-left"
            >
              <p className="text-xl font-bold mb-1">Scripts</p>
              <p className="text-zinc-400 text-sm">View, edit and restore generated scripts</p>
            </button>

            <button
              onClick={() => nav('/dashboard/plugin', 'nav_plugin')}
              className="bg-zinc-900 hover:bg-zinc-800 border border-amber-900/30 transition rounded-xl p-6 text-left"
            >
              <p className="text-xs text-amber-600 font-bold uppercase tracking-widest mb-1">Beta</p>
              <p className="text-xl font-bold mb-1">E.V.E. Plugin</p>
              <p className="text-zinc-400 text-sm">Download and install the Premiere Pro plugin</p>
            </button>
          </div>
        </div>

        {/* Admin — only visible to Alana */}
        {profile.email === 'alana.productions.co@gmail.com' && (
          <div className="mt-8">
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">Admin</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/admin/beta')}
                className="bg-zinc-900 border border-violet-800/50 hover:border-violet-600 transition rounded-xl p-4 text-left flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-violet-300">Beta Applications</p>
                  <p className="text-zinc-500 text-sm">Review and approve beta testers</p>
                </div>
                <span className="text-violet-500 text-lg">→</span>
              </button>
              <button
                onClick={() => router.push('/admin/beta/reports')}
                className="bg-zinc-900 border border-violet-800/50 hover:border-violet-600 transition rounded-xl p-4 text-left flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-violet-300">Beta Reports & Activity</p>
                  <p className="text-zinc-500 text-sm">Bugs, errors, recommendations, usage events</p>
                </div>
                <span className="text-violet-500 text-lg">→</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
