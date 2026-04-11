'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <div style={{ animation: 'eve-auth-pulse 2.5s ease-in-out infinite', borderRadius: '50%' }}>
            <Image src="/logo-stacked.png" alt="The E.V.E. Studio" width={200} height={200} priority />
          </div>
          <style>{`
            @keyframes eve-auth-pulse {
              0%, 100% { filter: drop-shadow(0 0 20px rgba(139,92,246,0.5)) drop-shadow(0 0 50px rgba(124,58,237,0.25)); }
              50%       { filter: drop-shadow(0 0 45px rgba(167,139,250,0.9)) drop-shadow(0 0 90px rgba(139,92,246,0.5)); }
            }
          `}</style>
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-white font-bold text-xl mb-2">Check your email</p>
            <p className="text-zinc-500 text-sm mb-6">
              We sent a reset link to <strong className="text-white">{email}</strong>.
              Check your inbox — it may take a minute.
            </p>
            <Link href="/auth/login" className="text-violet-400 hover:text-violet-300 text-sm transition">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="text-center text-zinc-400 text-sm mb-6">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition"
                  placeholder="you@example.com"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition text-sm"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <p className="text-center text-zinc-500 text-sm mt-6">
              <Link href="/auth/login" className="text-violet-400 hover:text-violet-300 transition">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
