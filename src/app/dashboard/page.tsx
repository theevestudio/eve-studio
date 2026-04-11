'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Profile, TokenBalance } from '@/lib/types'
import FeedbackPopup from '@/components/FeedbackPopup'
import LoadingEVE from '@/components/LoadingEVE'

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tokens, setTokens] = useState<TokenBalance | null>(null)
  const [loading, setLoading] = useState(true)
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Image src="/logo-full.png" alt="The E.V.E. Studio" width={160} height={45} />
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{profile?.email}</span>
          <button
            onClick={handleSignOut}
            className="text-sm text-zinc-500 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
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
  )
}
