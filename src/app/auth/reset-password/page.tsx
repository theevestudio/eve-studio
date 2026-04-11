'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Supabase automatically exchanges the token from the URL hash and creates a session.
    // We just need to wait for the auth state to settle.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    }
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

        {done ? (
          <div className="text-center">
            <p className="text-white font-bold text-xl mb-2">Password updated</p>
            <p className="text-zinc-500 text-sm">Taking you to your dashboard...</p>
          </div>
        ) : (
          <>
            <p className="text-center text-zinc-400 text-sm mb-6">Choose a new password for your account.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Confirm new password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition"
                  placeholder="Repeat your password"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              {!ready && (
                <p className="text-zinc-600 text-xs">Verifying your reset link...</p>
              )}

              <button
                type="submit"
                disabled={loading || !ready}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition text-sm"
              >
                {loading ? 'Updating...' : 'Set new password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
