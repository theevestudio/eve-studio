'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Profile, TokenBalance } from '@/lib/types'
import FeedbackPopup from '@/components/FeedbackPopup'
import LoadingEVE from '@/components/LoadingEVE'
import BetaPopup from '@/components/BetaPopup'
import BetaConsentGate from '@/components/BetaConsentGate'
import BetaDashboard from '@/components/BetaDashboard'

type PreviewMode = 'actual' | 'beta' | 'user'

const ADMIN_EMAIL = 'alana.productions.co@gmail.com'

function AdminPreviewBar({ mode, onChange }: { mode: PreviewMode; onChange: (m: PreviewMode) => void }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-violet-900/60 px-4 py-1.5 flex items-center gap-3">
      <span className="text-xs text-violet-500 font-bold uppercase tracking-widest shrink-0">Preview</span>
      <div className="flex gap-1">
        {([
          { value: 'actual', label: 'Admin' },
          { value: 'beta',   label: 'Beta User' },
          { value: 'user',   label: 'Regular User' },
        ] as { value: PreviewMode; label: string }[]).map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              mode === opt.value
                ? 'bg-violet-600 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <span className="text-zinc-700 text-xs ml-auto">Only visible to you</span>
    </div>
  )
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tokens, setTokens] = useState<TokenBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('actual')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const [{ data: prof }, { data: bal }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('token_balances').select('*').eq('user_id', user.id).single(),
      ])

      setProfile(prof)
      setTokens(bal)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingEVE />
      </div>
    )
  }

  const isAdmin = profile?.email === ADMIN_EMAIL
  const bar = isAdmin ? <AdminPreviewBar mode={previewMode} onChange={setPreviewMode} /> : null
  const barOffset = isAdmin ? 'pt-9' : ''

  // Resolve which view to show
  // Admin in 'actual' mode always sees admin view — never auto-redirected to beta view
  const effectiveBeta = previewMode === 'beta' || (previewMode === 'actual' && profile?.is_beta_user && !isAdmin)
  const needsConsent  = previewMode === 'actual' && profile?.is_beta_user && !profile?.analytics_consent && !isAdmin

  // Consent gate (only in actual mode — skip when previewing)
  if (needsConsent) {
    return (
      <>
        {bar}
        <div className={barOffset}>
          <BetaConsentGate
            onAccept={() => setProfile(prev => prev ? { ...prev, analytics_consent: true } : prev)}
          />
        </div>
      </>
    )
  }

  // Beta dashboard
  if (effectiveBeta) {
    return (
      <>
        {bar}
        <div className={barOffset}>
          <BetaDashboard
            profile={profile!}
            tokens={tokens}
            onSignOut={handleSignOut}
          />
        </div>
      </>
    )
  }

  // Regular (non-beta) dashboard
  return (
    <>
      {bar}
      <div className={barOffset}>
        <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <Image src="/logo-full.png" alt="The E.V.E. Studio" width={140} height={40} className="shrink-0" />
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm text-zinc-400 truncate hidden sm:block">{profile?.email}</span>
          <button
            onClick={handleSignOut}
            className="text-sm text-zinc-500 hover:text-white transition shrink-0"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <BetaPopup isBetaUser={profile?.is_beta_user ?? false} betaExpiresAt={profile?.beta_expires_at ?? null} />

        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-zinc-500 mt-1">Your creative workspace is ready.</p>
        </div>

        {/* Token balance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-500 text-sm mb-1">VIBE Tokens</p>
            <p className="text-4xl font-bold text-violet-400">{tokens?.balance ?? 0}</p>
            <p className="text-zinc-600 text-xs mt-1">1 token = 1 script batch</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-500 text-sm mb-1">EVE Subscription</p>
            <p className="text-lg font-semibold">
              {profile?.eve_subscription_active ? (
                <span className="text-green-400">Active</span>
              ) : (
                <span className="text-zinc-400">Starter</span>
              )}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-500 text-sm mb-1">Lifetime tokens earned</p>
            <p className="text-4xl font-bold text-white">{tokens?.lifetime_earned ?? 0}</p>
          </div>
        </div>

        {/* E.V.E. Plugin banner — subscribers only */}
        {profile?.eve_subscription_active ? (
          <div className="bg-zinc-900 border border-violet-800/50 rounded-xl p-6 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-1">Premiere Pro Plugin</p>
              <p className="text-lg font-bold">E.V.E. Plugin — v1.0</p>
              <p className="text-zinc-400 text-sm mt-0.5">Access your scripts and client notes directly inside Adobe Premiere Pro.</p>
            </div>
            <a
              href="/plugin/eve-studio-plugin.zxp"
              download
              className="shrink-0 bg-violet-600 hover:bg-violet-500 transition text-white font-bold px-5 py-3 rounded-xl text-sm whitespace-nowrap"
            >
              ↓ Download Plugin
            </a>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-1">Premiere Pro Plugin</p>
              <p className="text-lg font-bold text-zinc-400">E.V.E. Plugin</p>
              <p className="text-zinc-600 text-sm mt-0.5">Upgrade to an E.V.E. subscription to unlock the Premiere Pro plugin.</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/account')}
              className="shrink-0 border border-violet-700 hover:border-violet-500 text-violet-400 hover:text-violet-300 transition font-bold px-5 py-3 rounded-xl text-sm whitespace-nowrap"
            >
              Upgrade to unlock
            </button>
          </div>
        )}

        {/* Admin — only visible to you */}
        {isAdmin && (
          <div className="mb-4">
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">Admin</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <p className="font-semibold text-violet-300">Beta Feedback</p>
                  <p className="text-zinc-500 text-sm">Reports, recommendations & activity</p>
                </div>
                <span className="text-violet-500 text-lg">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/dashboard/vibe')}
            className="bg-violet-600 hover:bg-violet-500 transition rounded-xl p-6 text-left group"
          >
            <p className="text-xl font-bold mb-1">VIBE</p>
            <p className="text-violet-200 text-sm">Generate a batch of video scripts for your client</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/themes')}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition rounded-xl p-6 text-left"
          >
            <p className="text-xl font-bold mb-1">Client Themes</p>
            <p className="text-zinc-400 text-sm">Manage your client brand profiles</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/scripts')}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition rounded-xl p-6 text-left"
          >
            <p className="text-xl font-bold mb-1">Scripts</p>
            <p className="text-zinc-400 text-sm">View, edit and restore generated scripts</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/account')}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition rounded-xl p-6 text-left"
          >
            <p className="text-xl font-bold mb-1">Account</p>
            <p className="text-zinc-400 text-sm">Billing, subscription and token purchases</p>
          </button>
        </div>
      </main>
          <FeedbackPopup />
        </div>
      </div>
    </>
  )
}
