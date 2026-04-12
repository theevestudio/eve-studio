'use client'

import { useRouter } from 'next/navigation'

const LIFETIME_PRICE_KEY = 'EVE_LIFETIME'

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function BetaPopup({
  betaExpiresAt,
  isBetaUser,
}: {
  betaExpiresAt: string | null
  isBetaUser: boolean
}) {
  const router = useRouter()

  if (!isBetaUser || !betaExpiresAt) return null

  const daysLeft = daysUntil(betaExpiresAt)
  const expiryDate = new Date(betaExpiresAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const isExpired = daysLeft <= 0
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 14

  if (!isExpired && !isExpiringSoon) return null

  return (
    <div className={`mb-6 rounded-xl border px-6 py-5 ${
      isExpired
        ? 'bg-red-950/30 border-red-800/60'
        : 'bg-yellow-950/30 border-yellow-700/60'
    }`}>
      {isExpired ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-bold text-red-400 text-sm uppercase tracking-widest mb-1">Beta Session Expired</p>
            <p className="text-white font-semibold">Get your lifetime discount on E.V.E. now.</p>
            <p className="text-zinc-400 text-sm mt-1">
              Lock in <span className="text-violet-400 font-semibold">$29/month forever</span> — your founding member rate. Renews at $39/mo if you wait.
            </p>
          </div>
          <button
            onClick={() => router.push(`/dashboard/account?checkout=${LIFETIME_PRICE_KEY}`)}
            className="shrink-0 bg-violet-600 hover:bg-violet-500 transition text-white font-bold px-5 py-2.5 rounded-xl text-sm"
          >
            Get $29/mo →
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-bold text-yellow-400 text-sm uppercase tracking-widest mb-1">
              Beta Session Expires {expiryDate}
            </p>
            <p className="text-white font-semibold">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your beta access.</p>
            <p className="text-zinc-400 text-sm mt-1">
              Subscribe at <span className="text-violet-400 font-semibold">$29/month</span> before it expires to lock in your founding member rate forever.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => router.push('/dashboard/plugin')}
              className="border border-zinc-600 hover:border-zinc-400 transition text-zinc-300 font-semibold px-4 py-2.5 rounded-xl text-sm"
            >
              Extend Beta
            </button>
            <button
              onClick={() => router.push(`/dashboard/account?checkout=${LIFETIME_PRICE_KEY}`)}
              className="bg-violet-600 hover:bg-violet-500 transition text-white font-bold px-5 py-2.5 rounded-xl text-sm"
            >
              Get $29/mo →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
