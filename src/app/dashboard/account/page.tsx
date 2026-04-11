'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Profile, TokenBalance } from '@/lib/types'

const TOKEN_PACKS = [
  { tokens: 5,  price: '$4',  label: '5 tokens',  priceKey: 'TOKENS_5',  best: false },
  { tokens: 15, price: '$10', label: '15 tokens', priceKey: 'TOKENS_15', best: true  },
  { tokens: 30, price: '$18', label: '30 tokens', priceKey: 'TOKENS_30', best: false },
]

export default function AccountPage() {
  return (
    <Suspense fallback={<Shell><div className="text-zinc-500 text-sm">Loading...</div></Shell>}>
      <AccountContent />
    </Suspense>
  )
}

function AccountContent() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tokens, setTokens] = useState<TokenBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const success = searchParams.get('success')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

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

  async function handleCheckout(priceKey: string, mode: string, tokenCount: number) {
    setCheckingOut(priceKey)

    const priceMap: Record<string, string> = {
      EVE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_EVE_MONTHLY || '',
      TOKENS_5:    process.env.NEXT_PUBLIC_STRIPE_PRICE_TOKENS_5    || '',
      TOKENS_15:   process.env.NEXT_PUBLIC_STRIPE_PRICE_TOKENS_15   || '',
      TOKENS_30:   process.env.NEXT_PUBLIC_STRIPE_PRICE_TOKENS_30   || '',
    }

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: priceMap[priceKey], mode, tokens: tokenCount }),
    })

    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setCheckingOut(null)
  }

  if (loading) return <Shell><div className="text-zinc-500 text-sm">Loading...</div></Shell>

  return (
    <Shell>
      {success && (
        <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-300 rounded-xl px-5 py-4 mb-8 text-sm">
          Payment successful! Your account has been updated.
        </div>
      )}

      <h1 className="text-2xl font-bold mb-8">Account</h1>

      {/* Profile */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">Profile</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Name</span>
            <span>{profile?.full_name || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Email</span>
            <span>{profile?.email || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Member since</span>
            <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</span>
          </div>
        </div>
      </section>

      {/* Token balance */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">VIBE Tokens</h2>
        <div className="flex items-end gap-3 mb-6">
          <p className="text-5xl font-bold text-violet-400">{tokens?.balance ?? 0}</p>
          <p className="text-zinc-500 text-sm mb-1">available · {tokens?.lifetime_earned ?? 0} earned lifetime</p>
        </div>

        <p className="text-zinc-500 text-xs mb-4">Buy tokens — they never expire</p>
        <div className="grid grid-cols-3 gap-3">
          {TOKEN_PACKS.map(pack => (
            <button
              key={pack.priceKey}
              onClick={() => handleCheckout(pack.priceKey, 'payment', pack.tokens)}
              disabled={checkingOut === pack.priceKey}
              className={`relative border rounded-xl p-4 text-left transition ${
                pack.best
                  ? 'border-violet-500 bg-violet-950/30 hover:bg-violet-950/50'
                  : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900'
              } disabled:opacity-50`}
            >
              {pack.best && (
                <span className="absolute -top-2.5 left-3 text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full">Best value</span>
              )}
              <p className="text-xl font-bold">{pack.tokens}</p>
              <p className="text-zinc-400 text-xs">tokens</p>
              <p className="text-white font-semibold mt-2">{pack.price}</p>
              {checkingOut === pack.priceKey && (
                <p className="text-xs text-zinc-500 mt-1">Redirecting...</p>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Subscription */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">EVE Subscription</h2>

        {profile?.eve_subscription_active ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-emerald-400">Active — $39/month</p>
              <p className="text-zinc-500 text-sm mt-1">Full plugin access · renews monthly</p>
            </div>
            <span className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full">Active</span>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <p className="font-semibold text-lg">EVE Monthly — $39<span className="text-zinc-500 text-sm font-normal">/mo</span></p>
              <ul className="text-zinc-400 text-sm mt-2 space-y-1">
                <li>· Full E.V.E. Premiere Pro plugin access</li>
                <li>· Priority script generation</li>
                <li>· Cancel anytime</li>
              </ul>
            </div>
            <button
              onClick={() => handleCheckout('EVE_MONTHLY', 'subscription', 0)}
              disabled={checkingOut === 'EVE_MONTHLY'}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition text-white font-semibold px-5 py-2.5 rounded-lg text-sm"
            >
              {checkingOut === 'EVE_MONTHLY' ? 'Redirecting...' : 'Subscribe — $39/mo'}
            </button>
          </div>
        )}
      </section>
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
        <span className="text-sm font-semibold">Account</span>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
